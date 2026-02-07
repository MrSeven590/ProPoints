# State Management

> uni-app X 状态管理规范

---

## Overview

uni-app X **不支持** pinia、vuex、i18n 等 Vue 插件。状态管理采用以下方案：

- 组件内状态：Vue 3 响应式 API
- 跨页面通信：EventBus
- 持久化存储：分层存储架构

---

## State Categories

| 类型 | 方案 | 适用场景 |
|------|------|----------|
| 组件状态 | `ref()` / `reactive()` | 仅组件内使用 |
| 页面间通信 | EventBus | 跨页面事件通知 |
| 持久化数据 | 分层存储架构 | 需要持久保存的数据 |
| URL 参数 | 页面参数 | 页面跳转传参 |

---

## Storage Architecture

### 分层架构

```
┌─────────────────────────────────────────────────────────┐
│  页面层 (*.uvue)                                         │
│  - 只调用 AppStore 的函数                                │
│  - 禁止直接调用 uni.getStorageSync/setStorageSync        │
└─────────────────────────────────────────────────────────┘
                           ↓ 调用
┌─────────────────────────────────────────────────────────┐
│  AppStore (domain/stores/AppStore.uts)                  │
│  - 提供业务语义化的 getter/setter                        │
│  - 如: getManagerName(), setCurrentClassNo()            │
│  - 可包含简单的业务逻辑和默认值处理                       │
└─────────────────────────────────────────────────────────┘
                           ↓ 调用
┌─────────────────────────────────────────────────────────┐
│  storage-repository (storage/storage-repository.uts)    │
│  - 提供类型安全的存储操作                                │
│  - 如: loadRounds(), savePersons()                      │
│  - 处理 JSON 序列化/反序列化                             │
└─────────────────────────────────────────────────────────┘
                           ↓ 使用
┌─────────────────────────────────────────────────────────┐
│  storage-keys (storage/storage-keys.uts)                │
│  - 统一管理所有存储 Key                                  │
│  - Key 格式: pp:{scope}:{name}                          │
│  - 如: pp:cfg:class_no, pp:data:persons                 │
└─────────────────────────────────────────────────────────┘
                           ↓ 调用
┌─────────────────────────────────────────────────────────┐
│  uni.getStorageSync / uni.setStorageSync                │
│  - 底层存储 API                                          │
└─────────────────────────────────────────────────────────┘
```

### Key 命名规范

| 前缀 | 用途 | 示例 |
|------|------|------|
| `pp:cfg:` | 配置项 | `pp:cfg:class_no`, `pp:cfg:manager` |
| `pp:data:` | 业务数据 | `pp:data:persons`, `pp:data:rounds` |
| `pp:cache:` | 缓存数据 | `pp:cache:round_config` |

### 使用示例

```typescript
// ❌ 错误：页面直接调用 Storage API
const name = uni.getStorageSync('managerName')
uni.setStorageSync('managerName', 'Zhang')

// ✅ 正确：通过 AppStore 访问
import { getManagerName, setManagerName } from '@/domain/stores/AppStore.uts'
const name = getManagerName()
setManagerName('Zhang')
```

### 添加新存储项的步骤

1. **storage-keys.uts** - 定义 Key 函数
   ```typescript
   export function getNewConfigKey(): string {
     return `${KEY_PREFIX}:cfg:new_config`
   }
   ```

2. **storage-repository.uts** - 实现存取函数
   ```typescript
   export function saveNewConfig(value: string): void {
     saveData(getNewConfigKey(), value)
   }
   export function loadNewConfig(): string | null {
     return loadData(getNewConfigKey()) as string | null
   }
   ```

3. **AppStore.uts** - 提供业务接口
   ```typescript
   export function getNewConfig(): string {
     return loadNewConfig() ?? 'default'
   }
   export function setNewConfig(value: string): void {
     saveNewConfig(value)
   }
   ```

4. **页面** - 调用 AppStore
   ```typescript
   import { getNewConfig, setNewConfig } from '@/domain/stores/AppStore.uts'
   ```

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

## Session Data Pattern

### 会话数据保存模式

会话数据（如草稿、已提交记录）需要包含状态字段，以便区分不同类型的数据。

#### 数据结构

```typescript
type SessionData = {
  status: 'draft' | 'submitted'  // 状态字段（必需）
  session_date: string           // 会话日期
  stage_code: string             // 阶段代码
  round_id: number | null        // 轮次 ID
  timestamp: number              // 保存时间戳
  // ... 其他业务数据
}
```

#### 保存会话

```typescript
import { saveSession } from '@/storage/storage-repository.uts'

// 保存草稿
const draftData = {
  status: 'draft',
  session_date: '2026-02-07',
  stage_code: 'AN_QU',
  round_id: null,
  timestamp: Date.now(),
  bins: [/* ... */]
}
saveSession(date, stageCode, roundId, draftData)

// 提交数据
const submittedData = {
  ...draftData,
  status: 'submitted'
}
saveSession(date, stageCode, roundId, submittedData)
```

#### 加载会话

```typescript
import { loadSession } from '@/storage/storage-repository.uts'

// 从 URL 参数加载
onLoad(options: UTSJSONObject) {
  const date = options['date'] as string | null
  const stage = options['stage'] as string | null
  const roundId = options['roundId'] as string | null

  if (date != null && stage != null) {
    const sessionData = loadSession(date, stage, roundId)
    if (sessionData != null) {
      // 恢复页面状态
      this.restoreFromSession(sessionData)
    }
  }
}
```

#### 过滤会话状态

在查询数据时，必须检查 `status` 字段：

```typescript
// ✅ 正确：只处理已提交的数据
const sessionStatus = sessionData['status'] as string | null
if (sessionStatus == 'draft') {
  continue  // 跳过草稿
}

// ❌ 错误：不检查状态，草稿和已提交数据混在一起
const bins = sessionData['bins']  // 可能包含草稿数据
```

#### 向后兼容

旧数据可能没有 `status` 字段，需要兼容处理：

```typescript
const sessionStatus = sessionData['status'] as string | null

// 如果 status 字段不存在（旧数据），视为已提交
if (sessionStatus == 'draft') {
  continue
}
// sessionStatus == null 或 'submitted' 都会继续处理
```

---

## Common Mistakes

| 错误 | 正确做法 |
|------|----------|
| 使用 pinia/vuex | 使用 EventBus + Storage |
| 使用 i18n 插件 | 手动实现多语言 |
| 忘记 `uni.$off` | 页面销毁时移除监听 |
| 页面直接调用 `uni.getStorageSync` | 通过 AppStore 访问 |
| 硬编码 Storage Key | 使用 storage-keys.uts 定义 |
| 保存会话数据不包含 `status` 字段 | 必须包含 `status: 'draft' \| 'submitted'` |
| 查询数据时不检查 `status` | 必须过滤草稿数据 |
