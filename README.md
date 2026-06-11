# 权限管理系统 (Permission Admin)

基于 **Vue 3 + Element Plus + Express + SQLite** 的全栈权限管理系统，支持用户管理、角色管理、权限分配、操作日志等功能。

## ✨ 功能特性

| 模块 | 功能 |
|------|------|
| 🔐 登录认证 | JWT 登录/登出，记住密码（7天自动登录），路由守卫 |
| 👤 用户管理 | CRUD、后端分页、关键字搜索、批量删除、角色分配、Excel 导出 |
| 🎭 角色管理 | CRUD、权限分配（菜单 + 按钮级别） |
| 🔑 权限管理 | 权限树查看、动态新增菜单/按钮权限节点 |
| 📋 操作日志 | 所有关键操作自动记录，支持按操作类型和时间范围筛选 |
| 🎨 UI 界面 | Element Plus 组件库，侧边栏导航，响应式布局 |
| 🗄️ 数据存储 | SQLite 数据库（sql.js 纯 JS 实现，无需安装数据库服务） |

## 🛠 技术栈

| 层级 | 技术 | 说明 |
|------|------|------|
| 前端框架 | Vue 3.5 (Composition API) | `<script setup>` 语法 |
| UI 组件 | Element Plus 2.x | 中文语言包 |
| 路由 | Vue Router 5.x | 路由守卫 + 动态菜单 |
| HTTP | Axios | 拦截器自动注入 Token |
| 后端 | Express 4.x | ESM 模块 |
| 数据库 | SQLite (sql.js) | 纯 JavaScript 实现，零依赖安装 |
| 认证 | JWT + bcryptjs | Token 7天有效期 |
| 导出 | ExcelJS | 用户列表 Excel 导出 |

## 📁 项目结构

```
permission-admin/
├── public/                  # 静态资源
├── server/                  # 后端服务
│   ├── index.js             # Express 入口
│   ├── db.js                # SQLite 数据库初始化 + 查询工具
│   ├── middleware/
│   │   └── auth.js          # JWT 认证 + 权限校验中间件
│   ├── routes/
│   │   ├── auth.js          # 登录 / 登出 / 用户信息
│   │   ├── user.js          # 用户 CRUD + 批量删除
│   │   ├── role.js          # 角色 CRUD + 权限分配
│   │   ├── permission.js    # 权限树 + 新增节点
│   │   ├── log.js           # 操作日志查询
│   │   └── export.js        # Excel 导出
│   └── data/                # 运行时数据（已 gitignore）
├── src/                     # 前端源码
│   ├── api/                 # API 接口层
│   │   ├── auth.js
│   │   ├── user.js
│   │   ├── role.js
│   │   ├── permission.js
│   │   ├── log.js
│   │   └── export.js
│   ├── layout/              # 布局组件
│   │   ├── MainLayout.vue   # 侧边栏 + 顶部栏 + 内容区
│   │   └── SidebarMenu.vue  # 动态菜单（根据权限渲染）
│   ├── router/
│   │   └── index.js         # 路由配置 + 守卫
│   ├── utils/
│   │   ├── auth.js          # Token 管理
│   │   └── request.js       # Axios 封装
│   ├── views/               # 页面组件
│   │   ├── Login.vue        # 登录页
│   │   ├── UserManager.vue  # 用户管理
│   │   ├── RoleManager.vue  # 角色管理
│   │   ├── PermissionManager.vue  # 权限查看
│   │   └── OperationLog.vue # 操作日志
│   ├── App.vue
│   └── main.js
├── index.html
├── vite.config.js           # Vite 配置（含 API 代理）
└── package.json
```

## 🚀 快速开始

### 环境要求

- **Node.js** >= 20.19 || >= 22.12

### 安装与启动

```bash
# 1. 克隆项目
git clone <your-repo-url>
cd permission-admin

# 2. 安装依赖
npm install

# 3. 启动项目（前后端同时启动）
npm run dev:all

# 或者分别启动
npm run server    # 后端 → http://localhost:8080
npm run dev       # 前端 → http://localhost:3000
```

### 访问系统

打开浏览器访问 `http://localhost:3000`，使用以下默认账号登录：

| 用户名 | 密码 | 角色 | 权限 |
|--------|------|------|------|
| `admin` | `admin123` | 管理员 | 全部权限 |

## 📡 API 接口

| 方法 | 路径 | 说明 | 权限要求 |
|------|------|------|----------|
| POST | `/api/auth/login` | 用户登录 | 无 |
| POST | `/api/auth/logout` | 用户登出 | 登录 |
| GET | `/api/auth/info` | 获取当前用户信息 | 登录 |
| GET | `/api/user/list` | 用户列表（分页） | 登录 |
| GET | `/api/user/:id` | 用户详情 | 登录 |
| POST | `/api/user/add` | 新增用户 | `user:add` |
| PUT | `/api/user/:id` | 编辑用户 | `user:edit` |
| DELETE | `/api/user/:id` | 删除用户 | `user:delete` |
| POST | `/api/user/batch-delete` | 批量删除 | `user:delete` |
| GET | `/api/role/all` | 全部角色 | 登录 |
| GET | `/api/role/list` | 角色列表 | 登录 |
| POST | `/api/role/add` | 新增角色 | `role:add` |
| PUT | `/api/role/:id` | 编辑角色 | `role:edit` |
| DELETE | `/api/role/:id` | 删除角色 | `role:delete` |
| PUT | `/api/role/:id/permissions` | 分配权限 | `role:perm` |
| GET | `/api/permission/tree` | 权限树 | 登录 |
| GET | `/api/permission/all` | 全部权限 | 登录 |
| POST | `/api/permission/add` | 新增权限 | 登录 |
| GET | `/api/permission/role/:id` | 角色权限 | 登录 |
| GET | `/api/log/list` | 操作日志（分页） | 登录 |
| GET | `/api/export/users` | 导出用户 Excel | `user:export` |

## 🔒 权限体系

```
角色 (Role)
  └── 权限 (Permission)
       ├── 菜单权限 (menu)  — 控制侧边栏菜单显隐
       └── 按钮权限 (button) — 控制页面操作按钮显隐

用户 (User)
  └── 角色关联 (user_roles) — 用户拥有的角色
```

- **管理员 (admin)**：拥有所有权限，不可删除
- **编辑员 (editor)**：可管理用户和角色，不能分配权限
- **只读用户 (viewer)**：仅查看，无操作按钮
- 支持自定义角色，灵活分配菜单+按钮权限

## 📦 构建部署

```bash
# 构建前端
npm run build

# 预览构建结果
npm run preview
```

## 📄 License

MIT
