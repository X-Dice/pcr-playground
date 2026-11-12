# PCR Playground

[在线体验](https://x-dice.github.io/pcr-playground/) · [English](README.md) · [素材说明](docs/ASSETS.md) · [验证记录](docs/VERIFICATION.md)

一个可以边玩边理解 PCR 的教学模拟程序。改变条件，观察插画实验室和曲线如何变化，比较**目标产物、非特异产物、引物二聚体**三类产物的相对产量。

这里的曲线来自教学模型，不是实测 qPCR 数据，也不是经过实验校准的产量预测。

## 可以做什么

- **温度梯度：**比较不同退火温度下的模拟结果。
- **自由探索：**调整条件，观察曲线和三类产物的变化。
- 切换**玩具实验室**和**漫画手账**两种主题。
- 将实验历史保存在当前浏览器的 `localStorage` 中。
- 导出 CSV 数据、PNG 图片或 JSON 项目；导入 JSON 恢复项目。

输入与计算在浏览器内处理。历史记录属于当前浏览器和网站地址，清除网站数据会删除记录；需要长期保留时，请另存 JSON。

## 本地运行

检查与构建需要 Node.js 24 或更新版本，开发服务器需要 Python 3。不需要安装 npm 依赖。

```sh
npm run dev
```

打开 `http://localhost:4173`。程序使用 JavaScript 模块，请通过 HTTP 服务器访问。

```sh
npm test
npm run build
```

构建结果在 `dist/`，仅包含 `index.html`、根目录 JavaScript 模块、`style.css`、可选的 `assets/` 和 `.nojekyll`，不包含测试、文档与开发脚本。

## 怎样理解结果

适合比较同一模拟中变化的方向和相对大小。曲线高低不等于 DNA 浓度、拷贝数、Ct/Cq，也不能直接证明某个条件是实验最优值。三类产物经过简化，真实 PCR 还受序列、试剂配方、仪器和样本质量等因素影响。

实验结论需要用真实实验和适当对照验证。当前程序的检查状态见[验证记录](docs/VERIFICATION.md)。

## 部署

在线演示已通过 GitHub Pages 发布。部署自己的副本时，在仓库设置中将 Pages 来源设为 **GitHub Actions**。推送到 `main` 或手动运行 **Deploy Pages**，会检查模型、构建 `dist/` 并部署。

候选仓库名为 `X-Dice/pcr-playground`。本文不代表公开仓库或在线部署已经创建。

## 文件结构

| 文件 | 用途 |
| --- | --- |
| `model.js` | 教学模型与模拟计算 |
| `app.js` | 状态管理与操作控件 |
| `scene.js` | 插画实验室 |
| `charts.js` | 结果图表 |
| `exports.js` | 文件导出与导入 |
| `style.css` | 页面布局与主题 |
| `tests/` | 自动检查 |
| `scripts/build.mjs` | 无依赖的静态构建脚本 |

原创矢量插画与界面素材的说明见[素材说明](docs/ASSETS.md)。项目采用 [MIT 许可](LICENSE)，版权归 2026 X-Dice 所有。

源码仓库：[X-Dice/pcr-playground](https://github.com/X-Dice/pcr-playground)。部署状态见验证记录。
