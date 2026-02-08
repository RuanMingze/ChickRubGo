# 支持与帮助

欢迎来到 ChickRubGo 的支持中心！如果你在使用过程中遇到任何问题，这里会为你提供帮助。

## 快速开始

### 安装与运行

#### 桌面版（Electron）

1. 克隆项目：
```bash
git clone https://github.com/RuanMingze/ChickRubGo.git
cd ChickRubGo
```

2. 安装依赖：
```bash
pnpm install
```

3. 启动应用：
```bash
pnpm start
```

#### Web 版

1. 启动本地服务器：
```bash
node Run-Server.js
```

2. 在浏览器中访问：`http://localhost:3000`

#### Android 版

1. 使用 Android Studio 打开 `android` 目录
2. 连接 Android 设备或启动模拟器
3. 点击运行按钮安装应用

#### 浏览器扩展版

1. 打开 Chrome 浏览器
2. 访问 `chrome://extensions/`
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择 `extension` 目录

## 常见问题

### 安装问题

**Q: pnpm install 失败怎么办？**

A: 请尝试以下步骤：
1. 确保 Node.js 版本符合要求（推荐 18.x 或更高）
2. 清理缓存：`pnpm store prune`
3. 删除 `node_modules` 和 `pnpm-lock.yaml`，重新安装

**Q: Electron 应用无法启动？**

A: 请检查：
1. 是否正确安装了依赖：`pnpm install`
2. Node.js 版本是否兼容
3. 查看控制台错误信息

### 使用问题

**Q: 天气小组件无法显示天气信息？**

A: 请检查：
1. 是否设置了 OpenWeatherMap API Key
2. API Key 是否有效
3. 是否允许定位权限（如果使用自动定位）
4. 网络连接是否正常

**Q: 背景音乐无法播放？**

A: 请检查：
1. 音频文件格式是否支持（推荐 MP3、MP4）
2. 文件大小是否合理（建议不超过 50MB）
3. 浏览器是否支持该音频格式

**Q: 记事本无法导入/导出文件？**

A: 请检查：
1. 文件格式是否正确（支持 .md、.txt）
2. 文件编码是否为 UTF-8
3. 浏览器是否允许文件访问权限

**Q: 搜索引擎无法使用？**

A: 请检查：
1. 网络连接是否正常
2. 搜索引擎地址是否正确
3. 是否被防火墙或代理拦截

### API 相关问题

**Q: 如何获取 OpenWeatherMap API Key？**

A:
1. 访问 https://openweathermap.org/
2. 注册账号
3. 进入 API Keys 页面
4. 创建新的 API Key
5. 将 API Key 复制到应用设置中

**Q: CORS 错误怎么办？**

A: 这是"恐龙"呼出的气体！请尝试：
1. 检查 API 是否支持 CORS
2. 使用代理服务器
3. 检查 API 请求配置

### 浏览器兼容性问题

**Q: 在某些浏览器中功能不正常？**

A: ChickRubGo 支持以下浏览器：
- Chrome（最新版本）
- Firefox（最新版本）
- Safari（最新版本）
- Edge（最新版本）

请确保使用最新版本的浏览器。

## 功能说明

### 搜索功能

- 支持必应、百度和自定义搜索引擎
- 可在设置中切换搜索引擎
- 支持快捷标签快速搜索

### 小组件功能

#### 记事本
- 支持 Markdown 格式
- 可导入/导出文件
- 自动保存到本地存储

#### 天气
- 支持自动定位
- 可手动设置城市
- 显示温度、湿度、风速等信息

#### 木鱼
- 点击积累功德值
- 支持音效
- 功德值自动保存

#### 闹钟
- 支持多闹钟设置
- 番茄钟功能
- 自定义铃声

#### 计算器
- 基础计算功能
- 支持加减乘除
- 历史记录

#### 每日一言
- 随机获取名言警句
- 每日更新

#### 今天吃什么
- 随机选择食物
- 支持自定义食物列表

### 设置说明

- **显示壁纸**：控制背景壁纸的显示与隐藏
- **显示时间**：控制时间和日期的显示
- **深色模式**：切换深色/浅色主题
- **显示淡入动画**：控制页面元素的淡入动画效果
- **搜索引擎**：选择必应、百度或自定义搜索引擎
- **OpenWeatherMap API Key**：设置天气小组件的API密钥
- **自动获取定位**：控制天气小组件是否自动获取定位
- **城市**：手动设置天气小组件的城市
- **背景音乐**：上传自定义背景音乐文件

## 获取帮助

### 查阅文档

- [README.md](README.md) - 项目介绍和基本使用
- [CONTRIBUTING.md](CONTRIBUTING.md) - 贡献指南
- [SECURITY.md](SECURITY.md) - 安全政策

### 搜索问题

在提问之前，请先搜索：
1. GitHub Issues
2. 项目文档
3. 相关技术文档

### 提交问题

如果无法找到解决方案，请在 GitHub Issues 中提交问题：

1. 使用清晰的标题描述问题
2. 提供详细的问题描述
3. 说明复现步骤
4. 提供截图或录屏（如果适用）
5. 说明你的环境信息：
   - 浏览器版本
   - 操作系统
   - 应用版本
6. 使用适当的标签：
   - `bug` - 错误报告
   - `question` - 问题咨询
   - `enhancement` - 功能建议

### 功能建议

如果你有新的功能建议：

1. 先检查是否已有类似的 issue
2. 在 GitHub Issues 中提交建议
3. 详细描述功能需求和使用场景
4. 说明这个功能的价值
5. 使用 `enhancement` 标签

## 社区支持

### 贡献

我们欢迎任何形式的贡献！请查看 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与贡献。

### 行为准则

- 尊重所有贡献者和用户
- 保持友好和专业的态度
- 接受建设性的批评
- 关注对社区最有利的事情

## 资源链接

- [GitHub 仓库](https://github.com/RuanMingze/ChickRubGo)
- [问题追踪](https://github.com/RuanMingze/ChickRubGo/issues)
- [Pull Requests](https://github.com/RuanMingze/ChickRubGo/pulls)

## 更新日志

请查看 GitHub Releases 了解最新更新和版本历史。

## 联系方式

如有其他问题或建议，请通过以下方式联系：

- GitHub Issues
- 项目维护者

---

**注意**：项目有一个随时可能被激活的"恐龙"，如果项目出现语法错误，就是恐龙发动了技能，需要修复。如果修复完成了，就代表恐龙被击退了。恐龙还会随时呼出让应用无法调用 API 的气体（如 CORS 气体），还会踩破网站地图，让部分网站无法在国内正常访问（如 Github、X 都无法访问）。请做好应对准备！🦖
