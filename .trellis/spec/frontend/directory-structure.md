# Directory Structure

> uni-app X 项目的目录结构规范

---

## Overview

本项目基于 uni-app X 框架，使用 UTS 语言开发，目标平台为 Android。遵循 uni-app X 的标准目录结构。

---

## Directory Layout

```
ProPoints/
├── pages/                    # 页面目录
│   └── [module]/             # 模块目录
│       ├── [page].uvue       # 页面组件
│       └── CLAUDE.md         # 模块文档（可选）
├── components/               # 公共组件目录（待创建）
│   └── [ComponentName]/      # 组件目录
│       └── [ComponentName].uvue
├── static/                   # 静态资源
│   └── [images/icons/...]    # 图片、图标等
├── utils/                    # 工具函数（待创建）
│   └── [util].uts            # 工具模块
├── types/                    # 类型定义（待创建）
│   └── [type].uts            # 类型文件
├── App.uvue                  # 根组件
├── main.uts                  # 应用入口
├── pages.json                # 页面路由配置
├── manifest.json             # 应用清单
├── uni.scss                  # 全局 SCSS 变量
└── index.html                # Web 平台入口
```

---

## Module Organization

### 页面组织

- 每个功能模块在 `pages/` 下创建独立目录
- 页面文件使用 `.uvue` 后缀
- 新页面必须在 `pages.json` 中注册

### 组件组织

- 符合 easycom 规范的组件无需 import，可直接使用
- easycom 组件放置在 `components/[ComponentName]/[ComponentName].uvue`
- 非 easycom 组件需要手动 import 和注册

### 工具函数组织

- 通用工具函数放置在 `utils/` 目录
- 使用 `.uts` 后缀
- 通过 ES Module 方式导出

---

## Naming Conventions

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 页面目录 | 小写字母，短横线分隔 | `pages/user-profile/` |
| 页面文件 | 小写字母 | `index.uvue`, `detail.uvue` |
| 组件目录 | PascalCase | `components/UserCard/` |
| 组件文件 | PascalCase | `UserCard.uvue` |
| 工具文件 | camelCase | `utils/dateFormat.uts` |
| 类型文件 | camelCase | `types/userTypes.uts` |

---

## Platform-Specific Code

使用条件编译处理平台差异：

```typescript
// #ifdef APP-ANDROID
// Android 专属代码
// #endif

// #ifdef APP-ANDROID || APP-HARMONY
// Android 或鸿蒙专属代码
// #endif
```

平台标识符：
- `APP` - 所有 App 平台
- `APP-ANDROID` - Android
- `APP-IOS` - iOS
- `APP-HARMONY` - 鸿蒙
- `WEB` - Web 平台
- `MP-WEIXIN` - 微信小程序

---

## Examples

### 页面示例

```
pages/
├── index/
│   └── index.uvue          # 首页
├── user/
│   ├── profile.uvue        # 用户资料
│   └── settings.uvue       # 用户设置
└── score/
    ├── list.uvue           # 积分列表
    └── detail.uvue         # 积分详情
```

### 组件示例

```
components/
├── ScoreCard/
│   └── ScoreCard.uvue      # 积分卡片组件
└── UserAvatar/
    └── UserAvatar.uvue     # 用户头像组件
```

---

## Anti-Patterns

| 禁止 | 原因 |
|------|------|
| 在 `pages/` 根目录直接放置 `.uvue` 文件 | 违反模块化组织原则 |
| 组件文件名与目录名不一致 | 破坏 easycom 自动导入 |
| 使用 `.vue` 后缀 | uni-app X 使用 `.uvue` |
| 使用 `.ts` 后缀（逻辑文件） | uni-app X 使用 `.uts` |
