# 电商系统结算与订单逻辑分析

---

#### 1. 勾选结算语义：后端未校验购物车归属

- 前端仅提交勾选商品：`frontend/src/pages/CartPage.tsx:97-103` 通过 `selectedIds` 过滤后，将选中项的 `bookId` 和 `quantity` 组装为请求体发送至 `POST /api/orders`，未携带购物车条目 ID（`cartItem.id`）。
- `createOrder` 不校验商品来自用户购物车：`backend/src/main/java/com/example/bookstore/service/OrderService.java:109-121` 直接遍历请求中的 `items`，通过 `bookMapper.findById` 查询图书，未调用 `cartItemMapper` 验证这些 `bookId` 是否存在于当前用户的购物车中。
- 绕过前端的行为与「勾选结算」预期不一致：攻击者可直接构造请求体，携带任意 `bookId`（包括不在自己购物车中的图书）下单，系统会正常扣库存、生成订单。`OrderService.java:138` 的 `cartItemMapper.deleteByUserAndBook` 对购物车中不存在的图书仅返回 0 行受影响，不会报错。
- 与 `createOrderFromCart` 的差异与风险：
  - `createOrderFromCart`（`OrderService.java:70-103`）从 `cartItemMapper.findByUserId` 读取全量购物车商品下单，下单后调用 `deleteByUserId` 清空购物车；仅支持「全选结算」。
  - `createOrder` 支持部分勾选但缺少购物车归属校验，导致可购买任意图书（越权下单未加入购物车的商品）；且使用 `deleteByUserAndBook` 而非 `deleteByUserId`，在部分下单场景下语义正确，但无法防御构造请求攻击。

---

#### 2. 边界行为：未勾选商品保留，重复bookId与库存不足场景

- **未勾选商品保留**：`OrderService.java:138` 在循环中逐商品调用 `cartItemMapper.deleteByUserAndBook(userId, item.getBookId())`，仅删除请求中包含的图书对应的购物车条目；未出现在请求中的商品（即未勾选商品）不受影响，下单后仍保留在购物车中。
- **`items` 含重复 `bookId` 时的扣库存行为**：
  - `OrderService.java:109-121` 不做去重，会为同一个 `bookId` 创建两条 `OrderItem` 记录；`OrderService.java:134` 对同一 `bookId` 连续调用两次 `decreaseStock`。
  - `BookMapper.java:33` 的 SQL 为 `SET stock = stock - #{quantity} WHERE id = #{bookId} AND stock >= #{quantity}`，是逐次条件扣减，不校验累计数量。
  - 若两次扣减各自满足 `stock >= quantity` 但累计超量（如库存 5，两次各扣 3），第一次扣减成功（stock→2），第二次因 `2 >= 3` 失败返回 0，抛出 `IllegalStateException`，事务回滚，不会产生超卖。
  - 若两次扣减均成功，订单中会出现同一本书的两条明细，金额被重复计算，且第二次 `deleteByUserAndBook` 为幂等空操作，产生脏数据。
- **库存不足时的最终状态**：
  - `OrderService.java:105` 标注了 `@Transactional`，`decreaseStock` 返回 0 时抛出的 `IllegalStateException` 属于 `RuntimeException`，触发事务回滚。
  - 回滚范围包括：已插入的 `Order` 记录、已插入的 `OrderItem` 记录、已成功扣减的库存（前序商品的 stock 变更恢复）、已删除的购物车条目（前序商品的 cart_item 恢复）。
  - 因此库存不足时，订单/库存/购物车均回到下单前状态，后端保持原子一致性。但前端在失败场景下仍有 UI 问题（见第 4 问）。

---

#### 3. 越权风险：CartController缺少归属校验，与OrderController不一致

- **`PUT /{id}` 和 `DELETE /{id}` 未校验购物车行归属**：
  - `backend/src/main/java/com/example/bookstore/web/CartController.java:41-46`（update）和 `CartController.java:48-52`（delete）仅从 URL 路径获取购物车条目 `id`，未从请求头提取 `X-USER-ID`，也未传入 service 层做归属校验。
  - `backend/src/main/java/com/example/bookstore/service/CartService.java:38-46` 直接调用 `cartItemMapper.updateQuantity(cartItemId, quantity)` 和 `cartItemMapper.delete(cartItemId)`，SQL 语句 `CartItemMapper.java:33-37` 的 WHERE 条件仅有 `id = #{id}`，无 `user_id` 约束。
  - 结果：任意用户只要知道（或枚举）购物车条目 ID，即可修改或删除其他用户的购物车商品，属典型的水平越权（IDOR）。
- **伪造请求头的越权能力**：
  - 系统完全信任 `X-USER-ID` 和 `X-ROLE` 请求头，无签名/Token 机制。伪造 `X-USER-ID: 2` 即可浏览/操作用户 2 的购物车（`CartController.java:25-27,55-57` 均直接使用 header 中的 userId）。
  - 伪造 `X-ROLE: ADMIN` 可绕过 `POST /api/cart`（`CartController.java:34`）、`POST /api/orders`（`OrderController.java:62`）等管理员拦截。但管理员拦截本身是反向的（禁止管理员下单），伪造 ADMIN 头在购物车场景反而被拒绝，更严重的风险是伪造其他用户的 `X-USER-ID` 冒充身份。
- **与 `OrderController` 的不一致**：
  - `OrderController.java:25-31`（list）和 `OrderController.java:34-43`（get）虽然也信任请求头，但 service 层在 `OrderService.java:38` 和 `OrderService.java:62` 对非管理员做了数据范围限制（非管理员只能查自己 userId 的订单）。
  - `CartController` 的 update/delete 接口在 controller 层和 service 层均无归属校验，`list`/`clear` 仅依赖请求头 userId（可伪造），但 update/delete 连 userId 都不接收，越权门槛更低。
  - `CartController` 的 `PUT`/`DELETE` 完全没有 `X-ROLE` 管理员检查，而 `POST`（add）有，权限检查不统一。

---

#### 4. 失败与状态同步：事务回滚但前端UI不一致

- **多商品下单中途库存不足的事务回滚**：`OrderService.java:105` 的 `@Transactional` 保证一旦某商品 `decreaseStock` 返回 0 并抛出异常，整个事务回滚，已插入的订单、已扣减的前序商品库存、已删除的前序购物车条目全部恢复，后端数据最终一致。
- **前端 `catch` 无法区分失败原因**：
  - `frontend/src/pages/CartPage.tsx:107-109` 的 catch 块统一显示「下单失败」，未根据 HTTP 状态码或错误信息区分原因。
  - 可能的失败原因包括：网络异常、403（管理员被拒）、400（空请求体）、500（库存不足 `IllegalStateException`、图书不存在 `IllegalArgumentException`、服务端异常）等，用户无法得知是库存不足还是网络问题。
- **`setOrderCount(prev => prev + 1)` 导致的 UI 数据不一致**：
  - **重复点击无防护**：结算按钮在 `handleCheckout` 执行期间没有 disabled/loading 状态（`CartPage.tsx:129-137` 按钮的 disabled 仅绑定 `isAdmin`），用户可连续快速点击，触发多次 `POST /api/orders` 请求。若库存充足，会创建多个重复订单，`setOrderCount` 被多次调用，订单数正确但产生重复订单；若库存只够一份，第一个请求成功后扣减库存，后续请求因库存不足失败，前端会交替显示「下单成功」和「下单失败」，用户体验混乱。
  - **乐观更新与 load() 失败的不一致**：`CartPage.tsx:105-106` 中 `await load()` 在 `setOrderCount` 之前执行，若 `createOrder` 成功但 `load()`（重新拉取购物车）因网络问题抛出异常，流程进入 catch，`setOrderCount` 不会执行，导致服务端已创建订单但前端订单角标计数未增加；下次页面刷新时才会同步，期间用户看不到新订单的计数。
  - **失败场景下的 count 偏移**：在极端竞态条件下（重复点击 + 部分失败），某些请求可能在服务端成功但前端因超时进入 catch，`setOrderCount` 未执行，导致订单计数少于实际订单数。
