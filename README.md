
# Dock - 您的多功能桌面工具箱

![Dock Logo](Dock.ico)

Dock 是一款集成了多种实用工具的桌面应用程序，旨在提高您的开发和日常工作效率。它基于 Electron、Vue 3、TypeScript 和 Vite 构建，提供了一个现代化、响应迅速且易于使用的界面。

## ✨ 功能特性

Dock 包含了以下内置工具，并按照功能进行了分类：

### 🌐 网络工具 (Network)

* **Ping IP And HOST**
  * **描述**: 在线检测网站、IP或主机的延迟和丢包率，快速分析网络连通性。
  * **图标**: `ri-broadcast-line`

### 🔄 格式转换 (Convert)

* **HTML to Image**
  * **描述**: 将 HTML 代码片段或完整的 HTML 文件批量转换为图片（如 PNG, JPEG）。
  * **图标**: `ri-image-2-line`
* **Markdown to HTML**
  * **描述**: 将 Markdown 格式的文本实时转换为格式化后的 HTML 代码，方便发布或预览。
  * **图标**: `ri-image-2-line`

### 🔒 加密/解密 (Crypto)

* **Base64 Code**
  * **描述**: 提供 Base64 编码和解码功能，方便处理文本和二进制数据。
  * **图标**: `ri-lock-unlock-line`
* **Mermaid View**
  * **描述**: 将 [Mermaid](https://mermaid.js.org/) 语法的文本实时渲染成流程图、序列图、甘特图等多种图表。
  * **图标**: `ri-markdown-line`

## 🚀 技术栈

* **框架**: [Electron](https://www.electronjs.org/), [Vue 3](https://vuejs.org/)
* **语言**: [TypeScript](https://www.typescriptlang.org/)
* **构建工具**: [Vite](https://vitejs.dev/)
* **路由**: [Vue Router](https://router.vuejs.org/)
* **打包**: [Electron Builder](https://www.electron.build/)

## 🛠️ 安装与使用

### 开发环境

1. 克隆本仓库:

   ```bash
   git clone [你的仓库地址]
   cd Dock
   ```
2. 安装依赖 (推荐使用 pnpm):

   ```bash
   pnpm install
   ```
3. 启动开发服务器:

   ```bash
   pnpm run electron:dev
   ```

### 构建应用

我们提供了两种构建方式：

1. **打包成独立执行程序 (Portable)**:
   生成一个无需安装的 `.exe` 文件。

   ```bash
   pnpm run electron:build:portable
   ```
2. **打包成标准安装程序 (Installer)**:
   生成一个标准的安装向导 `.exe` 文件。

   ```bash
   pnpm run electron:build:installer
   ```

构建产物将位于项目根目录下的 `dock` 文件夹中。

## 🤝 贡献

欢迎提交 Issues 和 Pull Requests！如果您有新的工具想法或改进建议，请不要犹豫，让我们一起让 Dock 变得更好。

## 📄 许可证

本项目采用 [MIT](LICENSE) 许可证。
