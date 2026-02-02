# Hook Guidelines

> uni-app X 中的组合式函数规范

---

## Overview

uni-app X 使用 Vue 3 组合式 API，但不支持传统 React Hooks。本文档描述如何在 uni-app X 中复用有状态逻辑。

**注意：** uni-app X 不支持 pinia、vuex 等 Vue 插件。

---

## Custom Hook Patterns

### 组合式函数命名

使用 `use` 前缀命名组合式函数：

```typescript
// utils/useCounter.uts
export function useCounter(initial: number = 0) {
  const count = ref<number>(initial)

  const increment = () => { count.value++ }
  const decrement = () => { count.value-- }

  return { count, increment, decrement }
}
```

---

## Data Fetching

### 使用 uni.request

```typescript
// utils/useRequest.uts
type RequestResult<T> = {
  data: Ref<T | null>
  loading: Ref<boolean>
  error: Ref<string | null>
}

export function useRequest<T>(url: string): RequestResult<T> {
  const data = ref<T | null>(null)
  const loading = ref<boolean>(true)
  const error = ref<string | null>(null)

  uni.request({
    url: url,
    success: (res) => {
      data.value = res.data as T
    },
    fail: (err) => {
      error.value = err.errMsg
    },
    complete: () => {
      loading.value = false
    }
  })

  return { data, loading, error }
}
```

---

## Naming Conventions

| 类型 | 命名规则 | 示例 |
|------|----------|------|
| 组合式函数 | `use` + PascalCase | `useCounter`, `useRequest` |
| 返回的响应式变量 | camelCase | `count`, `isLoading` |
| 返回的方法 | camelCase 动词 | `increment`, `fetchData` |

---

## Common Mistakes

| 错误 | 说明 |
|------|------|
| 使用 React Hooks 语法 | uni-app X 是 Vue，不是 React |
| 在组合式函数中使用 pinia | uni-app X 不支持 pinia |
| 忘记导出函数 | 组合式函数需要 export |
