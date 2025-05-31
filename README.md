# CloudDevHub - 基于AI与Docker的云端全栈开发协作平台

## 项目概述

CloudDevHub 是一个现代化的云端开发环境，集成了 AI 辅助编程、实时协作、远程开发等功能。平台基于 Docker 容器化部署，支持多人实时协作编程，并提供智能代码补全和 AI 聊天助手。

**项目开发者：** 杜旭、张新明

## 🚀 核心特性

### 💻 云端IDE
- **多语言支持**: JavaScript/TypeScript、Python、Java、C/C++ 等
- **语法高亮**: 基于 Monaco Editor 的专业代码编辑体验
- **智能补全**: 内置代码智能提示和自动补全
- **文件管理**: 完整的文件资源管理器，支持创建、删除、重命名

### 🤝 实时协作
- **多人协作**: 支持多用户同时编辑同一文件
- **实时同步**: 代码变更、光标位置实时同步
- **协作状态**: 显示当前文件的所有协作者
- **编译广播**: 编译状态实时广播给所有协作者

### 🤖 AI 助手集成
- **本地模型支持**: 集成本地 LLM 模型 (LM Studio)
- **智能对话**: AI 编程助手，支持代码解释、调试、优化建议
- **代码生成**: 根据需求自动生成代码片段
- **错误修复**: AI 辅助代码错误诊断和修复建议

### 🐳 容器化部署
- **Docker 支持**: 完全容器化，一键部署
- **远程开发**: 基于 SSH 的远程文件系统访问
- **环境隔离**: 每个项目独立的开发环境
- **跨平台**: 支持 Linux、macOS、Windows

### 🔧 开发工具
- **实时编译**: 支持多种语言的实时编译和运行
- **终端集成**: 内置终端，支持命令行操作
- **项目管理**: 完整的项目文件结构管理
- **版本控制**: Git 集成支持

## 🛠 技术栈

### 前端技术
- **React 18**: 现代化前端框架
- **TypeScript**: 类型安全的 JavaScript
- **Vite**: 快速的构建工具
- **Monaco Editor**: VS Code 同款编辑器
- **Socket.IO Client**: 实时通信

### 后端技术
- **Node.js**: 服务器端 JavaScript 运行时
- **Express.js**: Web 应用框架
- **Socket.IO**: 实时双向通信
- **SSH2**: SSH 连接和 SFTP 文件操作

### 基础设施
- **Docker**: 容器化部署
- **Nginx**: 反向代理和静态文件服务
- **Ubuntu 22.04**: 基础系统镜像

## 📁 项目结构

```
my-collab-ide/
├── public/                 # 静态资源
├── src/                   # 前端源码
│   ├── components/        # React 组件
│   │   ├── EditorComponent.tsx    # 主编辑器组件
│   │   ├── AIChatPanel.tsx       # AI 聊天面板
│   │   ├── ActivityBar.tsx       # 活动栏
│   │   └── ...
│   ├── services/          # 服务层
│   │   ├── collaborationService.ts # 协作服务
│   │   └── aiService.ts          # AI 服务
│   └── App.tsx           # 主应用组件
├── server/               # 后端服务
│   ├── routes/          # API 路由
│   │   └── files.js     # 文件操作 API
│   ├── services/        # 后端服务
│   │   └── sshService.js # SSH 连接服务
│   └── index.js         # 服务器入口
├── Dockerfile           # Docker 构建文件
├── nginx.conf          # Nginx 配置
└── package.json        # 项目配置
```

## 🚀 快速开始

### 环境要求
- Docker 20.0+
- Node.js 16+ (开发环境)
- Git

### 1. 克隆项目
```bash
git clone <repository-url>
cd my-collab-ide
```

### 2. 环境配置
创建 `.env` 文件：
```bash
# 远程服务器配置
SSH_HOST=your-remote-host
SSH_USERNAME=your-username
SSH_PASSWORD=your-password
BASE_DIR=/data/My_Desktop/User_Coding
PORT=3001

# AI 模型配置 (可选)
LOCAL_MODEL_URL=http://192.168.31.124:1234/v1
```

### 3. 本地开发
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run dev

# 启动后端服务
cd server
npm install
npm start
```

### 4. Docker 部署
```bash
# 构建前端
npm run build

# 构建 Docker 镜像
docker build -t clouddevhub .

# 运行容器
docker run -d \
  --name clouddevhub \
  -p 80:80 \
  -p 3001:3001 \
  -e SSH_HOST=your-host \
  -e SSH_USERNAME=your-username \
  -e SSH_PASSWORD=your-password \
  clouddevhub
```

### 5. 访问应用
- Web IDE: http://localhost
- API 服务: http://localhost:3001

## 🔧 功能使用

### AI 助手配置
1. 启动本地 LM Studio 服务 (端口 1234)
2. 在 AI 聊天面板中配置模型 URL
3. 选择可用的本地模型
4. 开始与 AI 助手对话

### 协作开发
1. 多用户打开同一文件
2. 实时查看其他用户的编辑操作
3. 编译状态会广播给所有协作者
4. 支持邀请新协作者加入项目

### 远程开发
1. 配置 SSH 连接信息
2. 浏览远程服务器文件系统
3. 直接编辑远程文件
4. 实时保存到远程服务器

## 🎯 主要功能模块

### 文件管理
- 文件树浏览
- 文件/文件夹创建、删除
- 文件内容实时保存
- 支持多种文件格式

### 代码编辑
- 语法高亮
- 智能补全
- 代码折叠
- 多标签页管理

### 实时协作
- WebSocket 实时通信
- 多用户同步编辑
- 协作者状态显示
- 冲突处理机制

### AI 集成
- 本地模型支持
- 智能代码建议
- 错误诊断
- 代码优化建议

## 🛡 安全特性
- 路径安全检查
- SSH 安全连接
- 用户权限控制
- 跨域请求保护

## 📈 性能优化
- 前端代码分割
- 文件增量同步
- WebSocket 连接复用
- Docker 多阶段构建

## 🔄 开发计划
- [ ] 支持更多编程语言
- [ ] 集成 Git 版本控制
- [ ] 增加代码审查功能
- [ ] 支持插件系统
- [ ] 移动端适配

## 🤝 贡献指南
1. Fork 项目
2. 创建功能分支
3. 提交变更
4. 推送到分支
5. 创建 Pull Request

## 📄 许可证
本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 📞 联系我们
- 项目维护者: 杜旭、张新明
- 技术支持: [GitHub Issues](link-to-issues)

---
**CloudDevHub** - 让云端开发更简单、更智能、更协作！
