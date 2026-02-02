# Phase 1: 基础架构搭建

## Goal

建立工分管理系统的项目骨架和数据层，为后续功能开发奠定基础。

## Requirements

### 1. 目录结构创建

按照方案总结中的架构创建目录：

```
/ProPoints
├── /database
│   ├── schema.sql          # SQLite建表脚本
│   └── repository.uts      # 数据访问层
├── /domain
│   ├── /models             # 实体类型定义
│   ├── /services           # 业务服务
│   └── /stores             # 状态管理
├── /components             # 业务组件
└── /pages                  # 页面
    ├── /index              # 工作台
    ├── /work               # 工分录入
    ├── /stats              # 统计
    └── /mine               # 我的
```

### 2. SQLite 数据库初始化

创建所有核心表：

**核心四表**：
- StageSession（工序会话）
- StageBin（发酵仓明细）
- Assignment（工分分配行）
- AssignmentSource（工分来源）

**辅助表**：
- ferment_bin（发酵仓基础信息）
- person（人员基础信息）
- ferment_round（轮次配置）
- penalty_record（考核扣分记录）
- process_role_type（岗位类型配置）
- process_stage_type（环节类型配置）
- process_stage_role_default（环节-岗位默认配置）
- skill_coeff_set（技能系数版本集）
- skill_coeff_item（技能系数明细）

### 3. 类型定义

在 `/domain/models/` 下创建 UTS 类型定义文件：

- `types.uts` - 基础类型（ProcessType, Scope, PointsUnits 等）
- `stage-session.uts` - StageSession 相关类型
- `assignment.uts` - Assignment 相关类型
- `person.uts` - Person 相关类型
- `ferment.uts` - 发酵仓和轮次相关类型

### 4. 基础 Repository 层

实现数据库初始化和基础 CRUD 操作：

- `database/db.uts` - 数据库连接和初始化
- `database/repository.uts` - 通用数据访问方法

### 5. TabBar 配置

配置底部导航栏（3个Tab）：
- 工作台（/pages/index/index）
- 统计（/pages/stats/index）
- 我的（/pages/mine/index）

### 6. 页面骨架

创建各页面的基础骨架（空页面，仅包含标题）。

## Acceptance Criteria

- [ ] 目录结构完整创建
- [ ] SQLite 建表脚本完成，包含所有表和约束
- [ ] 类型定义文件完成，符合 UTS 规范（使用 type 而非 interface）
- [ ] 数据库初始化代码完成
- [ ] TabBar 配置完成，可正常切换
- [ ] 各页面骨架创建完成
- [ ] 代码通过 lint 检查

## Technical Notes

### UTS 关键约束

- 使用 `type` 而非 `interface` 定义对象类型
- 使用 `null` 而非 `undefined`
- 条件语句必须使用布尔值
- 文件后缀：页面/组件用 `.uvue`，逻辑文件用 `.uts`

### 数据存储

- 整数单位存储：`points_units = points × 10`
- 预留同步字段：`uuid/version/sync_status/updated_at`

### 状态管理

- 不支持 pinia/vuex
- 使用 EventBus + Storage 实现
