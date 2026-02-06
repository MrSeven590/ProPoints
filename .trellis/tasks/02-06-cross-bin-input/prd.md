# CROSS_BIN 跨仓岗位录入组件

## Goal

实现跨仓岗位（拉车/打杂）的工分录入功能，支持管理员指定工分后系统自动按曲坯比例从多仓扣减。

## Background

根据 PRD 方案总结：
- **CROSS_BIN 作用域**：跨仓岗位（如拉车/打杂），由管理员指定工分，并从所服务的多个仓按曲坯比例扣减
- **适用环节**：
  - 安曲：CART_PULLER（拉车）
  - 一次翻曲：HELPER（打杂）
  - 拆曲：CART_PULLER（拉车）
- **核心算法**：最大余数法（已在 `ScoreAllocator.uts` 实现）

## Requirements

### 1. 新建 biz-cross-bin-input 组件

**组件职责**：
- 展示跨仓岗位录入区域（人员选择 + 工分输入）
- 调用 `allocateCrossBinPoints()` 计算来源分配
- 展示来源分配预览（可选，便于现场核对）

**Props**：
```typescript
type CrossBinInputProps = {
  stageCode: StageCode           // 当前环节
  bins: StageBinInfo[]           // 当前会话的发酵仓列表（含 bin_id, stage_bin_id, koji_count）
  occupiedPersonIds: number[]    // 已被占用的人员 ID（用于互斥）
  roleCode: RoleCode             // 岗位代码（CART_PULLER / HELPER）
  roleName: string               // 岗位名称（拉车 / 打杂）
}
```

**Emits**：
```typescript
// 当分配变更时触发
emit('change', {
  person_id: number | null
  person_name: string
  points_units: PointsUnits
  sources: AssignmentSourceCreateParams[]  // 来源分配结果
})
```

**UI 结构**：
```
┌─────────────────────────────────────────┐
│ 拉车（跨仓）                              │
├─────────────────────────────────────────┤
│ 人员: [人员选择器]                        │
│ 工分: [输入框] [+0.1] [-0.1]             │
│ 提示: 工分将从所选发酵仓按曲坯比例扣减      │
│ 来源预览（可折叠）:                        │
│   3-3-1: 5.2分 (40%)                     │
│   3-3-2: 7.8分 (60%)                     │
└─────────────────────────────────────────┘
```

### 2. 集成到 entry.uvue 录入页

**位置**：在"发酵仓卡片区"上方，作为"共享/会话任务区（Global）"的一部分

**条件渲染**：
- 仅当 `stageHasCrossBinRole(stageCode)` 返回 true 时显示
- 根据环节动态展示对应岗位（安曲/拆曲显示拉车，一翻显示打杂）

**数据流**：
1. 用户选择人员 + 输入工分
2. 组件调用 `allocateCrossBinPoints(bins, pointsUnits)` 计算来源
3. 组件 emit change 事件，父组件更新 crossBinAssignments 状态
4. 提交时将 crossBinAssignments 写入 Assignment 表（scope=CROSS_BIN）
5. 同时写入 AssignmentSource 表记录来源

### 3. 数据校验

**BIN 平衡校验**（在提交时）：
```
对每个发酵仓:
bin.total_points_units = sum(BIN分配原始工分) + sum(从该仓抽取的工分)
```

**来源完整性校验**：
```
对每条跨仓分配:
Assignment.points_units = sum(AssignmentSource.source_points_units)
```

## Acceptance Criteria

- [ ] biz-cross-bin-input 组件正确实现人员选择 + 工分输入
- [ ] 工分变更时自动调用 allocateCrossBinPoints 计算来源分配
- [ ] 来源分配结果正确（sum = 输入工分，按曲坯比例分配）
- [ ] 组件在安曲/一翻/拆曲环节正确显示对应岗位
- [ ] 人员互斥：已选人员在其他位置置灰
- [ ] 工分输入支持直接输入 + Stepper 微调（0.1 精度）
- [ ] 类型安全：遵循 UTS 规范，无 any 类型

## Technical Notes

### 已有代码

- `ScoreAllocator.uts`: `allocateCrossBinPoints()` 已实现最大余数法
- `StageCoefService.uts`: `stageHasCrossBinRole()` 判断环节是否有跨仓岗位
- `biz-worker-selector-pinyin.uvue`: 人员选择器组件可复用

### 类型定义

```typescript
// 来自 domain/models/assignment.uts
type AssignmentSourceCreateParams = {
  assignment_id: number
  stage_bin_id: number
  source_points_units: PointsUnits
}

// 来自 domain/services/ScoreAllocator.uts
type BinInfo = {
  bin_id: number
  stage_bin_id: number
  koji_count: number
}

type CrossBinAllocationResult = {
  sources: AssignmentSourceCreateParams[]
  totalUnits: PointsUnits
}
```

### 注意事项

1. **UTS 类型约束**：使用 `type` 而非 `interface`，避免嵌套对象字面量
2. **整数单位**：工分使用 PointsUnits（整数，1单位=0.1分）
3. **人员互斥**：通过 occupiedPersonIds prop 传入已占用人员
4. **ucss 样式**：仅支持 flex 布局和类选择器
