# Task: bin-config-round

## Overview

实现 Phase 2 发酵仓配置和轮次管理功能，为安曲录入提供基础数据支撑。包含发酵仓数据模型、楼层默认仓数配置、轮次 CRUD 服务及计分权推断逻辑。

## Requirements

### 1. 发酵仓配置 (FermentBin)

- **数据模型**: 使用已有的 `FermentBin` 类型（domain/models/ferment.uts）
- **楼层默认仓数配置**:
  - 存储 Key: `pp:cfg:binSeqMaxByFloor`
  - 格式: `{"3":24,"4":24,"5":24}` (3/4/5楼各24仓)
  - 支持用户自定义修改
- **班级配置页 UI**:
  - 在 class-config.uvue 添加楼层仓数编辑功能
  - 每层楼显示当前配置的仓数，支持修改

### 2. 轮次管理 (FermentRound)

- **数据模型**: 使用已有的 `FermentRound` 类型
- **轮次 CRUD 服务**:
  - 创建新轮次
  - 读取当前轮次
  - 更新轮次信息
  - 列出历史轮次
- **micro_enabled 计分权推断逻辑**:
  - 读取上个轮次的 `micro_enabled` 值
  - 新轮次 `micro_enabled` = 上轮次取反（1→0, 0→1）
  - 首次无历史数据时，弹窗询问用户选择
- **轮次切换交互**:
  - 在安曲录入页提供轮次切换入口
  - 切换时自动推断计分权

## Acceptance Criteria

- [ ] Storage Key `pp:cfg:binSeqMaxByFloor` 已定义并可正常读写
- [ ] 班级配置页可编辑 3/4/5 楼的默认仓数
- [ ] 轮次 CRUD 方法（save/load/list）正常工作
- [ ] 新建轮次时 micro_enabled 自动推断正确
- [ ] 首次创建轮次时弹窗询问计分权选择
- [ ] 轮次变更事件通过 EventBus 正确广播
- [ ] 所有代码符合 UTS 语法约束

## Technical Notes

1. **UTS 关键约束**:
   - 使用 `type` 而非 `interface`
   - 使用 `null` 而非 `undefined`
   - 条件语句必须使用布尔值
   - 对象字面量默认为 `UTSJSONObject`

2. **Storage 模式**:
   - 遵循 storage-repository.uts 现有模式
   - 使用 storage-keys.uts 统一管理 Key

3. **服务层模式**:
   - 参考 ScoreCalculator.uts 的服务设计
   - 新建 BinService.uts 和 RoundService.uts

4. **状态管理**:
   - 轮次变更通过 AppStore EventBus 广播
   - 事件名: `round:changed`

## Out of Scope

- 发酵仓的云端同步（Phase 3）
- 轮次历史数据统计报表
- 多班级轮次管理（当前仅支持单班级）
- 发酵仓的批量导入导出
