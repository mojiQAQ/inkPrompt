# InkPrompt Figma Plugin

这个目录提供一个最小可运行的 Figma 开发插件，用来把当前 `Prompt Detail` 页面骨架直接生成到 Figma 画布里。

## 目录

- `manifest.json`: Figma 插件清单
- `code.js`: 插件主逻辑

## 生成内容

运行一次后，插件会创建一个新的 Figma 页面：

- `Prompt Detail / Default`
- `Prompt Detail / History Expanded`

这样你可以直接在 Figma 里基于两个状态继续调布局、色彩、间距和组件样式。

## 使用方法

1. 打开 Figma Desktop。
2. 新建或打开一个设计文件。
3. 进入 `Plugins > Development > Import plugin from manifest...`
4. 选择这个目录下的 `manifest.json`
5. 再进入 `Plugins > Development`，运行 `InkPrompt Prompt Detail Skeleton`

## 说明

- 这是一个零依赖插件，不需要安装 npm 包。
- 插件不会访问网络。
- 如果你后面在 Figma 里改好了样式，可以把 Figma 链接或截图给我，我再按设计稿回写前端。
