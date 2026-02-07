# 仓内人员分配页面增加平分按钮

## Goal
在仓内人员分配卡片组件中增加一个"平分"按钮，允许用户一键将发酵仓总分平均分配给所有人员。

## Requirements
- 在 `biz-bin-card` 组件的按钮组中添加"平分"按钮
- 按钮位置：在 "+增加" 和 "-移除" 按钮的最右边
- 按钮文本：`= 平分`
- 按钮样式：与现有按钮保持一致的风格
- 点击按钮后，自动将仓总分（`totalPointsUnits`）平均分配给所有人员
- 使用最大余数法处理余数分配（确保分配后的总和等于仓总分）

## Acceptance Criteria
- [ ] 按钮在 UI 上正确显示，位于 "-移除" 按钮右侧
- [ ] 按钮样式与现有按钮风格一致
- [ ] 点击按钮后，所有人员的工分被平均分配
- [ ] 余数处理正确（使用最大余数法，优先分配给前面的人员）
- [ ] 分配后的总和等于仓总分
- [ ] 分配后触发 `emitChange()` 更新父组件
- [ ] 每个人员的 `displayPoints` 正确更新显示

## Technical Notes

### 数据结构
- `totalPointsUnits`: number - 仓总工分（整数单位，1单位=0.1分）
- `workerList`: WorkerItem[] - 人员列表
- `WorkerItem.pointsUnits`: number - 人员工分单位
- `WorkerItem.displayPoints`: string - 显示的工分（格式化为1位小数）

### 平分算法
1. 计算基础分配：`baseUnits = Math.floor(totalPointsUnits / workerList.length)`
2. 计算余数：`remainder = totalPointsUnits % workerList.length`
3. 前 `remainder` 个人员分配 `baseUnits + 1`，其余人员分配 `baseUnits`
4. 更新每个人员的 `displayPoints` 为 `unitsToPoints(pointsUnits).toFixed(1)`
5. 调用 `emitChange()` 通知父组件

### 相关文件
- `components/biz-bin-card/biz-bin-card.uvue` - 主要修改文件
- `domain/services/ScoreAllocator.uts` - 参考平均分配逻辑
- `domain/models/types.uts` - 类型定义

### 代码位置
- 按钮添加位置：第 73-81 行的 `worker-actions` view 中
- 方法添加位置：methods 区域（第 426 行附近）
- 样式添加位置：style 区域（第 744 行附近）
