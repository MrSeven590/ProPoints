# 实现统计查询页面 (P5-T03~T06)

## Goal
实现统计模块的核心查询页面,包括每日公示预览、按人员查询、按仓查询和统计首页概览。

## Requirements

### P5-T03: 每日公示预览页
- 按日期+环节展示公示列表
- 默认显示最终分,可切换原始/扣分/最终
- 布局适合截图发送群
- 同一日期不同环节可独立公示,互不影响

### P5-T04: 按人员查询(工资条)
- 集成拼音人员选择器
- 按人员维度汇总每日工分(原始/扣分/最终)
- 可展开查看扣分明细原因
- 数据来源可追溯到具体会话

### P5-T05: 按发酵仓查询(追责定位)
- 集成发酵仓选择器
- 按日期+仓号展示该仓当日人员与站位顺序(门口→最里面)
- 可查看对应扣分记录
- 能准确展示站位顺序与人员(position_index)

### P5-T06: 统计首页概览
- 实现聚合指标(按月/按日)
- 展示本月录入次数、总工分、参与人数
- 优先从索引聚合,避免全量扫描
- 数据量增大时依旧不卡顿

## Acceptance Criteria

- [ ] P5-T03: 公示页展示口径正确且可切换列(原始/扣分/最终)
- [ ] P5-T03: 同一日期不同环节可独立公示,互不影响
- [ ] P5-T04: 选择人员后能看到按日期的工分明细与扣分原因
- [ ] P5-T04: 数据来源可追溯到具体会话(支持跳转回录入页编辑)
- [ ] P5-T05: 能准确展示站位顺序与人员(position_index)
- [ ] P5-T05: 可关联展示该仓相关的扣分原因(用于追责说明)
- [ ] P5-T06: 指标能反映真实数据(提交/草稿区分口径需明确)
- [ ] P5-T06: 数据量增大时依旧不卡顿(避免遍历全部key)
- [ ] 所有查询必须过滤 status='draft' 的草稿数据
- [ ] 旧数据没有 status 字段时视为已提交

## Technical Notes

### 关键约束
- 查询数据时必须检查 `status` 字段,过滤掉 `status == 'draft'` 的草稿
- 旧数据可能没有 `status` 字段,视为已提交
- 工分显示使用 `unitsToPoints()` 和 `formatPointsUnits()` 转换
- 最终分计算: `final = raw - SUM(deducted)`

### 复用组件
- `biz-worker-selector-pinyin`: 人员选择器(拼音搜索)
- `biz-bin-selector`: 发酵仓选择器
- `storage-repository.uts`: 会话查询函数

### 数据查询函数
- `getSessionsByDate(date)`: 获取某日期的所有会话
- `getSessionsByDateAndStage(date, stageCode)`: 获取某日期某环节的会话
- `loadSession(date, stageCode, roundId)`: 加载单个会话

### 页面文件
- `pages/stats/index.uvue`: 统计首页
- `pages/stats/date-detail.uvue`: 每日公示预览
- `pages/stats/person-detail.uvue`: 按人员查询
- `pages/stats/bin-detail.uvue`: 按仓查询
