# 贡献指南

感谢你对 ChickRubGo 项目的关注！我们欢迎任何形式的贡献，包括但不限于代码、文档、错误报告和功能建议。

## 重要声明

⚠️ **请严格遵守以下规定**：

本项目的贡献指南和开发规范是经过精心制定的，旨在保证项目的质量和稳定性。**如果贡献者违反以下任何规定，其贡献将被无视，相关 Pull Request 将被直接关闭，不予合并**：

1. **禁止使用前端框架**：前端项目必须只能使用 HTML、CSS、JavaScript，不能使用任何其他框架或库（如 React、Vue、Angular 等）
2. **CDN 使用规范**：严禁使用禁止的 CDN（jsdelivr、qweather），只能使用明确允许的 CDN（openweathermap.org、yunzhiapi.cn）

**其它规范请看下面的代码规范区域**

**请确保你的贡献完全符合上述规定，否则将不会被接受。**

## 如何开始贡献

### 前置要求

- **Node.js**：确保已安装 Node.js 环境
- **pnpm**：项目使用 pnpm 作为包管理器
- **Git**：用于版本控制
- **代码编辑器**：推荐使用 Trae IDE 或 Visual Studio Code

### 克隆项目

```bash
git clone https://github.com/RuanMingze/ChickRubGo.git
cd ChickRubGo
```

### 安装依赖

```bash
pnpm install
```

## 项目结构

```
ChickRubGo/
├── Assets/              # 静态资源文件
│   ├── white-noise/     # 白噪音音频文件
│   └── ...              # 其他图片、音频、视频资源
├── android/             # Android 应用源码
├── extension/           # 浏览器扩展源码
├── web-deploy/          # Web 部署文件
├── conf/                # 配置文件
├── errors/              # 错误页面
├── logs/                # 日志文件
├── index.html           # 主页面
├── main.js              # Electron 主进程
├── style.css            # 主样式文件
├── mobile.css           # 移动端样式
├── package.json         # 项目配置
└── ...
```

## 技术栈

### 桌面版（Electron）
- **Electron**: 40.1.0
- **前端**: HTML、CSS、JavaScript（纯原生，不使用框架）
- **包管理器**: pnpm

### Android 版
- 原生 Android 开发
- Gradle 构建系统

### 浏览器扩展版
- Chrome 扩展 API
- HTML、CSS、JavaScript

### Web 版
- 纯 HTML、CSS、JavaScript
- 不使用任何前端框架或库

## 代码规范

### 前端开发规则

1. **禁止使用框架**：前端项目必须只能使用 HTML、CSS、JavaScript，不能使用任何其他框架或库（如 React、Vue、Angular 等）

2. **允许使用的 API**：
   - Node fetch API
   - 任何与网络请求相关的 API（如 XMLHttpRequest、Fetch API 等）

3. **CDN 使用规范**：
   - **禁止使用**：
     - https://www.jsdelivr.com/
     - https://www.qweather.com/
   - **明确可以使用**：
     - https://openweathermap.org/
     - https://yunzhiapi.cn/

4. **代码风格**：
   - 使用一致的缩进（推荐 2 或 4 个空格）
   - 变量命名使用驼峰命名法（camelCase）
   - 常量命名使用大写下划线（UPPER_SNAKE_CASE）
   - 函数命名使用驼峰命名法
   - 类命名使用帕斯卡命名法（PascalCase）

### 注释规范

- 代码注释使用中文
- 复杂逻辑必须添加注释说明
- 函数和类应添加文档注释

### 提交信息规范

使用清晰的提交信息格式：

```
<type>: <subject>

<body>

<footer>
```

类型（type）包括：
- `feat`: 新功能
- `fix`: 修复 bug
- `docs`: 文档更新
- `style`: 代码格式调整（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

示例：
```
feat: 添加天气小组件自动定位功能

- 实现基于浏览器 Geolocation API 的自动定位
- 添加定位权限请求逻辑
- 优化定位失败时的错误处理

Closes #123
```

## 开发流程

### 1. 创建分支

```bash
git checkout -b feature/your-feature-name
```

分支命名规范：
- `feature/xxx`: 新功能
- `fix/xxx`: 修复 bug
- `docs/xxx`: 文档更新
- `refactor/xxx`: 重构

### 2. 进行开发

- 遵循代码规范
- 确保代码质量
- 添加必要的注释
- 测试你的更改

### 3. 提交更改

```bash
git add .
git commit -m "feat: 添加你的功能描述"
```

### 4. 推送分支

```bash
git push origin feature/your-feature-name
```

### 5. 创建 Pull Request

在 GitHub 上创建 Pull Request，描述你的更改：
- 说明更改的目的
- 列出主要的更改点
- 关联相关的 issue
- 提供测试说明

## 测试

### 本地测试

#### 桌面版测试

```bash
# 启动 Electron 应用
pnpm start
```

#### Web 版测试

```bash
# 启动本地服务器
node Run-Server.js
```

然后在浏览器中访问 `http://localhost:8000`

### 浏览器兼容性测试

确保你的更改在以下浏览器中正常工作：
- Chrome（最新版本）
- Firefox（最新版本）
- Safari（最新版本）
- Edge（最新版本）
- 移动端浏览器

## 报告 Bug

如果你发现了 bug，请在 GitHub Issues 中提交：

1. 使用清晰的标题描述问题
2. 提供详细的问题描述
3. 说明复现步骤
4. 提供截图或录屏（如果适用）
5. 说明你的环境信息（浏览器版本、操作系统等）
6. 使用 `bug` 标签

## 功能建议

如果你有新的功能建议：

1. 先检查是否已有类似的 issue
2. 在 GitHub Issues 中提交建议
3. 详细描述功能需求和使用场景
4. 说明这个功能的价值
5. 使用 `enhancement` 标签

## 行为准则

- 尊重所有贡献者
- 保持友好和专业的态度
- 接受建设性的批评
- 关注对社区最有利的事情
- 对不同观点保持开放态度

## 获取帮助

如果你在贡献过程中遇到问题：

1. 查看项目的 README.md
2. 搜索现有的 Issues
3. 在 Issues 中提问（使用 `question` 标签）
4. 在 Pull Request 中请求帮助

## 许可证

通过向本项目贡献代码，你同意你的代码将根据项目的许可证进行授权。

## 致谢

感谢所有为 ChickRubGo 项目做出贡献的开发者！

---

**注意**：项目有一个随时可能被激活的"恐龙"，如果项目出现语法错误，就是恐龙发动了技能，需要修复。如果修复完成了，就代表恐龙被击退了。恐龙还会随时呼出让应用无法调用 API 的气体（如 CORS 气体），还会踩破网站地图，让部分网站无法在国内正常访问（如 Github、X 都无法访问）。请做好应对准备！🦖
