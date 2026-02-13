# 实现安曲晾堂 SESSION 岗位功能

## Goal
在安曲录入页面实现晾堂（SESSION 作用域）四个岗位的工分录入、计算和管理功能。

## Requirements

### 1. 四个晾堂岗位
- **麦料参数**：系数 0.85，默认 1 人，可增加人员
- **守机**：系数 0.8，默认 1 人，可增加人员
- **下曲**：系数 0.8，默认 1 人，可增加人员
- **微机**：系数 0.7，**严格 1 人**，受 `micro_enabled` 控制

### 2. 工分计算逻辑
- 基数：当日安曲总曲坯数（系统每天只有一个安曲会话）
- 岗位池子总分 = `floor1(当日安曲总曲坯数 / 20 × 岗位系数)`
- 曲坯数量变化时，自动更新所有晾堂岗位的池子总分

### 3. 人员默认延用
- 首次录入：所有岗位人员留空，由用户选择
- 后续录入：自动回填上一次安曲会话的晾堂人员（仅回填人员，不回填工分）
- 用户可随时修改人员，修改后成为下次默认值

### 4. 微机计分权控制
- 当 `micro_enabled=0` 时：
  - 微机岗位区域隐藏或禁用
  - 提交时校验不允许有微机分配记录
- 当 `micro_enabled=1` 时：
  - 微机岗位正常显示和录入

### 5. 岗位人员数量规则
- **微机**：严格 1 人，不允许增减
- **其他岗位**：默认 1 人，允许用户手动增加人员（通过 + 按钮）
- 岗位仅 1 人时：工分自动填入该人员，输入框只读

### 6. 数据存储
- SESSION 分配记录存储在 `StageSession` 的 `assignments` 数组中
- 默认人员存储在 `pp:cfg:liangtang-default:{classNo}`
- 存储格式：`{ WHEAT_MATERIAL: [personId], MACHINE_GUARD: [personId], ... }`

## Acceptance Criteria

- [ ] 安曲录入页面显示晾堂岗位区域（在跨仓岗位和仓卡片之间）
- [ ] 每个岗位显示：岗位名称、基数、系数、池子总分
- [ ] 曲坯数量变化时，晾堂池子总分实时更新
- [ ] 微机岗位根据 `micro_enabled` 显示/隐藏
- [ ] 首次录入时人员留空，后续录入自动回填上次人员
- [ ] 微机严格 1 人，其他岗位可增加人员
- [ ] 岗位仅 1 人时工分自动填入且只读
- [ ] 保存草稿/提交时正确存储 SESSION 分配记录
- [ ] 保存时更新晾堂默认人员配置
- [ ] 提交时校验微机计分权（micro_enabled=0 时不允许有微机记录）

## Technical Notes

### 现有基础设施
- 工分计算函数已存在：`ScoreCalculator.calcLiangTangPoolUnits()`
- 岗位系数配置已存在：`StageCoefService.getLiangTangRoleCoef()`
- 微机计分权判断已存在：`RoundService.isMicroEnabledForCurrentRound()`
- 默认人员存储函数已存在：`saveLiangTangDefault()` / `loadLiangTangDefault()`

### UI 结构
参考 CROSS_BIN 跨仓岗位的实现模式：
- 可复用 `biz-worker-selector-pinyin` 人员选择器
- 可复用 `biz-score-input` 工分输入组件
- 考虑创建 `biz-session-role-card` 组件封装单个岗位的 UI

### 数据流
1. 页面加载 → 获取当前轮次 `micro_enabled` 状态
2. 页面加载 → 加载晾堂默认人员
3. 曲坯数量变化 → 重算当日安曲总曲坯数 → 更新晾堂池子总分
4. 人员/工分变化 → 触发自动保存
5. 保存草稿/提交 → 存储 SESSION assignments + 更新默认人员

### 校验规则
- 每个岗位的池子平衡：`sum(岗位内人员工分) = 岗位池子总分`
- 微机计分权校验：`micro_enabled=0` 时不允许有微机分配记录
- 人员互斥：同一会话内人员不能重复（跨 BIN/CROSS_BIN/SESSION）
