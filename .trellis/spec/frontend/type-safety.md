# Type Safety

> UTS 语言类型安全规范

---

## Overview

UTS (UniScript) 是 TypeScript 的超集，但类型要求更加严格。为了编译为原生语言（Kotlin/Swift），必须遵循完全的强类型规范。

**核心原则：**
- 强制静态类型：所有类型在编译时必须已知
- 名义类型系统：类型兼容性基于类型名称，而非结构相似性

---

## Type Organization

### 类型定义位置

| 类型 | 位置 | 说明 |
|------|------|------|
| 全局类型 | `types/*.uts` | 跨模块共享的类型 |
| 页面类型 | 页面文件顶部 | 仅该页面使用 |
| 组件类型 | 组件文件顶部 | 仅该组件使用 |

### 使用 type 而非 interface

```typescript
// ❌ 错误：interface 不能用于对象字面量赋值
interface Person {
  name: string
  age: number
}

// ✅ 正确：使用 type 定义对象类型
type Person = {
  name: string
  age: number
}
```

### 禁止嵌套对象字面量

```typescript
// ❌ 错误
type News = {
  id: number
  author: { id: number; name: string }
}

// ✅ 正确：提取为独立 type
type Author = { id: number; name: string }
type News = { id: number; author: Author }
```

---

## Common Patterns

### 变量声明

```typescript
// ❌ 禁止 var
var x = 5

// ✅ 使用 let/const
let x = 5
const y = 10

// ✅ 变量必须先声明后使用
let x = 5
console.log(x)
```

### Null 处理

```typescript
// ❌ 不支持 undefined
let value: string | undefined

// ✅ 使用 null
let value: string | null = null

// ✅ 显式布尔判断
if (value != null) { }
if (arr.length > 0) { }
```

### 类型转换

```typescript
// ✅ 仅支持 as T 语法
let circle = createShape() as Circle

// ✅ 使用 instanceof 进行类型保护
if (arg instanceof Foo) {
  let fooArg = arg as Foo
}
```

---

## Forbidden Patterns

| 禁止特性 | 替代方案 |
|----------|----------|
| `undefined` | 使用 `null` |
| `unknown` | 使用 `any` 或具体类型 |
| `as const` | 显式类型声明 |
| Utility Types | 手动定义等效类型 |
| 条件类型 | 显式约束 |
| 映射类型 | 手动定义 |
| Symbol | 具体字符串/类型 |
| 命名空间 | ES Module |
| 生成器函数 | async/await |
| delete 运算符 | 设置为 null |
| Function.apply/call/bind | 类方法 |

---

## References

- [UTS 官方文档](https://doc.dcloud.net.cn/uni-app-x/uts/)
