# Error Handling

> uni-app X 错误处理规范

---

## Overview

uni-app X 使用统一的 `UniError` 错误规范，包含 `errSubject`、`errCode`、`errMsg` 三个核心字段。

---

## UniError 结构

```typescript
type UniError = {
  errSubject: string   // 模块名称
  errCode: number      // 错误码
  errMsg: string       // 错误描述
  data?: Object        // 可选，部分成功的数据
  cause?: SourceError  // 可选，源错误
}
```

---

## errSubject 命名规范

| 场景 | 格式 | 示例 |
|------|------|------|
| uni API | `uni-API名称` | `uni-getSystemInfo` |
| 对象方法 | `uni-对象-方法` | `uni-SocketTask-onMessage` |
| 插件 | `插件id` 或 `插件id-API名称` | `my-plugin-login` |

---

## errCode 错误码规范

使用 7 位数错误码：
- 第 1-2 位：API 一级类目
- 第 3-4 位：API 二级类目
- 第 5-7 位：具体错误类型

**平台专有错误码（第 5-7 位）：**

| 平台 | 范围 |
|------|------|
| 跨端 (App/Web) | 6xx |
| App-Android | 7xx |
| App-iOS | 8xx |
| Web | 9xx |

---

## 使用示例

### 创建 UniError

```typescript
let error = new UniError("uni-apiName", 60000, "Custom error message")
error.data = { partialData: "value" }
```

### 包含源错误

```typescript
let sourceError = new SourceError("Third SDK error")
let error = new UniError("uni-apiName", 60000, "Custom error")
error.cause = sourceError
```

### 多个源错误

```typescript
let aggregateError = new UniAggregateError([
  new SourceError("First SDK error"),
  new SourceError("Second SDK error")
])
let error = new UniError("uni-apiName", 60000, "Multiple errors")
error.cause = aggregateError
```

---

## References

- [uni错误规范](https://uniapp.dcloud.net.cn/tutorial/err-spec.html)
