# Quality Guidelines

> uni-app X 代码质量规范

---

## Overview

本项目遵循 uni-app X 框架规范，确保代码可编译为原生应用并正常运行。

**核心原则：**
- 代码必须编译通过且运行无错误
- 遵循 UTS 强类型规范
- 遵循 ucss 样式规范

---

## Forbidden Patterns

### UTS 禁止项

| 禁止 | 原因 |
|------|------|
| `undefined` | 使用 `null` 替代 |
| `var` 声明 | 使用 `let`/`const` |
| 隐式类型转换 | 条件必须是布尔值 |
| `interface` 对象字面量 | 使用 `type` |
| 变量提升 | 先声明后使用 |

### ucss 禁止项

| 禁止 | 原因 |
|------|------|
| 浮动/网格布局 | 仅支持 flex |
| 后代选择器 | 仅支持类选择器 |
| vh/vw 单位 | 仅支持 px/rpx/% |
| @media/@keyframes | 使用 UTS 代码实现 |

---

## Required Patterns

### 页面滚动容器

```vue
<template>
  <!-- #ifdef APP -->
  <scroll-view style="flex:1">
  <!-- #endif -->
    <!-- 页面内容 -->
  <!-- #ifdef APP -->
  </scroll-view>
  <!-- #endif -->
</template>
```

### 平台条件编译

```typescript
// #ifdef APP-ANDROID
// Android 专属代码
// #endif
```

---

## Code Review Checklist

- [ ] 编译通过，无语法错误
- [ ] 运行无报错
- [ ] 类型声明完整
- [ ] 使用 `null` 而非 `undefined`
- [ ] 条件语句使用布尔值
- [ ] 样式符合 ucss 规范
