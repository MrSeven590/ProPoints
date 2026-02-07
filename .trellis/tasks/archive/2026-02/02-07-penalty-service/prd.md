# P5-T01 扣分服务实现

## Goal

实现 `PenaltyService.uts` 服务，提供扣分记录的 CRUD 操作和汇总功能。扣分数据采用"独立明细"口径，最终分不回写 Assignment 原始分，而是在查询/统计时联表汇总。

## Requirements

### 核心功能

1. **JSON 转换函数**
   - `jsonToPenalty(json: UTSJSONObject): PenaltyRecord` - JSON 转类型
   - `penaltyToJson(penalty: PenaltyRecord): UTSJSONObject` - 类型转 JSON

2. **ID 生成**
   - `generatePenaltyId(penalties: PenaltyRecord[]): number` - 生成新 ID

3. **CRUD 操作**
   - `createPenalty(params: PenaltyRecordCreateParams): PenaltyRecord` - 创建扣分记录
   - `updatePenalty(id: number, deductedUnits: PointsUnits, reason: string, managerName: string): boolean` - 更新扣分记录
   - `deletePenalty(id: number): boolean` - 删除扣分记录

4. **查询函数**
   - `getPenaltiesByAssignment(assignmentId: number): PenaltyRecord[]` - 按分配行查询
   - `getPenaltiesBySession(sessionId: number): PenaltyRecord[]` - 按会话查询
   - `getPenaltiesByPerson(personId: number): PenaltyRecord[]` - 按人员查询
   - `getTotalDeductedByAssignment(assignmentId: number): PointsUnits` - 获取分配行扣分合计

5. **汇总函数**
   - `getAssignmentWithPenalty(assignment: Assignment): AssignmentWithPenalty` - 获取带扣分汇总的分配行
   - `getAssignmentsWithPenalties(assignments: Assignment[]): AssignmentWithPenalty[]` - 批量获取

### 存储口径

扣分数据嵌套在 session JSON 的 `penalties` 数组中，不单独存储 key。服务需要：
- 从 session 中读取 penalties 数组
- 修改后保存回 session

### 数据结构

已定义的类型（`domain/models/assignment.uts`）：

```typescript
type PenaltyRecord = {
  id: number
  uuid: string
  stage_session_id: number
  assignment_id: number
  target_person_id: number
  manager_name: string
  reason: string
  deducted_points_units: PointsUnits
  created_at: Timestamp
  updated_at: Timestamp
  version: number
  sync_status: SyncStatus
}

type PenaltyRecordCreateParams = {
  stage_session_id: number
  assignment_id: number
  target_person_id: number
  manager_name: string
  reason: string
  deducted_points_units: PointsUnits
}
```

## Acceptance Criteria

- [ ] 创建扣分记录后可正确持久化到 session
- [ ] 查询函数能正确返回扣分记录列表
- [ ] `getTotalDeductedByAssignment` 返回正确的扣分合计
- [ ] `getAssignmentWithPenalty` 返回的 `final_points_units = original - deducted`
- [ ] 扣分记录包含：日期、被考核人、考核人（管理员）、原因、扣分值
- [ ] 遵循 UTS 语言约束（使用 null 而非 undefined，条件语句使用布尔类型等）
- [ ] 服务导出到 `domain/services/index.uts`

## Technical Notes

- 参考 `RoundService.uts` 的 CRUD 模式
- 使用 `generateUUID()` 和 `getCurrentTimestamp()` 从 `types.uts`
- 扣分数据存储在 session 的 penalties 数组中
- 需要从 `storage-repository.uts` 导入 `loadSession/saveSession`
