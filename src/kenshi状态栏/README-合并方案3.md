# Kenshi 状态栏 + 地图合并（方案 3）说明

> 目的：把原本 iframe 加载的地图页面合并到状态栏中，避免依赖 `localhost`。保留原始代码作为备用。

## 关键变更

- 状态栏不再使用 iframe，而是内嵌 React 地图组件。
- 备用目录：
  - `src/kenshi状态栏_备用/`
  - `src/kenshi地图_备用/`

## 入口与挂载

- 新增挂载入口：[`src/kenshi状态栏/mapMount.tsx`](src/kenshi状态栏/mapMount.tsx)
- 状态栏 HTML 引入挂载入口：[`src/kenshi状态栏/index.html`](src/kenshi状态栏/index.html)
- 地图容器节点：`#map-root`（见 [`src/kenshi状态栏/index.html`](src/kenshi状态栏/index.html)）

## 运行逻辑

- 切换到“地图”标签时触发自定义事件 `kenshi-map-mount`，完成地图渲染。
- 首次渲染后不会重复创建 React Root。
- 切换回地图标签时触发 `kenshi-map-visible`，用于触发 `resize` 以修正 Leaflet 布局。

## 兼容注意

- 地图组件使用 `react-leaflet` 与 `leaflet`，依赖已在 `package.json` 中存在。
- 由于原地图使用 Tailwind 语法类名，当前合并版本不保证完全一致的视觉样式，后续可按需替换为本地 CSS。

## 备用恢复

如果需要恢复原 iframe 方案，可使用：
- `src/kenshi状态栏_备用/` 覆盖 `src/kenshi状态栏/`
- `src/kenshi地图_备用/` 覆盖 `src/kenshi地图/`
