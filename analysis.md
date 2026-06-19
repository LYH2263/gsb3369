#### 1. 勾选结算语义分析

- **后端是否校验商品来源于用户购物车**：否。`OrderService.createOrder` 仅按请求体中的 `bookId` 与 `quantity` 通过 `bookMapper.findById` 查图书并下单，全程未与 `cartItemMapper` 校验该 `bookId` 是否属于当前 `userId` 的购物车（参见 backend/src/main/java/com/example/bookstore/service/OrderService.java:106-142）。
- **绕过前端是否仍可成功**：可以。攻击者可直接构造 `POST /api/orders` 请求体（任意 `bookId`、任意 `quantity`），只要图书存在且库存充足即可下单，与「勾选结算」语义不一致——前端语义是「在购物车已有项中勾选并结算」（frontend/src/pages/CartPage.tsx:97-103），后端则退化为「任意下单」。
- **副作用差异**：`createOrder` 在每个 OrderItem 写入后调用 `cartItemMapper.deleteByUserAndBook(userId, bookId)`（OrderService.java:138），即便该 bookId 原本不在购物车也不会报错（删除 0 行不抛异常），但若用户此前确实有同 bookId 的购物车行，会被「副作用式」清掉，可能与前端勾选状态不一致。
- **与 `createOrderFromCart` 对比**：
  - 数据源不同：`createOrderFromCart` 从 `cartItemMapper.findByUserId` 读取作为权威源（OrderService.java:71），不接受外部 `bookId` 列表；`createOrder` 信任客户端入参。
  - 价格一致：两者都以 `book.getPrice()` 为准（OrderService.java:78、114），不直接信任前端价格。
  - 购物车清理粒度：前者整体 `deleteByUserId`（OrderService.java:100），与「全量结算」匹配；后者按 bookId 删除（OrderService.java:138），与「部分勾选」更契合，但因缺少归属校验存在风险。
- **风险定性**：`createOrder` 缺少购物车归属校验属越权/绕过类风险，可被用于「未加入购物车直接下单」「越过库存预留逻辑」等异常路径。

#### 2. 边界行为分析

- **未勾选商品保留情况**：`createOrder` 仅对参与下单的 bookId 调用 `cartItemMapper.deleteByUserAndBook`（OrderService.java:138），未勾选商品对应的购物车行不会被删除，符合预期保留语义；前端在成功后调用 `load()` 重新拉取（CartPage.tsx:105）刷新视图。
- **重复 `bookId` 时的库存扣减**：`createOrder` 不做去重，直接按 `request.getItems()` 顺序逐条处理（OrderService.java:109-121、131-139）。每条都会执行 `bookMapper.decreaseStock(bookId, quantity)`，即同一 bookId 出现 N 次会触发 N 次条件 UPDATE，库存被多次扣减，OrderItem 也会写入 N 行。如恶意客户端将同一勾选项重复提交，可放大扣库存效果，且前端 `total` 会因小计重复而虚高。
- **库存不足时的最终状态（结合 `@Transactional` 与条件 SQL）**：
  - `decreaseStock` 是条件 UPDATE：`UPDATE books SET stock = stock - #{quantity} WHERE id = #{bookId} AND stock >= #{quantity}`（backend/src/main/java/com/example/bookstore/mapper/BookMapper.java:33-34），库存不足或图书不存在均返回 0 行。
  - 服务层据此抛出 `IllegalStateException`（OrderService.java:135-137），方法标注 `@Transactional`（OrderService.java:105），未捕获的运行时异常会触发回滚：已 `INSERT` 的 `orders`、`order_items`、之前几个项目的 `decreaseStock` 扣减、以及 `cartItemMapper.deleteByUserAndBook` 的删除全部回滚。
  - 因此「订单/库存/购物车」一致性可保证：要么全部成功、要么全部回退。前端在 `catch` 后仅显示「下单失败」（CartPage.tsx:107-108），不会破坏后端一致性。
- **隐患**：异常类型为 `IllegalStateException`，默认会被全局异常处理器映射为 5xx，前端未做错误码区分（见第 4 题）。

#### 3. 越权风险分析

- **更新接口 `PUT /api/cart/{id}`**：仅接收路径上的 `id` 与 `quantity`，没有读取 `X-USER-ID`，也未在 service 层校验 `cartItem.userId == 当前用户`（CartController.java:41-46）。任意已认证用户只要知道或猜出 `id`，即可修改他人购物车行数量。
- **删除接口 `DELETE /api/cart/{id}`**：同样未带 `X-USER-ID`、未校验归属（CartController.java:48-52），存在跨用户越权删除风险。
- **`POST /api/cart` 与 `DELETE /api/cart/clear`**：`add` 通过 `X-ROLE` 拒绝管理员（CartController.java:34-36），`clear` 至少使用 `X-USER-ID`（CartController.java:55），但仍信任请求头本身。
- **伪造请求头**：因鉴权完全依赖 `X-USER-ID`/`X-ROLE`（明文请求头），无签名/JWT 校验，任何能直接发起 HTTP 请求的客户端都能伪造身份。结合更新/删除接口缺失归属校验，这是双重失守：一是身份本身可冒充，二是即使身份真实也能跨行操作。
- **与 `OrderController` 的不一致**：
  - `OrderController` 在 `from-cart`、`POST /api/orders` 中都明确拒绝 `ADMIN`（OrderController.java:48-50、62-64），`getOrder` 在 service 层做了 `userId` 归属校验（OrderService.java:62-64）。
  - `CartController` 的 `update`/`delete` 既没有管理员拦截，也没有归属校验，规则比订单侧更宽松；同时 `add` 拦截 ADMIN 的口径在 `update`/`delete`/`clear` 中又消失，三者互不一致。
- **建议方向**（不做实现，仅指出修复方向）：让 `update`/`delete` 也读取 `X-USER-ID` 并在 service 中校验 `cartItem.getUserId().equals(userId)`；统一管理员拦截策略；底层应替换为可信鉴权（JWT/Session）。

#### 4. 失败与状态同步分析

- **事务回滚路径**：`createOrder` 在 `@Transactional` 内部按顺序写 order → 循环写 order_item + 扣库存 + 删购物车行。任一 `decreaseStock` 返回 0 即抛 `IllegalStateException`（OrderService.java:135-137），Spring 默认对未检异常回滚，所有此前 INSERT/UPDATE/DELETE 都会撤销，数据库层面达到原子性。
- **失败原因区分能力**：前端 `handleCheckout` 的 `catch` 块只接住一个无入参分支并 `showToast('下单失败')`（CartPage.tsx:107-109），没有读取 HTTP 状态码或后端 message。后端实际可能产生 400（图书不存在 → `IllegalArgumentException`，OrderService.java:111-113）或 500（库存不足 → `IllegalStateException`），用户无法分辨「书已下架」「库存不足」「网络异常」「鉴权失败」等场景。
- **`setOrderCount(prev => prev + 1)` 的 UI 不一致**：
  - 仅在 `try` 成功路径执行（CartPage.tsx:106），失败时不增加，方向上正确；但它是基于本地 `prev` 自增，未与后端真实订单数对齐，长期使用会与后端实际计数漂移。
  - 重复点击：按钮没有 `disabled`/loading 锁（CartPage.tsx:129-137），网络较慢时用户连点会发起多次 `createOrder`，后端会创建多个订单（每次都扣库存），前端 `setOrderCount` 也会多次 +1。即便其中部分 401/500 失败，也已经产生不可恢复的副作用（重复扣款/重复扣库存）。
  - 失败时计数虽然没加，但 `items` 仍以最新一次 `load()` 为准；若失败发生在 `load()` 之前（throw 后未执行 105 行的 `await load()`），购物车视图与后端可能瞬时不一致。
- **建议方向**（不做实现，仅指出修复方向）：
  - 提交期间禁用按钮，加 `submitting` 状态防重复点击。
  - `catch (e)` 读取 axios 错误的 `response.status`/`data.message`，分类提示。
  - 成功后用 `await refreshCounts()` 重新拉权威值，而非本地自增。
  - 后端为「库存不足」「图书不存在」定义稳定的业务错误码（如 4xx + code），便于前端对齐文案。
