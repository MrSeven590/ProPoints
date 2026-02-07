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

## Cross-Component Type Passing

### 问题：名义类型系统导致的类型不兼容

UTS 采用名义类型系统（nominal typing），即使两个组件定义了结构完全相同的 type，它们也是不同的类型。

```typescript
// ❌ 错误：父组件和子组件各自定义相同结构的类型
// 父组件 entry.uvue
type StageBinInfo = { bin_id: number; bin_code: string }
data() { return { bins: [] as StageBinInfo[] } }

// 子组件 biz-cross-bin-input.uvue
type StageBinInfo = { bin_id: number; bin_code: string }  // 结构相同但是不同类型！
props: { bins: { type: Array, default: (): StageBinInfo[] => [] } }

// 运行时报错：ClassCastException: StageBinInfoReactiveObject cannot be cast to StageBinInfo
```

### 最佳实践：共享类型定义

将跨组件使用的类型定义在公共位置，父子组件 import 同一个类型：

```typescript
// ✅ 正确：在公共位置定义类型
// domain/models/ferment.uts
export type StageBinInfo = {
  bin_id: number
  stage_bin_id: number
  koji_count: number
  bin_code: string
}

// 父组件 entry.uvue
import { StageBinInfo } from '../../domain/models/ferment.uts'
data() { return { bins: [] as StageBinInfo[] } }

// 子组件 biz-cross-bin-input.uvue
import { StageBinInfo } from '../../domain/models/ferment.uts'
props: { bins: { type: Array, default: (): StageBinInfo[] => [] } }
```

### 方案对比

| 方案 | 做法 | 优点 | 缺点 |
|------|------|------|------|
| **最佳实践** | 公共位置定义类型，父子组件 import 同一类型 | 类型安全、点号访问、IDE 提示 | 需要额外类型文件 |
| 妥协方案 | 使用 `UTSJSONObject[]` 传递 | 无需公共类型文件 | 失去类型安全、需下标访问 |

---

## Map 遍历

### 问题：迭代器模式不支持

UTS 中 Map 不支持 JavaScript 的迭代器模式 (`entries().next()`)，编译时会报错。

```typescript
// ❌ 错误：UTS 不支持迭代器模式
const entries = myMap.entries()
let entry = entries.next()
while (entry.done != true) {
  const value = entry.value[1]
  entry = entries.next()
}

// 编译错误：
// error: Expression 'entries' of type 'MutableSet<...>' cannot be invoked as a function
// error: 找不到名称"next"
```

### 正确做法：使用 forEach

```typescript
// ✅ 正确：使用 forEach 遍历 Map
myMap.forEach((value: ValueType, key: KeyType) => {
  // 处理每个键值对
  console.log(key, value)
})
```

### 示例：收集 Map 中的数据

```typescript
// ✅ 正确示例
const binCardsData = new Map<number, BinCardData>()
const ids: number[] = []

binCardsData.forEach((cardData: BinCardData, _key: number) => {
  for (let i = 0; i < cardData.workers.length; i++) {
    const worker = cardData.workers[i]
    if (worker.personId != null) {
      ids.push(worker.personId as number)
    }
  }
})
```

---

## References

- [UTS 官方文档](https://doc.dcloud.net.cn/uni-app-x/uts/)
