# Journal - MrSeven (Part 1)

> AI development session journal
> Started: 2026-02-02

---


## Session 1: Phase 1: 基础架构搭建

**Date**: 2026-02-02
**Task**: Phase 1: 基础架构搭建

### Summary

(Add summary)

### Main Changes

## 完成内容

### 存储方案变更
- 从 SQLite 改为 `uni.*Storage`（key-value 本地持久化）
- 按"日期/环节/轮次"拆分 Key，适配小程序端容量限制

### 新增目录结构

| 目录 | 说明 |
|------|------|
| `storage/` | 存储层（storage-keys、storage-repository、oplog、init） |
| `domain/models/` | 类型定义（types、ferment、person、stage-session、assignment） |
| `domain/services/` | 业务服务（ScoreCalculator、ScoreAllocator、Validator） |
| `domain/stores/` | 状态管理（AppStore - EventBus + Storage） |

### 新增页面骨架

- 工作台：`pages/index/index.uvue`
- 工分录入：`pages/work/entry.uvue`
- 统计：`pages/stats/index.uvue`、`date-detail.uvue`、`person-detail.uvue`、`bin-detail.uvue`
- 我的：`pages/mine/index.uvue`、`settings.uvue`、`class-config.uvue`、`roster-import.uvue`

### 配置更新

- TabBar：工作台 | 统计 | 我的
- 更新 PRD 和方案总结：明确一期使用 `uni.*Storage` 存储方案

## 技术要点

- 使用 `type` 而非 `interface`（UTS 规范）
- 使用 `null` 而非 `undefined`
- 对象字面量使用 `as UTSJSONObject` 类型断言
- 预留同步字段：`uuid/version/sync_status/updated_at/deleted_at/device_id`

### Git Commits

| Hash | Message |
|------|---------|
| `c177753` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 2: 实现纯 UTS 拼音匹配服务

**Date**: 2026-02-04
**Task**: 实现纯 UTS 拼音匹配服务

### Summary

(Add summary)

### Main Changes

## 完成内容

| 功能 | 说明 |
|------|------|
| PinyinMatchService | 纯 UTS 实现的拼音匹配服务，解决 uni-app-x 无法使用 npm 库问题 |
| PersonSearchService | 人员搜索服务，支持中文/全拼/首字母匹配 |
| 花名册导入页面 | roster-import.uvue 集成拼音搜索 |

## 技术要点

- **问题**: uni-app-x App 端编译为原生 Kotlin/Swift，无法使用 npm 的 pinyin-match 库
- **方案**: 参考 pinyin-match 源码，用纯 UTS 重新实现
- **实现**: 内置完整简体中文拼音字典（840行），支持全拼和首字母匹配

## 新增文件

- `domain/services/PinyinMatchService.uts` - 拼音匹配核心服务
- `domain/services/PersonSearchService.uts` - 人员搜索服务

## API

```typescript
// 拼音匹配（支持中文、全拼、首字母）
pinyinMatch(input: string, keyword: string): boolean

// 获取拼音首字母
getInitials(cn: string): string
```

### Git Commits

| Hash | Message |
|------|---------|
| `7fbdd0b` | (see git log) |
| `8341d78` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 3: 实现纯 UTS 拼音匹配服务

**Date**: 2026-02-04
**Task**: 实现纯 UTS 拼音匹配服务

### Summary

(Add summary)

### Main Changes

## 本次完成

| 功能 | 说明 |
|------|------|
| PinyinMatchService | 纯 UTS 实现的拼音匹配服务，解决 uni-app-x 无法使用 npm 库问题 |
| PersonSearchService | 人员搜索服务，支持中文/全拼/首字母匹配 |
| 花名册导入 | 集成拼音匹配的花名册导入功能 |

## 关键发现

- **uni-app-x App 端不支持普通 npm 库**（编译为原生 Kotlin/Swift）
- `pinyin-match` 是 npm 库，无法在 App 端使用
- 解决方案：参考 pinyin-match 源码，用纯 UTS 重新实现

## 新增文件

- `domain/services/PinyinMatchService.uts` - 840行，内置完整拼音字典
- `domain/services/PersonSearchService.uts` - 人员搜索服务

## API

\`\`\`typescript
// 拼音匹配（支持中文、全拼、首字母）
pinyinMatch(input: string, keyword: string): boolean

// 获取拼音首字母
getInitials(cn: string): string
\`\`\`

### Git Commits

| Hash | Message |
|------|---------|
| `7fbdd0b` | (see git log) |
| `8341d78` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 4: 轮次管理与管理员追溯功能

**Date**: 2026-02-05
**Task**: 轮次管理与管理员追溯功能

### Summary

(Add summary)

### Main Changes

## 完成内容

| 功能 | 描述 |
|------|------|
| 轮次管理服务 | 新增 RoundService.uts，支持首次初始化、修正、冲突检测 |
| 首次初始化弹窗 | 用户首次使用时选择年度/轮次/计分权（默认26年1轮次） |
| 修正功能 | 原地更新当前轮次状态，不创建新记录 |
| 管理员追溯 | StageSession/Assignment 添加 created_by_manager/updated_by_manager |
| 存储架构统一 | settings.uvue 改用 AppStore，更新 storage-keys 注释 |
| 文档同步 | 方案总结.md 与代码一致性（Codex 审查） |

## 关键文件

**新增**:
- `domain/services/RoundService.uts` - 轮次管理服务

**修改**:
- `domain/models/ferment.uts` - FermentRound 添加 year 字段
- `domain/models/assignment.uts` - 添加管理员追溯字段
- `domain/models/stage-session.uts` - 添加管理员追溯字段
- `pages/mine/class-config.uvue` - 初始化/修正弹窗 UI
- `pages/mine/settings.uvue` - 改用 AppStore
- `.claude/方案总结.md` - 数据模型同步更新

## Codex 审查要点

1. ferment_round 唯一约束改为 `UNIQUE(class_no, year, round_no)`
2. 所有实体明确列出 created_at 字段
3. 移除 jsonToRound() 旧数据兼容代码

### Git Commits

| Hash | Message |
|------|---------|
| `6d9daeb` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 5: 性能优化与发酵仓选择器组件

**Date**: 2026-02-06
**Task**: 性能优化与发酵仓选择器组件

### Summary

(Add summary)

### Main Changes

## 本次会话完成内容

### 新增组件
| 组件 | 说明 |
|------|------|
| `biz-bin-selector` | 发酵仓选择器，支持楼层切换、网格选择、长按范围选 |
| `BinService` | 仓位服务，智能推断下一批仓位 |

### 性能优化
| 模块 | 优化点 | 效果 |
|------|--------|------|
| 花名册导入 | Map 替代 indexOf | O(n²) → O(n) |
| 花名册导入 | validCount 缓存 | 避免重复计算 |
| 花名册导入 | 搜索防抖 120ms | 减少渲染 |
| 发酵仓选择器 | selectedSeqLookup | O(n) → O(1) |

### Bug 修复
- v-for 浮点数警告：seqMax 添加 Math.floor()

### 变更文件
- `components/biz-bin-selector/biz-bin-selector.uvue` (新增)
- `domain/services/BinService.uts` (新增)
- `pages/mine/roster-import.uvue` (优化)
- `pages/work/entry.uvue` (接入选择器)

### Git Commits

| Hash | Message |
|------|---------|
| `7282265` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 6: Phase 3 工分计算核心服务实现

**Date**: 2026-02-06
**Task**: Phase 3 工分计算核心服务实现

### Summary

(Add summary)

### Main Changes

## 完成内容

| 模块 | 说明 |
|------|------|
| ScoreAllocator | 新增仓内按技能系数分配算法（最大余数法）、微调平衡算法 |
| StageCoefService | 工序系数配置服务，支持存储层优先读取 |
| DuiQuBaseService | 堆曲基数服务，晾堂岗位工分池计算 |

## Codex 审查修复

- 避免修改输入参数（创建 coefs 副本）
- 移除全局计数器，改用 rotationCount 参数
- 添加负数工分校验（newPointsUnits < 0）
- 统一系数来源（存储层 + 硬编码回退）
- getAllStageCoefs/getAllLiangTangRoleCoefs 返回实际存储值
- getStageRoleConfigs 对接 loadStageRoleDefaults()

## 新增文件

- `domain/services/StageCoefService.uts` - 工序系数配置服务
- `domain/services/DuiQuBaseService.uts` - 堆曲基数服务

## 修改文件

- `domain/services/ScoreAllocator.uts` - 新增分配算法
- `domain/services/index.uts` - 服务导出
- `.trellis/spec/backend/directory-structure.md` - 文档更新

## 关键算法

1. **allocateBinPointsByCoef** - 仓内工分按技能系数分配（最大余数法）
2. **balanceAfterAdjustment** - 微调平衡算法，调整一人后自动平衡其他人
3. **calcAllLiangTangPools** - 计算晾堂岗位工分池

### Git Commits

| Hash | Message |
|------|---------|
| `b405cd5` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 7: 实现人员选择器组件（拼音搜索）

**Date**: 2026-02-06
**Task**: 实现人员选择器组件（拼音搜索）

### Summary

(Add summary)

### Main Changes

## 完成内容

| 功能 | 说明 |
|------|------|
| 拼音快速搜索 | 支持中文、全拼、首字母三种匹配方式 |
| 搜索防抖 | 300ms 防抖优化用户体验 |
| A-Z 分组 | 无搜索时按拼音首字母分组展示 |
| 人员互斥 | 已占用人员置灰不可选 |
| 选中高亮 | 当前选中人员视觉高亮 |

## Codex 审查修复

| 问题 | 修复方案 |
|------|----------|
| 定时器泄漏 | 添加 `beforeUnmount` 清理 `debounceTimer` |
| 搜索空格误判 | `doSearch` 中添加 `keyword.trim()` |
| O(n) 查找姓名 | 新增 `personNameMap` 实现 O(1) 查找 |

## 预留扩展

- 在 `SearchablePerson` 类型中预留 `name_pinyin_full` 和 `name_pinyin_initials` 字段
- 当前使用 `pinyinMatch` 实时计算，适用于 < 500 人
- 后续可在 roster-import 时生成预计算索引，将复杂度从 O(n×m) 降为 O(n)

## 新增文件

- `components/biz-worker-selector-pinyin/biz-worker-selector-pinyin.uvue` - 人员选择器组件
- `.trellis/tasks/02-06-biz-worker-selector-pinyin/` - 任务文档

## 修改文件

- `domain/services/PersonSearchService.uts` - 添加预计算索引字段注释
- `pages/work/entry.uvue` - 集成人员选择器组件

### Git Commits

| Hash | Message |
|------|---------|
| `02cd2bf` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 8: Phase 4: 跨仓岗位录入组件实现

**Date**: 2026-02-07
**Task**: Phase 4: 跨仓岗位录入组件实现

### Summary

(Add summary)

### Main Changes

## 完成内容

| 功能 | 说明 |
|------|------|
| biz-cross-bin-input 组件 | 跨仓岗位（拉车/打杂）工分录入，支持人员选择和工分输入 |
| 来源预览 | 可折叠显示各仓分配明细（按曲坯比例） |
| 手动添加/移除 | 二次翻曲等环节可手动添加跨仓岗位 |
| 共享类型定义 | StageBinInfo 类型定义在 ferment.uts |

## 关键经验

**UTS 名义类型系统问题**：
- 父子组件各自定义相同结构的 type，运行时会抛出 `ClassCastException`
- **最佳实践**：将共享类型定义在公共位置（如 `domain/models/`），父子组件 import 同一类型
- 已更新 `.trellis/spec/frontend/type-safety.md` 记录此经验

## 变更文件

- `components/biz-cross-bin-input/biz-cross-bin-input.uvue` (新增)
- `domain/models/ferment.uts` (新增 StageBinInfo 类型)
- `pages/work/entry.uvue` (集成跨仓组件)
- `.trellis/spec/frontend/type-safety.md` (更新规范)

### Git Commits

| Hash | Message |
|------|---------|
| `fa10cc2` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 9: P3-T04 仓卡片组件实现

**Date**: 2026-02-07
**Task**: P3-T04 仓卡片组件实现

### Summary

(Add summary)

### Main Changes

## 完成内容

### 新建文件
- `components/biz-bin-card/biz-bin-card.uvue` (860行) - 仓卡片组件

### 修改文件
- `pages/work/entry.uvue` - 集成仓卡片组件
- `.trellis/spec/frontend/type-safety.md` - 新增 Map 遍历章节
- `开发进度.md` - 更新任务状态

## 功能实现

| 功能 | 说明 |
|------|------|
| 仓号显示 | 仓号 + 仓内标签 |
| 曲坯数输入 | 仅 AN_QU 环节可编辑，步进 +/-100 |
| 总分计算 | calcBinTotalPointsUnits(kojiCount, coef) |
| 人员分配 | 站位顺序（门口→里面），支持添加/移除 |
| 工分输入 | 0.1 精度，PointsUnits 整数单位 |
| 分配状态 | 已分配/总分，平衡/不平衡提示 |
| 人员互斥 | occupiedPersonIds 跨卡片互斥 |
| 人员选择 | 集成 biz-worker-selector-pinyin |

## 修复问题

| 问题 | 解决方案 |
|------|----------|
| CSS 后代选择器 | ucss 不支持，改为独立类名 |
| Map 迭代器 | UTS 不支持 entries().next()，使用 forEach |
| :key 使用 index | 改为 stage_bin_id 避免状态错乱 |
| initialWorkers watcher | 移除 watcher，只在 mounted 初始化 |
| 已选人员显示占用 | 从 occupiedIds 排除当前位置已选人员 |

## Codex 审查

- 业务逻辑正确性：✅ 通过
- UTS 类型安全：✅ 通过
- 组件设计：✅ 通过（修复 3 个问题）

## 进度更新

- Phase 3 完成度：60% → 75%
- P3-T04 仓卡片组件：✅ 完成
- P3-T06 BIN 分配行：✅ 完成（已集成在 biz-bin-card）

### Git Commits

| Hash | Message |
|------|---------|
| `68269bf` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete

## Session 10: P3-T05 曲坯数复用功能实现

**Date**: 2026-02-07
**Task**: P3-T05 曲坯数复用功能实现

### Summary

(Add summary)

### Main Changes

## 完成内容

### 1. P3-T05 曲坯数复用（主要任务）
- 修改 `pages/work/entry.uvue`
- 非安曲环节(一翻/二翻/拆曲)自动从安曲记录获取曲坯数
- 缺失安曲记录时显示警告并阻止提交
- 提供跳转到安曲录入页面的入口

### 2. Bug 修复：CSS 类名冲突
- 修改 `components/biz-bin-card/biz-bin-card.uvue`
- `.worker-selector` → `.bin-worker-selector`
- 解决仓内人员选择器无法显示列表的问题

## 验收标准
- [x] 非安曲环节选仓后自动填入曲坯数
- [x] 无安曲记录时阻止提交并提示
- [x] 提供跳转到安曲录入页面的入口

## Codex 审查结果
- 任务验收标准全部满足
- 后续优化建议：binId 应使用稳定真实 ID

### Git Commits

| Hash | Message |
|------|---------|
| `c4fda88` | (see git log) |

### Testing

- [OK] (Add test results)

### Status

[OK] **Completed**

### Next Steps

- None - task complete
