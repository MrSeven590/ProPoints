# P5-T02: 录入页"考核"交互

## Goal

在录入页的每条人员分配行提供考核功能,支持扣分录入、原因填写,并实时计算最终工分。

## Requirements

### 功能需求

1. **考核按钮**
   - 在每个 worker-item 行添加【考核】按钮
   - 按钮位置: 工分输入控件右侧
   - 有扣分时按钮高亮显示

2. **考核输入区域**
   - 点击【考核】按钮后展开输入区域
   - 显示三段式工分:
     - 原始工分 (只读,灰色显示)
     - 扣分 (可输入,使用 biz-score-input 组件)
     - 最终工分 (自动计算,高亮显示)
   - 扣分原因输入框 (文本输入)
   - 保存/取消按钮

3. **数据校验**
   - 扣分 > 0 时,原因必填
   - 扣分 = 0 时,原因可不填
   - 扣分不能超过原始工分
   - 最终工分不能为负数

4. **实时计算**
   - 公式: `最终工分 = 原始工分 - 扣分`
   - 扣分值变化时实时更新最终工分显示

5. **数据持久化**
   - 使用 PenaltyService 保存扣分记录
   - 关联到对应的 assignment_id
   - 记录管理员姓名 (从 AppStore 获取)

### 交互需求

1. **展开/收起**
   - 点击【考核】按钮展开输入区域
   - 点击保存/取消后收起
   - 同一时间只能展开一个考核输入区域

2. **视觉反馈**
   - 有扣分的行,【考核】按钮使用警告色
   - 扣分输入时,最终工分实时更新
   - 保存成功后显示 toast 提示

3. **错误提示**
   - 扣分 > 0 但原因为空时,保存按钮禁用并提示
   - 扣分超过原始工分时,显示错误提示

## Acceptance Criteria

- [ ] 每个人员分配行都有【考核】按钮
- [ ] 点击按钮可展开考核输入区域
- [ ] 三段式工分显示正确 (原始/扣分/最终)
- [ ] 扣分值变化时最终工分实时更新
- [ ] 扣分 > 0 时原因必填,否则无法保存
- [ ] 保存后扣分数据持久化到 session
- [ ] 有扣分的行,按钮有视觉区分
- [ ] 重新进入会话时,扣分数据正确回显

## Technical Notes

### 数据结构

```typescript
// 使用 PenaltyService 的 API
import {
  createPenalty,
  updatePenalty,
  deletePenalty,
  getPenaltiesByAssignment,
  getAssignmentWithPenalty
} from '@/domain/services/PenaltyService.uts'

// 扣分记录创建参数
type PenaltyRecordCreateParams = {
  stage_session_id: number
  assignment_id: number
  target_person_id: number
  manager_name: string
  reason: string
  deducted_points_units: PointsUnits
}
```

### 实现位置

主要修改文件: `components/biz-bin-card/biz-bin-card.uvue`

在 worker-item 行中:
1. 添加【考核】按钮
2. 添加考核输入区域 (条件渲染)
3. 添加扣分状态管理
4. 集成 PenaltyService 调用

### 样式要求

- 遵循现有的 biz-bin-card 样式规范
- 考核输入区域使用卡片样式,与主卡片区分
- 按钮使用项目统一的按钮样式
- 扣分值使用警告色 (#f56c6c)
- 最终工分使用主题色高亮

### 依赖服务

- `PenaltyService.uts` - 扣分 CRUD
- `AppStore.uts` - 获取管理员姓名
- `biz-score-input.uvue` - 工分输入控件

### 注意事项

1. 使用 `null` 而非 `undefined`
2. 条件语句必须使用布尔值
3. 工分单位统一使用 PointsUnits (整数,1单位=0.1分)
4. 扣分数据保存到 session 的 penalties 数组中
5. 考核输入区域展开时,其他行的考核区域应收起
