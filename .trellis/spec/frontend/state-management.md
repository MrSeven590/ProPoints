# State Management

> uni-app X 状态管理规范

---

## Overview

uni-app X **不支持** pinia、vuex、i18n 等 Vue 插件。状态管理采用以下方案：

- 组件内状态：Vue 3 响应式 API
- 跨页面通信：EventBus
- 持久化存储：uni.setStorageSync / uni.getStorageSync

---

## State Categories

| 类型 | 方案 | 适用场景 |
|------|------|----------|
| 组件状态 | `ref()` / `reactive()` | 仅组件内使用 |
| 页面间通信 | EventBus | 跨页面事件通知 |
| 持久化数据 | Storage API | 需要持久保存的数据 |
| URL 参数 | 页面参数 | 页面跳转传参 |

---

## When to Use Global State

由于不支持 Vuex/Pinia，全局状态通过以下方式实现：

### EventBus 跨页面通信

```typescript
// 发送事件
uni.$emit('userLogin', { userId: 123 })

// 监听事件
uni.$on('userLogin', (data) => {
  console.log('用户登录:', data.userId)
})

// 移除监听
uni.$off('userLogin')
```

---

## Server State

### 使用 uni.request

```typescript
uni.request({
  url: 'https://api.example.com/data',
  method: 'GET',
  success: (res) => {
    // 处理响应
  },
  fail: (err) => {
    // 处理错误
  }
})
```

---

## Common Mistakes

| 错误 | 正确做法 |
|------|----------|
| 使用 pinia/vuex | 使用 EventBus + Storage |
| 使用 i18n 插件 | 手动实现多语言 |
| 忘记 `uni.$off` | 页面销毁时移除监听 |
