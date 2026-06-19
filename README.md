# 图书商城（Label-3369）

基于 Spring Boot + Spring MVC + MyBatis + React + Tailwind 的简易图书商城示例项目，包含登录注册、角色权限（管理员/普通用户）、图书管理、分页展示、购物车勾选结算与订单分页管理等功能，并提供完整 Docker 容器化与基础单元测试。

## 🛠 技术栈

- **Frontend**: React 18、Vite、TypeScript、Tailwind CSS、React Router、Axios、Vitest
- **Backend**: Spring Boot 2.7、Spring MVC、MyBatis、Hibernate Validator、JUnit5
- **Database**: MySQL 8.0

核心 SSM 特性示例（部分文件）：
- Spring IoC/DI 与 `@Service`：`AuthService`、`BookService`、`CartService`、`OrderService`
- Spring MVC 注解驱动与数据绑定：`AuthController`、`BookController`、`CartController`、`OrderController`
- Spring 声明式事务：服务层 `@Transactional`（下单时扣减库存、清空购物车）
- MyBatis 注解 Mapper 与主键回填：`BookMapper`、`OrderMapper`、`OrderItemMapper`
- MyBatis 关联查询与对象映射：`CartItemMapper` 中购物车与图书联查

前端交互特性概览：
- **权限与入口**：管理员登录后不展示购物车导航入口、图书列表不展示「加入购物车」按钮；普通用户可正常加购与下单。切换用户后购物车角标会刷新。
- 顶部导航「购物车」支持**小红点角标**，展示当前购物车商品种类数；订单列表支持**分页**（每页 8 笔），管理员可查看全部订单并显示购买用户 ID 与名称。
- 图书列表与订单列表均支持**分页**（后端分页 + 前端分页组件）；购物车支持**按商品勾选结算**，仅勾选商品参与合计与下单。

## 🚀 启动指南 (How to Run)

### 前置条件

- 已安装并启动 Docker / Docker Desktop。

### 一键启动

在项目根目录（包含 `label-3369` 文件夹的目录）执行：

```bash
cd label-3369
docker compose up --build
```

首次构建会拉取 MySQL / JDK / Node 等镜像并进行依赖安装，时间略久，请耐心等待容器全部启动完成。

容器启动后：

- 数据库容器会自动初始化 `bookstore` 数据库与示例数据（见 `backend/src/main/resources/db/init.sql`）
- 后端容器会启动 Spring Boot 服务并连接数据库
- 前端容器通过 Nginx 提供静态页面并通过 `/api` 代理访问后端

如需停止服务，可在运行窗口按 `Ctrl + C`，或运行：

```bash
docker compose down
```

## 🔗 服务地址 (Services)

- **Frontend**: `http://localhost:3000`
  - 图书列表页：图书增删改查（管理员）、加入购物车（仅普通用户）、分页
  - 购物车页（仅普通用户可见）：数量调整、勾选结算、提交订单
  - 订单列表页：订单分页列表与详情；管理员可见全部订单及购买用户 ID/名称
- **Backend API**: `http://localhost:8000`
  - REST API 根路径：`/api`（如 `/api/auth/login`, `/api/auth/register`, `/api/books`, `/api/cart`, `/api/orders`）
- **Database (MySQL)**:
  - Host: `localhost`
  - Port: `3306`
  - User: `root`
  - Password: `root`
  - Database: `bookstore`

## 🐳 镜像拉取失败（网络超时）怎么办？

当前 Dockerfile 与 `docker-compose.yml` 默认使用 Docker 官方镜像（如 `mysql:8.0`、`node:20-alpine`、`nginx:alpine`、`eclipse-temurin:17-jre`）。如果你在拉取官方镜像时遇到类似 `failed to fetch oauth token` / `i/o timeout` 的网络问题，可按下述方式手动切换为加速镜像源：

- `docker.m.daocloud.io/library/*`

对应修改点：
- `backend/Dockerfile`
- `frontend/Dockerfile`
- `docker-compose.yml`（MySQL 镜像）

如你的环境 Docker Hub 可直连，保持当前官方镜像配置即可；仅在网络受限环境下，才需要按上述说明改为加速镜像前缀。

## 🧪 测试账号 / 使用说明

项目实现了登录注册功能，访问图书、购物车、订单页面需先登录；未登录时会自动跳转到登录页。

数据库初始化脚本中预置多个示例用户及测试数据（见 `backend/src/main/resources/db/init.sql`）：

| 用户名 | 密码 | 角色 |
|--------|------|------|
| admin  | 123456 | 管理员 |
| user1  | 123456 | 普通用户 |
| user2～user5 | 123456 | 普通用户 |

预置数据还包括：多用户购物车记录、约 29 笔订单及订单项，便于验证分页与管理员查看全部订单。

- **管理员**：可管理图书（增删改查），可查看全部订单（含购买用户 ID 与名称），不展示购物车入口、不可加购与下单。
- **普通用户**：可加购、下单、查看自己的订单；仅普通用户可见购物车导航与「加入购物车」按钮。

登录成功后，用户信息会写入 `localStorage`，前端 API 请求会自动携带 `X-USER-ID`、`X-ROLE` 请求头。

## ✅ 功能说明与验证步骤 (Verification)

启动容器后，可按以下步骤验证核心业务流程：

1. **验证登录注册**
   - 打开 `http://localhost:3000`，未登录时会自动跳转到登录页
   - 使用 `admin` / `123456` 登录（管理员）或 `user1` / `123456` 登录（普通用户）
   - 登录成功后进入图书页，顶部显示当前用户名与“退出”按钮
   - 可切换到“注册”标签，注册新用户（默认角色为普通用户）

2. **验证图书管理**
   - 以管理员身份登录后，进入“图书”页；确认**不显示**“购物车”导航与“加入购物车”按钮
   - 确认页面展示预置图书（30+ 本），点击“新增图书”填写信息并保存，可编辑或删除图书

3. **验证购物车与下单（普通用户）**
   - 使用 `user1` / `123456` 登录，在“图书”页点击“加入购物车”
   - 观察导航“购物车”上的小红点数量变化，进入“购物车”页调整数量、勾选商品后点击“提交订单”
   - 确认仅勾选商品被结算，未勾选保留；提交后订单列表出现新订单，图书库存相应减少

4. **验证订单与管理员视图**
   - 在“订单”页使用分页（上一页/下一页）查看订单列表；点击某笔订单查看详情与订单项
   - 以管理员身份登录，进入“订单”页：确认可查看**全部**订单，且列表与详情中显示**购买用户 ID 与名称**

5. **验证错误处理与交互细节**
   - 断开后端或数据库后刷新页面，可看到错误 Toast，不会白屏；表单非法数据（如负数）保存前会提示错误
   - 页面使用 Toast 与确认弹窗提示，无原生 `alert`/`confirm`；请求过程有加载状态

6. **验证分页与测试数据**
   - 图书列表：底部有分页控件，预置 30+ 本图书可翻页查看
   - 订单列表：预置多笔订单，支持分页（每页 8 笔），可验证总页数与跳转

## 🧪 单元测试

### 后端测试

后端使用 JUnit5 与 Spring Boot Test / Mockito 编写了基础单元测试，覆盖核心服务逻辑：

- `BookServiceTest`：验证图书创建与查询逻辑
- `OrderServiceTest`：验证订单列表加载等行为
- `CartServiceTest`：验证加入购物车逻辑（插入 vs 更新数量）
- `AuthControllerTest` / `BookControllerTest` / `CartControllerTest` / `OrderControllerTest`：基于 `@WebMvcTest` 的控制器层单元测试

在本地（安装 Maven 环境）可执行：

```bash
cd label-3369/backend
mvn test
```

### 前端测试

前端使用 Vitest + React Testing Library，示例测试用例如下：

- `BookListPage.test.tsx`：验证图书列表页标题等基础渲染是否正确
- `CartPage.test.tsx`：验证购物车页标题渲染
- `OrdersPage.test.tsx`：验证订单列表页标题渲染

在本地可执行：

```bash
cd label-3369/frontend
npm test
```

> 说明：在线验收环境可能未安装 Maven / Node，仅需确保源码与配置正确，Docker 构建命令中已默认跳过测试以加快镜像构建速度；本地开发时建议在修改功能后运行上述测试命令进行自测。

## 📁 项目结构（报告用）

### 目录结构总览（可直接粘贴到报告）

- `label-3369/backend`
  - `src/main/java/com/example/bookstore`
    - `domain`：实体类（`Book`、`CartItem`、`Order`、`OrderItem`、`User` 等）
    - `mapper`：MyBatis Mapper 接口（`UserMapper`、`BookMapper`、`CartItemMapper`、`OrderMapper`、`OrderItemMapper` 等）
    - `service`：业务服务层（`AuthService`、`BookService`、`CartService`、`OrderService`）
    - `web`：REST 控制器与全局异常处理（`AuthController`、`BookController`、`CartController`、`OrderController`、`GlobalExceptionHandler`）
    - `dto`：前后端数据传输对象（`LoginRequest`、`RegisterRequest`、`AuthResponse`、`BookRequest`、`OrderCreateRequest`、`PageResult` 等）
  - `src/main/resources`
    - `application.yml`：端口、数据源、MyBatis、日志配置
    - `db/init.sql`：建表 + 种子数据（6 个用户、30+ 本图书、购物车记录、约 29 笔订单及订单项）
  - `Dockerfile` / `settings.xml`：后端镜像构建与 Maven 加速配置
- `label-3369/frontend`
  - `src/pages`：`AuthPage`（登录/注册）、`BookListPage`、`CartPage`、`OrdersPage`、整体布局 `App.tsx`
  - `src/components`：`ToastProvider`（全局提示）、`ErrorBoundary`（错误边界）、`CountsProvider`（购物车/订单数量）
  - `src/contexts`：`AuthContext`（登录状态与 localStorage 同步）
  - `src/api`：`authApi`、`bookApi`、`cartApi`、`orderApi` 封装后端接口
  - `src/__tests__`：基础页面单测
  - `Dockerfile` / `nginx.conf`：前端构建与静态资源服务
- `label-3369/docker-compose.yml`：定义 `db`、`backend`、`frontend` 三个服务及网络、端口、数据卷

### 部分关键代码（SSM 特性应用示例）

> 下列示例涵盖了不少于 5 处典型 SSM 特性，可在课程报告“关键代码说明”中直接引用对应类名与路径。

1. **Spring IoC / DI（依赖注入）**
   - 通过构造函数注入 Mapper，体现控制反转与依赖注入：
     - `backend/src/main/java/com/example/bookstore/service/BookService.java`
     - `backend/src/main/java/com/example/bookstore/service/CartService.java`
     - `backend/src/main/java/com/example/bookstore/service/OrderService.java`

2. **Spring MVC 注解驱动 + RESTful API**
   - 使用 `@RestController`、`@RequestMapping`、`@GetMapping` 等注解定义接口：
     - 认证：`AuthController`（`/api/auth/login`、`/api/auth/register`）
     - 图书：`BookController`（`/api/books`）
     - 购物车：`CartController`（`/api/cart`）
     - 订单：`OrderController`（`/api/orders`，支持分页参数 `page`、`size`）
   - 路径：`backend/src/main/java/com/example/bookstore/web/*.java`

3. **Spring MVC 数据绑定与参数校验**
   - 使用 DTO + 注解完成请求体绑定与校验：
     - `BookRequest`、`OrderCreateRequest`（`backend/src/main/java/com/example/bookstore/dto`）
     - 控制器中通过 `@Valid @RequestBody` 自动触发校验（如 `BookController.create`、`OrderController.create`）
   - 校验失败由 `GlobalExceptionHandler` 统一转换为结构化错误响应。

4. **Spring 声明式事务管理**
   - 使用 `@Transactional` 保证一系列数据库操作的原子性：
     - `OrderService.createOrderFromCart`：从购物车生成订单、插入订单项、扣减库存、清空购物车。
     - `OrderService.createOrder`：对选择的购物车项下单、扣减库存、仅删除已结算的购物车行。
     - `BookService` / `CartService` 的新增、更新、删除逻辑。

5. **MyBatis 注解 SQL 与主键回填**
   - Mapper 层全部使用注解形式 SQL，而非 XML：
     - `backend/src/main/java/com/example/bookstore/mapper/*.java`
   - 插入时通过 `@Options(useGeneratedKeys = true, keyProperty = "id")` 获取数据库自增主键：
     - 图书：`BookMapper.insert`
     - 订单：`OrderMapper.insert`
     - 订单项：`OrderItemMapper.insert`

6. **MyBatis 关联映射（一对一 / 一对多）**
   - 购物车项关联图书信息（一对一）：`CartItemMapper.findByUserId` 使用 `@Results` 将 `books` 表字段映射到 `CartItem.book`。
   - 订单与订单项（一对多）：`OrderMapper.findItemsByOrderId` 查询订单项并映射到 `OrderItem`（含嵌套 `Book` 信息）。
   - 订单列表关联购买用户（管理员）：`OrderMapper.findAllPaged`、`findById` 通过 `LEFT JOIN users` 填充 `Order.userName`，供管理员查看购买用户 ID 与名称。

7. **全局异常处理与日志**
   - `GlobalExceptionHandler` 使用 `@ControllerAdvice` + `@ExceptionHandler` 统一处理参数校验错误与未捕获异常，返回统一 JSON 结构。
   - `application.yml` 中使用 Spring Boot 默认 logging 输出到 stdout，方便通过 `docker compose logs` 统一查看。

### 代码质量与规范对齐说明

- 使用清晰的分层结构（Controller / Service / Mapper / Domain / DTO），避免将业务逻辑堆叠在控制器中。
- 命名遵循领域语义（Book / CartItem / Order / OrderItem），包结构与类名直观反映职责。
- 通过 DTO 与校验注解隔离前端数据与领域实体，避免直接暴露数据库表结构。
- 所有数据库访问均通过 MyBatis ORM 完成，避免字符串拼接 SQL。

## 🐳 Docker 相关说明

- 前端镜像：
  - 构建阶段使用 `node:20-alpine`，通过 `npm ci` 安装依赖并执行 `npm run build`
  - 运行阶段使用 `nginx:alpine` 提供静态资源，监听 80 端口，`docker-compose` 中映射为宿主机 `3000`
  - 通过 Nginx 将 `/api` 前缀的请求代理到 `backend:8000`
- 后端镜像：
  - 构建阶段使用 `maven:3.9-eclipse-temurin-17`，结合 `settings.xml` 使用阿里云 Maven 镜像加速依赖下载
  - 运行阶段使用 `eclipse-temurin:17-jre`，通过 `java -jar app.jar` 启动 Spring Boot 应用
- 数据库镜像：
  - 使用官方 `mysql:8.0` 镜像，挂载 Volume `db_data` 进行数据持久化
  - 利用 `/docker-entrypoint-initdb.d/init.sql` 自动创建表结构与初始化图书/用户数据

整体设计遵循题目与规范文档要求：前后端完全容器化、支持 `docker compose up` 一键启动，使用真实数据库读写，无核心 Mock 数据，并通过 Tailwind 打造浅色现代科技风 UI。

