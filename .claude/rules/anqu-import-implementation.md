# 安曲数据导入功能实施方案

## 概述

本文档描述了安曲数据导入功能的实施方案，采用 Codex 推荐的"快照存储"架构，确保导入数据与真实安曲录入数据的清晰分离和优先级管理。

## 核心设计原则

### 1. 数据分离
- **真实数据**: 通过安曲环节正常录入的 `AN_QU` 会话数据
- **导入数据**: 通过剪贴板导入的快照数据，存储在独立的 Storage Key 中
- **优先级**: 真实数据 > 导入数据

### 2. 存储策略
- 导入数据作为独立快照存储，不创建假的 `AN_QU` 会话
- 快照按 `classNo + roundId` 作为唯一键
- 支持 `binCode → bin_id` 的最佳努力映射
- 允许保存 `binId = null` 的记录（离线场景）

### 3. 数据一致性
- 当真实安曲数据存在时，自动忽略导入数据
- 重新导入会覆盖旧快照（非合并）
- 真实数据提交后，可选择性删除对应快照

## 已实现功能

### 1. 类型定义 (`domain/services/AnQuDataService.uts`)

```typescript
// 导入的安曲快照数据项
export type ImportedAnQuBin = {
  binCode: string
  binId: number | null  // 映射结果，null 表示未映射
  kojiCount: number
}

// 导入的安曲快照
export type ImportedAnQuSnapshot = {
  classNo: number
  roundId: number
  importedAt: number
  source: string  // 'clipboard'
  bins: ImportedAnQuBin[]
}

// 曲坯数量查询结果
export type KojiLookupResult = {
  kojiCount: number | null
  source: string  // 'real' | 'imported' | 'none'
  binCode: string
  binId: number | null
}
```

### 2. Storage Key 定义 (`storage/storage-keys.uts`)

```typescript
/**
 * 安曲导入快照 Key
 * 格式: pp:import:anqu:{classNo}:{roundId}
 */
export function getAnQuImportSnapshotKey(classNo: number, roundId: number): string
```

### 3. 核心 API

#### 3.1 保存导入快照
```typescript
export function saveAnQuImportSnapshot(
  classNo: number,
  roundId: number,
  items: ParsedAnQuItem[]
): ImportedAnQuSnapshot
```

**功能**:
- 自动映射 `binCode → bin_id`（基于当前曲块主数据）
- 过滤跨班级数据
- 允许保存未映射的记录（`binId = null`）

#### 3.2 加载导入快照
```typescript
export function loadAnQuImportSnapshot(
  classNo: number,
  roundId: number
): ImportedAnQuSnapshot | null
```

#### 3.3 删除导入快照
```typescript
export function deleteAnQuImportSnapshot(
  classNo: number,
  roundId: number
): void
```

#### 3.4 曲坯数量查询（统一入口）
```typescript
export function lookupKojiCount(
  roundId: number,
  binCode: string,
  binId: number | null
): KojiLookupResult
```

**查询逻辑**:
1. 优先从真实 `AN_QU` 会话读取（`status = 'submitted'`）
2. 如果没有真实数据，从导入快照读取
3. 返回数据来源标记（`real` / `imported` / `none`）

#### 3.5 批量查询
```typescript
export function lookupKojiCountBatch(
  roundId: number,
  binCodes: string[]
): KojiLookupResult[]
```

### 4. 导入页面 (`pages/work/anqu-import.uvue`)

**新增功能**:
- 轮次选择器（默认选择最新轮次）
- 调用 `saveAnQuImportSnapshot` 保存快照
- 导入成功后自动返回上一页

**UI 流程**:
1. 选择轮次
2. 粘贴数据
3. 解析校验
4. 确认导入 → 保存快照

## 集成指南

### 在其他环节页面使用曲坯数量

#### 示例 1: 一翻环节查询曲坯数

```typescript
import { lookupKojiCount } from '../../domain/services/AnQuDataService.uts'

// 在一翻环节页面
const roundId = 123
const binCode = '3-3-1'
const binId = 456

const result = lookupKojiCount(roundId, binCode, binId)

if (result.source == 'real') {
  console.log(`真实数据: ${result.kojiCount} 块`)
} else if (result.source == 'imported') {
  console.log(`导入数据: ${result.kojiCount} 块 (临时)`)
  // 可选: 显示提示标记
} else {
  console.log('未找到曲坯数据')
}
```

#### 示例 2: 批量查询

```typescript
import { lookupKojiCountBatch } from '../../domain/services/AnQuDataService.uts'

const roundId = 123
const binCodes = ['3-3-1', '3-3-2', '3-3-3']

const results = lookupKojiCountBatch(roundId, binCodes)

for (let i = 0; i < results.length; i++) {
  const r = results[i]
  console.log(`${r.binCode}: ${r.kojiCount} 块 (来源: ${r.source})`)
}
```

#### 示例 3: UI 显示数据来源

```vue
<template>
  <view class="koji-info">
    <text class="koji-count">{{ kojiCount }} 块</text>
    <view v-if="source == 'imported'" class="imported-badge">
      <text class="badge-text">导入</text>
    </view>
  </view>
</template>

<script>
export default {
  data() {
    return {
      kojiCount: 0,
      source: 'none'
    }
  },
  methods: {
    loadKojiData() {
      const result = lookupKojiCount(this.roundId, this.binCode, this.binId)
      this.kojiCount = result.kojiCount != null ? result.kojiCount : 0
      this.source = result.source
    }
  }
}
</script>

<style>
.imported-badge {
  padding: 2px 6px;
  background-color: #fff3cd;
  border-radius: 4px;
}
.badge-text {
  font-size: 10px;
  color: #856404;
}
</style>
```

## 数据一致性规则

### 规则 1: 真实数据优先
- 当真实 `AN_QU` 会话存在时，`lookupKojiCount` 自动忽略导入快照
- 无需手动判断，API 内部处理

### 规则 2: 重新导入覆盖
- 对同一 `classNo + roundId` 重新导入时，完全覆盖旧快照
- 不进行合并操作

### 规则 3: 真实数据提交后的清理（可选）
- 当安曲环节提交真实数据后，可选择性删除对应快照
- 建议在 `saveSubmittedSession` 后调用 `deleteAnQuImportSnapshot`

```typescript
// 在 domain/stores/AppStore.uts 的 saveSubmittedSession 中
export function saveSubmittedSession(
  date: string,
  stageCode: string,
  roundId: number | null,
  sessionData: UTSJSONObject
): void {
  saveSubmittedSessionToRepo(date, stageCode, roundId, sessionData)

  // 如果是安曲环节，删除对应的导入快照
  if (stageCode == 'AN_QU' && roundId != null) {
    const classNo = getCurrentClassNo()
    deleteAnQuImportSnapshot(classNo, roundId)
  }
}
```

### 规则 4: 跨班级数据过滤
- 导入时自动过滤不属于当前班级的数据
- 基于 `parseBinCode(binCode).class_no` 判断

## 测试建议

### 测试场景 1: 基本导入流程
1. 打开安曲导入页面
2. 选择轮次（如第 5 轮）
3. 粘贴测试数据:
   ```
   3-3-1 120
   3-3-2 115
   3-3-3 118
   ```
4. 点击"解析数据"
5. 确认数据无误后点击"确认导入"
6. 验证提示"导入成功"

### 测试场景 2: 查询导入数据
1. 完成场景 1 的导入
2. 在一翻环节页面，选择相同轮次
3. 选择曲块 `3-3-1`
4. 验证显示曲坯数 `120 块`，并标记为"导入"

### 测试场景 3: 真实数据优先
1. 完成场景 1 的导入
2. 在安曲环节正常录入 `3-3-1` 的真实数据（如 125 块）
3. 提交安曲会话
4. 在一翻环节查询 `3-3-1`
5. 验证显示 `125 块`（真实数据），不再显示"导入"标记

### 测试场景 4: 未映射的曲块
1. 导入包含不存在曲块的数据（如 `3-9-99 100`）
2. 验证导入成功（允许保存 `binId = null`）
3. 查询该曲块时，验证能正常返回曲坯数

### 测试场景 5: 重新导入覆盖
1. 导入第 5 轮数据（3 个曲块）
2. 重新导入第 5 轮数据（5 个曲块）
3. 验证快照被完全覆盖为 5 个曲块

### 测试场景 6: 跨班级数据过滤
1. 当前班级为 3 班
2. 导入包含 4 班数据:
   ```
   3-3-1 120
   4-3-1 115
   ```
3. 验证只保存 `3-3-1`，自动过滤 `4-3-1`

## 后续优化建议

### 1. 自动同步曲块映射
- 当曲块主数据更新后，自动重新映射快照中的 `binId`
- 可在 `saveBins` 后触发

### 2. 快照过期机制
- 设置快照有效期（如 30 天）
- 定期清理过期快照

### 3. 导入历史记录
- 记录每次导入的时间、数据量
- 支持查看导入历史

### 4. 数据校验增强
- 导入时检查曲坯数是否异常（如超过 200）
- 提示可能的数据错误

### 5. 导出格式优化
- 在导出文本中包含轮次信息
- 导入时自动解析轮次，减少手动选择

## 常见问题

### Q1: 导入数据会影响工分计算吗？
**A**: 不会。导入数据仅作为查询参考，不参与工分计算。只有通过安曲环节正常录入并提交的数据才会计入工分。

### Q2: 如何区分真实数据和导入数据？
**A**: 使用 `lookupKojiCount` API 时，返回结果中的 `source` 字段会标记数据来源（`real` / `imported` / `none`）。

### Q3: 导入数据会被同步到其他设备吗？
**A**: 当前版本不会。导入快照存储在本地 Storage 中。如需跨设备使用，需要在每台设备上分别导入。

### Q4: 如何删除导入的数据？
**A**: 调用 `deleteAnQuImportSnapshot(classNo, roundId)` 即可删除指定轮次的导入快照。

### Q5: 导入时曲块不存在怎么办？
**A**: 系统允许保存 `binId = null` 的记录。后续如果曲块主数据更新，可以手动触发重新映射（需要实现）。

## 相关文件清单

### 核心服务
- `domain/services/AnQuDataService.uts` - 导入/导出/查询 API

### 存储层
- `storage/storage-keys.uts` - Storage Key 定义
- `storage/storage-repository.uts` - 通用存储操作

### 页面
- `pages/work/anqu-import.uvue` - 导入页面
- `pages/work/anqu-export.uvue` - 导出页面

### 类型定义
- `domain/models/ferment.uts` - 曲块相关类型

## 版本历史

- **v1.0** (2026-02-27): 初始实现，支持基本导入和查询功能
