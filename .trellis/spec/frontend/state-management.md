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
| 自动保存没有防抖 | 使用 1200ms trailing debounce |
| 自动保存没有版本控制 | 使用 draftRevision/savedRevision |
| 父子组件各自计算派生数据 | 父组件计算，通过 props 传递 |
| 保存时重新计算派生数据 | 直接使用父组件已计算的派生数据 |

---

## Auto-Save Pattern

### 自动保存最佳实践

用于防止用户数据丢失的自动保存机制。

#### 核心原则

1. **防抖保存**: 使用 trailing debounce (1200ms) 避免频繁写入
2. **版本控制**: 使用 `draftRevision` 和 `savedRevision` 避免重复保存
3. **状态限制**: 仅对 `status == 'draft'` 的会话自动保存
4. **生命周期刷新**: 在 `onHide/onUnload` 时立即保存
5. **冲突避免**: 手动保存和提交时取消自动保存定时器

#### 实现示例

```typescript
data() {
  return {
    autoSaveTimer: 0 as number,
    autoSaveDebounceMs: 1200 as number,
    draftRevision: 0 as number,
    savedRevision: 0 as number,
    isSubmitting: false as boolean,
    sessionStatus: 'draft' as string,
    lastAutoSaveErrorTime: 0 as number
  }
},

methods: {
  // 调度自动保存
  scheduleAutoSave() {
    if (this.sessionStatus != 'draft' || this.isSubmitting == true) {
      return
    }

    this.draftRevision = this.draftRevision + 1

    if (this.autoSaveTimer != 0) {
      clearTimeout(this.autoSaveTimer)
    }

    this.autoSaveTimer = setTimeout(() => {
      this.autoSaveTimer = 0
      this.doAutoSave()
    }, this.autoSaveDebounceMs)
  },

  // 执行自动保存
  doAutoSave() {
    if (this.sessionStatus != 'draft' || this.isSubmitting == true) {
      return
    }
    if (this.draftRevision == this.savedRevision) {
      return
    }

    try {
      const sessionData = this.buildSessionData('draft')
      saveSession(this.sessionDate, this.stageCode, this.roundId, sessionData)
      this.savedRevision = this.draftRevision
    } catch (e) {
      // 失败冷却机制，避免 toast 轰炸
      const now = Date.now()
      const cooldownMs = 10000
      if (now - this.lastAutoSaveErrorTime > cooldownMs) {
        this.lastAutoSaveErrorTime = now
        uni.showToast({ title: '自动保存失败', icon: 'none' })
      }
    }
  },

  // 取消自动保存
  cancelAutoSave() {
    if (this.autoSaveTimer != 0) {
      clearTimeout(this.autoSaveTimer)
      this.autoSaveTimer = 0
    }
  }
},

onHide() {
  this.cancelAutoSave()
  if (this.sessionStatus == 'draft' && this.isSubmitting == false) {
    uni.hideKeyboard()  // 强制触发 blur
    this.doAutoSave()
  }
},

onUnload() {
  this.cancelAutoSave()
  if (this.sessionStatus == 'draft' && this.isSubmitting == false) {
    uni.hideKeyboard()
    this.doAutoSave()
  }
}
```

#### 触发时机

在数据变更方法末尾调用 `scheduleAutoSave()`:

```typescript
onDataChange() {
  // 更新数据
  this.someData = newValue

  // 触发自动保存
  this.scheduleAutoSave()
}
```

#### 冲突避免

```typescript
// 手动保存草稿
saveDraft() {
  this.cancelAutoSave()  // 取消自动保存
  // ... 保存逻辑
}

// 提交
submit() {
  this.cancelAutoSave()  // 取消自动保存
  this.isSubmitting = true

  try {
    // ... 提交逻辑
    this.sessionStatus = 'submitted'
  } finally {
    this.isSubmitting = false
  }
}
```

---

## Derived Data Pattern

### 派生数据管理

派生数据是从基础数据计算得出的数据，必须保持与基础数据同步。

#### 核心原则

1. **单一数据源**: 父组件是派生数据的唯一计算者
2. **主动重算**: 基础数据变化时，立即重新计算派生数据
3. **Props 传递**: 通过 props 将派生数据传递给子组件
4. **保存一致**: 保存时使用父组件计算的派生数据

#### 反模式：双重计算

❌ **错误**: 父组件和子组件各自计算派生数据

```typescript
// 父组件
buildSessionData() {
  // 保存时重新计算
  const result = allocateCrossBinPoints(bins, totalUnits)
  return { sources: result.sources }
}

// 子组件
recalculateSources() {
  // 显示时也计算
  const result = allocateCrossBinPoints(this.bins, this.pointsUnits)
  this.sources = result.sources
}
```

**问题**:
- UI 显示的是子组件计算的结果
- 保存的是父组件计算的结果
- 两者可能不一致

#### 正确模式：单一计算源

✅ **正确**: 父组件计算，子组件接收

```typescript
// 父组件
data() {
  return {
    crossBinSources: [] as AssignmentSourceCreateParams[]
  }
},

methods: {
  // 重新计算派生数据
  recalculateCrossBinSources() {
    if (this.crossBinPointsUnits <= 0 || this.stageBinInfos.length == 0) {
      this.crossBinSources = []
      return
    }

    const binInfos: BinInfo[] = []
    for (let i = 0; i < this.stageBinInfos.length; i++) {
      const bin = this.stageBinInfos[i]
      binInfos.push({
        bin_id: bin.bin_id,
        stage_bin_id: bin.stage_bin_id,
        koji_count: bin.koji_count
      } as BinInfo)
    }

    const result = allocateCrossBinPoints(binInfos, this.crossBinPointsUnits)
    this.crossBinSources = result.sources
  },

  // 基础数据变化时重新计算
  onBinKojiChange() {
    // 更新基础数据
    this.stageBinInfos[i].koji_count = newValue

    // 重新计算派生数据
    this.recalculateCrossBinSources()
  },

  // 保存时直接使用
  buildSessionData() {
    return {
      cross_bin: {
        sources: this.crossBinSources  // 使用父组件计算的结果
      }
    }
  }
}
```

```vue
<!-- 通过 props 传递给子组件 -->
<biz-cross-bin-input
  :externalSources="crossBinSources"
  @change="onCrossBinChange"
/>
```

```typescript
// 子组件
props: {
  externalSources: {
    type: Array,
    default: (): AssignmentSourceCreateParams[] => []
  }
},

watch: {
  externalSources: {
    handler(newVal: AssignmentSourceCreateParams[]) {
      // 直接使用父组件传入的派生数据
      this.sources = newVal
      this.buildDisplayList()
    },
    immediate: true
  }
}
```

#### 重新计算时机

在以下时机调用重新计算方法:

1. **基础数据变更**: 权重、数量等影响派生数据的字段变化
2. **集合变更**: 添加/删除元素
3. **加载会话**: 从存储恢复数据后

```typescript
// 1. 基础数据变更
onBinKojiChange() {
  this.stageBinInfos[i].koji_count = newValue
  this.recalculateCrossBinSources()
}

// 2. 集合变更
onAddBin() {
  this.stageBinInfos.push(newBin)
  this.recalculateCrossBinSources()
}

// 3. 加载会话
loadExistingSession() {
  // 恢复基础数据
  this.stageBinInfos = sessionData.bins
  this.crossBinPointsUnits = sessionData.cross_bin.points_units

  // 重新计算派生数据
  this.recalculateCrossBinSources()
}
```

#### 优势

- ✅ "用户看到的 == 保存的" (数据一致性)
- ✅ 单一数据源 (避免不同步)
- ✅ 代码更简洁 (子组件不需要计算逻辑)
- ✅ 易于维护 (算法只在一处)
