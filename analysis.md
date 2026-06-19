# 电商系统购物车与订单模块分析

---

## 1. 勾选结算语义

#### 后端未校验商品归属购物车

- 前端在 [CartPage.tsx:97-103](file:///d:/Agsb/Agsb616/gsb3369/frontend/src/pages/CartPage.tsx#L97-L103) 仅将 `selectedIds` 对应的 `{bookId, quantity}` 提交给 `POST /api/orders`，**没有传递购物车行 ID**，请求体与购物车仅靠前端过滤逻辑产生弱关联。
- 后端 `createOrder` 方法在 [OrderService.java:109-121](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L109-L121) 按请求体中的 `bookId` 直接调用 `bookMapper.findById` 查询图书，**完全不查询 `cartItemMapper`**，既不校验这些书是否在用户购物车中，也不比对请求数量是否与购物车数量一致。
- 订单写入完成后，[OrderService.java:138](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L138) 只做了 `cartItemMapper.deleteByUserAndBook(userId, bookId)`——按 `bookId` 删除该用户购物车中该图书的**整行**记录，与请求中实际下单数量无关。

#### 直接构造请求体的行为差异

- **绕过前端直接请求 `POST /api/orders`**，请求体可携带任意 `bookId`（包括未加入购物车的图书、甚至其他用户正在浏览的图书）和任意 `quantity`，后端会正常创建订单并扣减库存，行为完全偏离「勾选购物车商品结算」的语义。
- 如果购物车中书 A 数量为 5，但伪造请求体下单数量为 100，后端依然扣减 100 件库存（受库存上限约束），随后把购物车中书 A 的整行删掉，用户购物车残留状态与实际购买记录无法对应。
- 前端传入的数量在服务端未经过购物车数量上界校验，存在**超量购买**风险。

#### 与 `createOrderFromCart` 的差异与风险

| 维度 | `createOrder` (前端使用) | `createOrderFromCart` |
|---|---|---|
| 数据来源 | 信任请求体中的 `bookId/quantity` | 通过 [OrderService.java:71](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L71) `cartItemMapper.findByUserId` 从购物车读取 |
| 部分勾选 | 支持（前端过滤） | **不支持**，一次性结算购物车全部商品 |
| 归属校验 | 无 | 天然保证只购买自己购物车中的商品 |
| 购物车清理 | 按 `bookId` 逐本删除整行（[OrderService.java:138](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L138)） | 删除整个用户购物车（[OrderService.java:100](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L100)） |
| 核心风险 | 可伪造请求购买任意图书/任意数量 | 无法勾选，全买或全不买 |

- 结论：`createOrder` 把「购物车勾选」的安全语义完全寄托在前端，后端零校验，构成 **BOLA（Broken Object Level Authorization）/业务逻辑绕过** 漏洞。

---

## 2. 边界行为

#### 部分商品下单后未勾选商品是否保留

- 保留。`createOrder` 的购物车清理发生在循环内部，按本次订单涉及的每个 `bookId` 调用 `deleteByUserAndBook` 删除（[OrderService.java:138](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L138)）。
- 未勾选商品的 `bookId` 不在请求体中，因此不会被 `deleteByUserAndBook` 命中，`cart_items` 表中对应行保持不变，符合预期。
- **副作用**：被勾选但下单数量小于购物车数量时（例：购物车中 5 件，前端因某种原因传了 2 件），购物车行仍被整行删除，剩余 3 件购物车记录丢失。

#### `items` 含重复 `bookId` 时的扣库存行为

- 后端没有对请求体做去重。循环会对每个 `Item` 顺序执行：
  1. [OrderService.java:133](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L133) 插入 `order_item`；
  2. [OrderService.java:134](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L134) 调用 `decreaseStock`；
  3. [OrderService.java:138](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L138) 删除该 `bookId` 的购物车行。
- 第二次遇到同一 `bookId` 时，`decreaseStock` 会在第一次扣减后的剩余库存上再扣一次（SQL 为条件更新，见 [BookMapper.java:33](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/mapper/BookMapper.java#L33)）。库存充足时两条 `order_item` 都会落库，造成**同一本书在一笔订单中出现两条明细、合计数量累加**，金额计算也被重复累加（[OrderService.java:115](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L115)）。第二次 `deleteByUserAndBook` 因行已删为无操作。

#### 库存不足时的最终状态

- `createOrder` 标注了 `@Transactional`（[OrderService.java:105](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L105)）。
- `decreaseStock` 使用条件 `UPDATE ... WHERE stock >= #{quantity}`（[BookMapper.java:33](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/mapper/BookMapper.java#L33)），库存不足时返回 0。
- 返回 0 时抛出 `IllegalStateException`（[OrderService.java:136](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L136)），触发事务回滚，**最终状态**：
  - **订单**：`orders` 表中本笔订单头（已在 [OrderService.java:129](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L129) 插入）随事务回滚而消失；
  - **库存**：先前已扣减过的其他商品库存也被回滚，无部分成功；
  - **购物车**：已执行过的 `deleteByUserAndBook` 也一并回滚，购物车保持原样；
  - **异常细节**：抛出的是运行时异常 `IllegalStateException`，Spring 默认将其转为 500 响应。
- 这是「全有或全无」的原子行为，数据一致性上是正确的；问题在于服务端无法区分「图书不存在」「库存不足」「参数错误」给前端不同的状态码，前端一律看到失败。

---

## 3. 越权风险

#### `CartController` 更新/删除接口未校验归属

- `PUT /api/cart/{id}`（[CartController.java:41-46](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/CartController.java#L41-L46)）：方法签名中**没有** `@RequestHeader("X-USER-ID")` 参数，直接把路径变量 `id` 传给 `cartService.updateQuantity`，最终执行的 SQL 是 `UPDATE cart_items SET quantity=? WHERE id=?`（[CartItemMapper.java:33-34](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/mapper/CartItemMapper.java#L33-L34)），**完全不校验 `user_id`**。
- `DELETE /api/cart/{id}`（[CartController.java:48-52](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/CartController.java#L48-L52)）：同样不读取 `X-USER-ID`，SQL 为 `DELETE FROM cart_items WHERE id=?`（[CartItemMapper.java:36-37](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/mapper/CartItemMapper.java#L36-L37)），任意用户可以删除任意他人购物车行。
- 对比之下，`GET /api/cart`、`POST /api/cart`、`DELETE /api/cart/clear` 均正确接收了 `X-USER-ID`（[CartController.java:25](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/CartController.java#L25), [L30](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/CartController.java#L30), [L55](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/CartController.java#L55)），但这几个接口的用户身份同样来自可伪造的请求头（见下条）。

#### 伪造 `X-USER-ID` / `X-ROLE` 即可越权

- 前端通过 axios 拦截器把 localStorage 中的用户信息直接写入请求头（[client.ts:28-35](file:///d:/Agsb/Agsb616/gsb3369/frontend/src/api/client.ts#L28-L35)），后端**没有任何 Filter / Interceptor / Spring Security 配置**校验签名或 Token。
- 攻击者只需要在 curl/Postman 里手动设置 `X-USER-ID: 1`、`X-ROLE: ADMIN`，即可：
  - 查看/清空任意用户购物车（`GET /api/cart`、`DELETE /api/cart/clear` 信任 `X-USER-ID`）；
  - 查看任意用户订单（`OrderService.listOrdersPaged` 中 `admin=true` 分支，[OrderService.java:47-49](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L47-L49)）；
  - 查看任意订单明细（`getOrder` 中 `admin=true` 跳过归属校验，[OrderService.java:62-64](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L62-L64)）；
  - 直接以他人身份下单（`createOrder` 使用请求头里的 `userId` 作为订单归属，[OrderController.java:59](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/OrderController.java#L59)）。

#### 与 `OrderController` 管理员拦截的不一致

- `OrderController` 的 `POST /api/orders` 与 `POST /api/orders/from-cart` 都显式拒绝 `X-ROLE=ADMIN`（[OrderController.java:48-50](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/OrderController.java#L48-L50), [L62-64](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/OrderController.java#L62-L64)），`GET` 接口通过 `admin` 标志位放大查询范围——**即 OrderController 至少把"是否管理员"当成一个显式分支条件处理**。
- `CartController` 中只有 `POST /api/cart` 做了 `ADMIN` 拦截（[CartController.java:34-36](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/CartController.java#L34-L36)）；最敏感的 `PUT /{id}` 与 `DELETE /{id}` **既没有角色拦截，也没有归属校验**——这是与 OrderController 最显著的不一致。
- 更根本的不一致在于：所有身份信息均来自客户端可伪造的请求头，OrderController 的"管理员拦截"只能阻止攻击者主动声明自己是 ADMIN，**无法阻止攻击者声明自己是其他 USER**。

---

## 4. 失败与状态同步

#### 多商品下单中途库存不足时的事务回滚

- 如问题 2 所述，`createOrder` 上有 `@Transactional`（[OrderService.java:105](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L105)），任意一次 `decreaseStock` 返回 0 即抛 `IllegalStateException`（[OrderService.java:135-137](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L135-L137)），事务标记为 rollback-only，先前已插入的 `orders` 行、`order_items` 行、已扣减的库存、已删除的购物车行**全部回滚**，不会出现"前 N-1 个商品扣了库存、第 N 个失败"的部分提交。
- 异常从 Service 抛出到 Controller 未被捕获，Spring 默认返回 500 Internal Server Error；注意 `createOrderFromCart` 路径下错误信息同为"库存不足或图书不存在"（[OrderService.java:97](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L97)），响应形态一致但缺少语义化状态码（应使用 409/422）。

#### 前端 `catch` 无法区分失败原因

- `handleCheckout` 的 catch 块（[CartPage.tsx:107-109](file:///d:/Agsb/Agsb616/gsb3369/frontend/src/pages/CartPage.tsx#L107-L109)）是空参数 `catch { showToast('下单失败') }`，**不读取 `error` 对象**，以下情况全部显示同一条"下单失败"：
  - 网络不通 / 后端宕机（axios 网络错误）；
  - 管理员身份被 403 拦截（理论上按钮已 disabled，但通过 localStorage 篡改仍可能触发）；
  - 请求体空返回 400（`items.isEmpty()` 返回 null，Controller 回 400，[OrderController.java:66-68](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/web/OrderController.java#L66-L68)）；
  - 库存不足抛 500；
  - 图书不存在抛 500（`IllegalArgumentException`，[OrderService.java:112](file:///d:/Agsb/Agsb616/gsb3369/backend/src/main/java/com/example/bookstore/service/OrderService.java#L112)）。
- 用户无法知道是库存不够还是图书已下架，影响后续操作决策。

#### `setOrderCount(prev => prev + 1)` 导致的 UI 不一致

- 乐观递增发生在 `await createOrder()` 与 `await load()` **都成功之后**（[CartPage.tsx:98-106](file:///d:/Agsb/Agsb616/gsb3369/frontend/src/pages/CartPage.tsx#L98-L106)），纯下单失败不会误增计数，这一点是对的。但仍存在以下问题：
  1. **重复点击造成重复下单**：提交按钮在请求期间**没有 loading/disabled 状态**（按钮上的 `disabled={isAdmin}` 只看管理员身份，不看请求进行中，[CartPage.tsx:130-134](file:///d:/Agsb/Agsb616/gsb3369/frontend/src/pages/CartPage.tsx#L130-L134)）。用户快速双击会并发发出两个相同请求：
     - 若库存足够两倍数量，两笔订单都会成功，`setOrderCount` 也加 2，**订单列表真的多出两笔**（重复订单，用户并未察觉）；
     - 若库存只够一次，第一个请求成功（计数 +1），第二个请求 500 失败（计数不再加），用户看到一次"下单成功"提示，但事实上已经成功一次，表面上看"对的"，但订单列表里可能只有一条（正常），也可能因并发时序异常。
  2. **`load()` 失败导致计数与服务端不一致**：下单成功后 `await load()`（[CartPage.tsx:105](file:///d:/Agsb/Agsb616/gsb3369/frontend/src/pages/CartPage.tsx#L105)）若网络抖动抛错，流程进入 catch，不再执行 `setOrderCount`。服务端已成功创建订单并清空相关购物车行，但前端既不刷新购物车也不更新订单角标，用户看到"下单失败"的提示，实际订单已落库。
  3. **本地计数不与服务端对账**：`setOrderCount` 只做本地自增，未在任何地方（比如进入订单页时）重新拉取总数。如果用户在另一个浏览器/设备上下单、或管理员后台更改订单，当前标签页角标永远落后，直到刷新。
  4. **下单成功后 `load()` 重置 `selectedIds`**：`load()` 内部把 `selectedIds` 设置为新购物车全部行 ID（[CartPage.tsx:24](file:///d:/Agsb/Agsb616/gsb3369/frontend/src/pages/CartPage.tsx#L24)），而下单后被选中的商品已从购物车删除，剩下的是未勾选商品——此时它们反而被全部勾选。用户如果紧接着再次点击结算，会把之前"不想买"的残余商品一并下单，与前一次"部分勾选"语义冲突。
