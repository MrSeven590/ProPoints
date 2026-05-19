# 经验教训记录

> 只有运行验证通过后才记录。记录"只有运行起来才知道"的坑、配置参数和特殊处理逻辑。

---

## UTS 类型转换模式

### 问题
运行时错误：`ClassCastException: UTSJSONObject cannot be cast to FermentRound`

### 发生场景
从 storage 读取 JSON 数据后赋值给强类型数组时。

### 根本原因
UTS 使用**名义类型系统**（Nominal Typing），不允许直接将 `UTSJSONObject[]` cast 为具体类型数组（如 `FermentRound[]`）。

### 解决方案
在模型文件中定义**工厂函数**，使用处调用即可：

```typescript
// 1. 在模型文件中定义工厂函数（如 domain/models/ferment.uts）
export function createFermentRoundFromJSON(raw: UTSJSONObject): FermentRound {
  return {
    id: raw['id'] as number,
    uuid: raw['uuid'] as string,
    class_no: raw['class_no'] as number,
    year: raw['year'] as number,
    round_no: raw['round_no'] as number,
    micro_enabled: raw['micro_enabled'] as number,
    started_at: raw['started_at'] as Timestamp,
    ended_at: raw['ended_at'] as Timestamp | null,
    created_at: raw['created_at'] as Timestamp,
    updated_at: raw['updated_at'] as Timestamp,
    version: raw['version'] as number,
    sync_status: raw['sync_status'] as SyncStatus
  } as FermentRound
}

// 2. 在使用处调用工厂函数（如 domain/stores/AppStore.uts）
import { createFermentRoundFromJSON } from '../models/ferment.uts'

const rawRounds = loadRoundsFromRepo()
const result: FermentRound[] = []
for (let i = 0; i < rawRounds.length; i++) {
  result.push(createFermentRoundFromJSON(rawRounds[i]))
}
```

### 关键点
- 使用**方括号访问** `raw['field']` 而非点访问 `raw.field`
- 每个属性必须**显式类型断言** `as Type`
- 不可用 `as FermentRound[]` 批量转换整个数组

### 验证时间
2025-05-03（编译验证通过）

### 相关文件
- `domain/models/ferment.uts` - FermentRound 类型定义 + 工厂函数
- `domain/stores/AppStore.uts` - loadRoundsData() 使用工厂函数