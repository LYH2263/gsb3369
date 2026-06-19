# 电商系统结算与订单逻辑分析

---

#### 1. 勾选结算语义
- **后端未校验购物车归属**：`createOrder` 方法仅校验图书是否存在（`backend/src/main/java/com/example/bookstore/service/OrderService.java:110-113`），从未查询 `cart_items` 表验证提交的 `bookId` 是否确实属于当前用户购物车。
- **绕过前端可任意下单**：直接构造 `POST /api/orders` 请求体，传入任意 `bookId` 和数量即可下单，无需该商品在购物车中存在，行为与「勾选购物车商品结算」预期完全不一致。
- **`createOrderFromCart` 差异**：该方法从购物车全量读取所有商品（`backend/src/main/java/com/example/bookstore/service/OrderService.java:71`），且下单后清空整个购物车（`backend/src/main/java/com/example/bookstore/service/OrderService.java:100`），不支持「部分勾选」；但它至少保证商品来自购物车。
- **核心风险**：
  1. 用户可绕过购物车直接购买任意商品（虽然不是严重安全漏洞，但破坏业务语义）；
  2. 用户可能提交不在购物车中的商品ID，导致价格按数据库实时计算而非购物车展示价格（价格不一致风险）；
  3. 下单后删除购物车商品使用 `deleteByUserAndBook`（`backend/src/main/java/com/example/bookstore/service/OrderService.java:138`），而非按购物车项ID删除，存在误删风险。

---

#### 2. 边界行为
- **未勾选商品保留**：`createOrder` 在每个商品成功扣库存后调用 `deleteByUserAndBook`（`backend/src/main/java/com/example/bookstore/service/OrderService.java:138`），仅删除本次下单的 `bookId` 对应购物车记录，未勾选商品不受影响，正确保留。
- **重复 `bookId` 扣库存**：
  - 请求 `items` 含重复 `bookId` 时，循环会重复执行 `decreaseStock`，每次独立扣减；
  - 若两次扣减总和超过库存，第二次 `decreaseStock` 返回 0 抛出异常（`backend/src/main/java/com/example/bookstore/service/OrderService.java:135-137`）；
  - 但价格会被重复累加（`backend/src/main/java/com/example/bookstore/service/OrderService.java:115`），导致订单总金额错误，且第一个 `OrderItem` 已入库（在事务回滚前）。
- **库存不足时最终状态**：
  - `@Transactional` 标注在方法上（`backend/src/main/java/com/example/bookstore/service/OrderService.java:105`），抛出 `IllegalStateException` 时 Spring 回滚整个事务；
  - `decreaseStock` 是条件SQL（`backend/src/main/java/com/example/bookstore/mapper/BookMapper.java:33`）：`stock >= quantity` 时才更新，原子性安全；
  - 但回滚仅在异常抛出时生效：
    - 已插入的 `Order` 记录回滚；
    - 已插入的前N个 `OrderItem` 回滚；
    - 已成功扣减的前N个商品库存回滚；
    - 购物车删除操作也回滚；
  - 最终一致状态：订单不存在、库存不变、购物车不变。

---

#### 3. 越权风险
- **更新/删除接口无归属校验**：
  - `PUT /api/cart/{id}`（`backend/src/main/java/com/example/bookstore/web/CartController.java:41-46`）仅接收路径变量 `id`，直接调用 `updateQuantity(id, quantity)`，未查询该购物车项的 `user_id` 是否匹配请求头 `X-USER-ID`；
  - `DELETE /api/cart/{id}`（`backend/src/main/java/com/example/bookstore/web/CartController.java:48-52`）同样问题，无用户归属校验；
  - `CartService` 层（`backend/src/main/java/com/example/bookstore/service/CartService.java:39-46`）也未校验，直接透传给Mapper。
- **伪造请求头可越权**：
  - 系统完全信任 `X-USER-ID` 和 `X-ROLE` 请求头，无签名或token验证；
  - 任意用户只需设置 `X-USER-ID: <其他用户ID>` 即可操作他人购物车（修改数量、删除商品）；
  - 甚至可遍历购物车项ID（自增整数）批量操作任意用户购物车。
- **与OrderController不一致**：
  - `OrderController.getOrder` 有二次校验（`backend/src/main/java/com/example/bookstore/service/OrderService.java:62-64`）：非管理员时验证 `order.getUserId().equals(userId)`；
  - `OrderController` 的管理员校验在Controller层（`backend/src/main/java/com/example/bookstore/web/OrderController.java:62-64`）拦截ADMIN下单；
  - `CartController` 只有 `add` 接口校验了ADMIN角色（`backend/src/main/java/com/example/bookstore/web/CartController.java:34-36`），update/delete接口**甚至没有**角色校验，更没有归属校验。

---

#### 4. 失败与状态同步
- **事务回滚机制**：
  - `@Transactional` 默认只对 `RuntimeException` 回滚，`IllegalStateException` 是RuntimeException子类，正常回滚；
  - 多商品下单时，若第N个商品库存不足，前N-1个商品的库存扣减、订单插入、订单项插入、购物车删除全部回滚；
  - 注意：`decreaseStock` 本身是原子条件更新（`backend/src/main/java/com/example/bookstore/mapper/BookMapper.java:33`），不会超卖，但整个逻辑依赖事务回滚。
- **前端无法区分失败原因**：
  - `handleCheckout` 的 `catch` 块统一显示「下单失败」（`frontend/src/pages/CartPage.tsx:107-109`）；
  - 没有捕获异常类型或HTTP状态码（400/500），无法区分是库存不足、图书不存在、网络错误还是服务器异常；
  - 后端抛出的 `IllegalArgumentException` 和 `IllegalStateException` 也无统一异常处理，可能返回500而非友好错误码。
- **`setOrderCount` 导致UI不一致**：
  1. **重复点击重复下单**：结算按钮无loading/disabled状态，用户快速点击多次会触发多次并发 `createOrder` 请求：
     - 第一次请求成功：创建订单、计数+1、购物车刷新；
     - 后续请求在并发下可能因库存仍充足而再次成功，导致创建多个重复订单、计数多次+1；
     - 即使后续请求失败，第一个订单已创建但前端无防重机制。
  2. **乐观更新不同步**：`setOrderCount(prev => prev + 1)`（`frontend/src/pages/CartPage.tsx:106`）是客户端计数，未从服务端重新拉取实际订单数，若其他设备/页面已创建订单，计数会出现偏差；
  3. **部分失败状态不一致**：计数放在 `try` 块内 `await createOrder` 成功后才执行，失败不会计数，这一点正确；但 `createOrder` 成功后若 `load()` 刷新购物车失败（网络异常），订单已创建但计数已+1，购物车页面未刷新，UI状态不一致；
  4. **选中状态残留**：下单成功后 `load()` 重新拉取购物车并重置 `selectedIds`，但在极短时间内用户仍可能看到旧的选中状态。
