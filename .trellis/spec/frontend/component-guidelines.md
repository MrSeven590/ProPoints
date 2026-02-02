# Component Guidelines

> uni-app X 组件开发规范

---

## Overview

本项目使用 Vue 3 组合式 API 开发 uvue 组件，遵循 easycom 规范实现组件自动导入。

**核心原则：**
- 仅使用 Vue 3 语法，禁止 Vue 2
- 新页面/组件优先使用组合式 API
- 符合 easycom 规范的组件无需 import

---

## Component Structure

### 标准页面结构

```vue
<template>
  <!-- #ifdef APP -->
  <scroll-view class="container">
  <!-- #endif -->
    <view class="content">
      <text class="title">{{ title }}</text>
    </view>
  <!-- #ifdef APP -->
  </scroll-view>
  <!-- #endif -->
</template>

<script setup lang="uts">
// 类型定义
type PageData = {
  title: string
}

// 响应式数据
const title = ref<string>('Hello')

// 生命周期
onMounted(() => {
  console.log('页面加载')
})
</script>

<style>
.container {
  flex: 1;
}
</style>
```

---

## Props Conventions

### 使用 defineProps

```vue
<script setup lang="uts">
// 定义 Props 类型
type Props = {
  name: string
  age: number
  active: boolean
}

// 声明 Props
const props = defineProps<Props>()
</script>
```

---

## Styling Patterns

### ucss 规范

- 仅使用 flex 布局或绝对定位
- 仅支持类选择器 `.class`
- 文字样式只能设置在 `<text>` 或 `<button>` 上
- 长度单位：px、rpx、百分比

```css
/* ✅ 正确 */
.container {
  display: flex;
  flex-direction: column;
  padding: 20px;
}

.title {
  font-size: 16px;
  color: #333;
}

/* ❌ 禁止 */
.container div { }  /* 禁止后代选择器 */
.container:hover { }  /* 禁止伪类 */
```

---

## Common Mistakes

| 错误 | 正确做法 |
|------|----------|
| 在 `<view>` 上设置文字样式 | 文字样式只能在 `<text>` 上 |
| 使用 pinia/vuex | uni-app X 不支持 |
| 使用 `.vue` 后缀 | 使用 `.uvue` |
| 非 easycom 组件直接调用方法 | 使用 `$callMethod` |
