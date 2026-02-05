# Directory Structure

> How backend code is organized in this project.

---

## Overview

本项目是 uni-app x 移动端应用，采用本地优先架构。业务逻辑主要在 `domain/` 目录下组织。

---

## Directory Layout

```
ProPoints/
├── domain/                    # 领域层（业务逻辑）
│   ├── models/               # 数据模型和类型定义
│   │   ├── types.uts         # 基础类型（StageCode, RoleCode, Scope 等）
│   │   ├── assignment.uts    # 工分分配相关类型
│   │   └── stage-session.uts # 会话相关类型
│   └── services/             # 业务服务
│       ├── index.uts         # 服务导出索引
│       ├── ScoreCalculator.uts    # 工分计算基础函数
│       ├── ScoreAllocator.uts     # 工分分配算法（跨仓/仓内/微调平衡）
│       ├── StageCoefService.uts   # 工序系数配置服务
│       ├── DuiQuBaseService.uts   # 堆曲基数服务
│       ├── Validator.uts          # 数据校验服务
│       ├── PersonSearchService.uts # 人员搜索服务
│       ├── PinyinMatchService.uts  # 拼音匹配服务
│       └── RoundService.uts       # 轮次管理服务
├── storage/                   # 存储层
│   ├── storage-keys.uts      # 存储键定义
│   ├── storage-repository.uts # 存储读写封装
│   └── init.uts              # 存储初始化
├── components/               # UI 组件
├── pages/                    # 页面
└── utils/                    # 工具函数
```

---

## Module Organization

### domain/services 服务层规范

1. **单一职责**: 每个服务文件负责一个业务领域
2. **类型导出**: 相关类型定义在同一文件中，通过 `export type` 导出
3. **函数导出**: 业务函数通过 `export function` 导出
4. **索引文件**: `index.uts` 统一导出所有服务

### 服务分类

| 服务类型 | 说明 | 示例 |
|---------|------|------|
| Calculator | 纯计算函数 | ScoreCalculator |
| Allocator | 分配算法 | ScoreAllocator |
| ConfigService | 配置读取 | StageCoefService |
| BaseService | 基数查询 | DuiQuBaseService |

---

## Naming Conventions

- **文件名**: PascalCase + `.uts` 后缀（如 `ScoreAllocator.uts`）
- **类型名**: PascalCase（如 `BinAllocationResult`）
- **函数名**: camelCase（如 `allocateBinPointsByCoef`）
- **常量名**: UPPER_SNAKE_CASE（如 `DEFAULT_STAGE_COEFS`）

---

## Key Services

### ScoreAllocator.uts

工分分配核心算法：

- `allocateCrossBinPoints()` - 跨仓比例抽取（最大余数法）
- `allocateBinPointsByCoef()` - 仓内按技能系数分配
- `balanceAfterAdjustment()` - 微调平衡算法

### StageCoefService.uts

工序系数配置服务：

- `getStageCoef()` - 获取工序系数（优先存储层）
- `getLiangTangRoleCoef()` - 获取晾堂岗位系数
- `getStageRoleConfigs()` - 获取环节岗位配置

### DuiQuBaseService.uts

堆曲基数服务：

- `getDuiQuBase()` - 获取当日堆曲基数
- `getAnQuLiangTangBase()` - 获取当日安曲晾堂基数
- `calcAllLiangTangPools()` - 计算晾堂岗位工分池

---

## Examples

参考 `domain/services/ScoreAllocator.uts` 作为服务实现的标准示例。
