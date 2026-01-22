# Index 页面模块

[根目录](../../CLAUDE.md) > [pages](../) > **index**

## 模块职责

首页模块是应用的启动页面，作为用户进入应用后的第一个界面。当前为框架模板状态，待开发具体业务功能。

## 入口文件

| 文件 | 类型 | 说明 |
|------|------|------|
| `index.uvue` | 页面组件 | 首页视图与逻辑 |

## 页面配置

**路由配置**（`pages.json`）：
```json
{
  "path": "pages/index/index",
  "style": {
    "navigationBarTitleText": "uni-app x"
  }
}
```

## 组件结构

```vue
<template>
  <view>
    <image class="logo" src="/static/logo.png" />
    <text class="title">{{title}}</text>
  </view>
</template>
```

## 数据模型

| 字段 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `title` | `string` | `"Hello"` | 页面标题文本 |

## 生命周期

- `onLoad()`: 页面加载时触发（当前为空实现）

## 样式定义

| 类名 | 用途 |
|------|------|
| `.logo` | Logo 图片样式（100x100px，居中，上边距 100px） |
| `.title` | 标题文本样式（18px，#8f8f94 灰色，居中） |

## 依赖关系

- **静态资源**: `/static/logo.png`
- **全局样式**: 继承 `App.uvue` 中的公共样式（`.uni-row`, `.uni-column`）
- **SCSS 变量**: 可使用 `uni.scss` 中定义的变量

## 测试覆盖

当前无测试文件。

## 开发建议

1. **替换 Logo**: 更新 `/static/logo.png` 为项目专属图标
2. **修改标题**: 将 `title` 改为 "ProPoints" 或项目名称
3. **添加功能入口**: 根据业务需求添加导航按钮或功能卡片
4. **使用主题色**: 引用 `$uni-color-primary` (#007aff) 作为主色调

## 相关文件清单

| 文件路径 | 用途 |
|----------|------|
| `pages/index/index.uvue` | 首页组件 |
| `static/logo.png` | Logo 图片 |
| `pages.json` | 路由注册 |
| `uni.scss` | 全局样式变量 |
| `App.uvue` | 根组件（公共样式） |

---

## 变更记录 (Changelog)

| 日期 | 变更内容 |
|------|----------|
| 2025-12-12 | 增量更新：补充样式细节和依赖关系说明 |
| 2025-12-12 | 初始化模块文档 |
