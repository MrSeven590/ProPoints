# Storage Architecture

> 存储架构设计与索引策略

---

## Key 设计

### Session Keys

**草稿 (Draft)**
```
Key: pp:session:${date}:${stage}:${round}:draft
索引: pp:idx:draft (全局)
```

**已提交 (Submitted)**
```
Key: pp:session:${date}:${stage}:${round}
索引: pp:idx:date:${date} (按日期)
```

### 设计原则

1. **Key 分离**: 草稿和已提交使用不同的 key,防止相互覆盖
2. **索引分离**: 草稿使用全局索引,已提交使用按日期索引
3. **职责清晰**: Repository API 明确区分 draft 和 submitted 操作

---

## Repository API

### Draft Operations

```typescript
// 保存草稿 (写入 draft key + 维护全局索引)
saveDraftSession(date, stageCode, roundId, sessionData)

// 加载会话 (优先 draft,不存在则 submitted)
loadSessionForEdit(date, stageCode, roundId)

// 删除草稿 (删除 draft key + 从全局索引移除)
deleteDraftSession(date, stageCode, roundId)

// 获取所有草稿 (从全局索引读取)
getAllDraftSessions()
```

### Submitted Operations

```typescript
// 保存已提交 (写入 submitted key + 维护日期索引 + 删除 draft)
saveSubmittedSession(date, stageCode, roundId, sessionData)

// 删除已提交 (删除 submitted key + 从日期索引移除)
deleteSession(date, stageCode, roundId)

// 按日期查询已提交
getSessionsByDate(date)
getSessionsByDateAndStage(date, stageCode)
```

---

## 索引维护

### 全局草稿索引 (pp:idx:draft)

**维护时机**:
- `saveDraftSession()` → 添加 draft key
- `saveSubmittedSession()` → 移除 draft key
- `deleteDraftSession()` → 移除 draft key

**查询场景**:
- 工作台草稿列表
- 草稿数量统计

### 按日期索引 (pp:idx:date:${date})

**维护时机**:
- `saveSubmittedSession()` → 添加 submitted key
- `deleteSession()` → 移除 submitted key

**查询场景**:
- 统计首页 (本月概览)
- 每日公示预览
- 按人员/按仓查询

---

## 关键约束

### 1. 防止数据覆盖

❌ **错误**: 草稿和已提交使用相同 key
```typescript
// 危险! 会覆盖已提交数据
saveData(getSessionKey(date, stage, round), draftData)
```

✅ **正确**: 使用不同的 key
```typescript
// 安全: 草稿和已提交分离
saveDraftSession(date, stage, round, draftData)
saveSubmittedSession(date, stage, round, submittedData)
```

### 2. 加载优先级

编辑会话时,优先加载草稿:
```typescript
loadSessionForEdit(date, stage, round) {
  // 1. 尝试加载 draft
  let data = loadData(getSessionDraftKey(...))
  if (data != null) return data

  // 2. 不存在则加载 submitted
  return loadData(getSessionKey(...))
}
```

### 3. 提交时清理草稿

提交时必须删除对应的草稿:
```typescript
saveSubmittedSession(...) {
  // 1. 保存 submitted
  saveData(getSessionKey(...), data)
  addToIndex(getDateIndexKey(date), key)

  // 2. 删除 draft (关键!)
  deleteDraftSession(date, stage, round)
}
```

---

## 历史教训

### Bug: 草稿覆盖已提交数据

**问题**:
- 草稿和已提交使用相同 key
- 自动保存会覆盖已提交数据
- 导致数据丢失和状态降级

**解决方案**:
- Key 分离: draft key 添加 `:draft` 后缀
- 索引分离: 草稿使用全局索引,已提交使用日期索引
- API 分离: 明确区分 draft 和 submitted 操作

**验证要点**:
1. 快捷入口编辑已提交记录 → 自动保存不覆盖
2. 提交草稿 → 草稿正确删除
3. 统计查询 → 只显示已提交

### Bug: 晾堂功能关键问题修复 (2026-02-13)

**问题 1: 微机权限判断错误**
- 使用 `isMicroEnabledForCurrentRound()` 基于当前轮次
- 编辑历史会话时会使用错误的权限状态
- `microEnabled` 不会在页面显示/轮次变化时刷新

**解决方案**:
- 添加 `isMicroEnabledByRoundId(roundId)` 方法
- `initLiangTangSection()` 使用会话的 `roundId` 而非当前轮次
- `loadExistingSession()` 加载会话后刷新 `microEnabled`

**问题 2: 默认人员 Key 缺少班级号**
- 使用 `pp:cfg:liangtang-default` (全局)
- 多班级场景会冲突

**解决方案**:
- 修改为 `pp:cfg:liangtang-default:{classNo}`
- 所有调用处传入 `classNo` 参数

**问题 3: 晾堂工分计算公式错误**
- 使用 `/20` 作为基数
- 正确公式应为 `/160`

**解决方案**:
- `calcLiangTangPoolUnits()` 改为 `floor1(曲坯数/160 × 系数) × 10`

**验证要点**:
1. 编辑历史会话 → 微机权限正确
2. 多班级场景 → 默认人员不冲突
3. 晾堂工分计算 → 使用正确公式

---

## 性能考虑

### 草稿索引选择

**全局索引 vs 按日期索引**:

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|---------|
| 全局索引 | 一次读取,性能可预测 | 单 key 可能增长 | 草稿数量有限 |
| 按日期索引 | 避免单 key 过大 | 需要聚合多个索引 | 数据量极大 |

**选择**: 草稿使用全局索引
- 草稿数量通常不大 (用户会定期提交/删除)
- 1MB 限制风险极低
- 代码更简单,性能更好

### 已提交索引选择

**选择**: 已提交使用按日期索引
- 按日期查询是主要场景
- 避免单个索引无限增长
- 统计查询性能更好

---

## 最佳实践

1. **始终使用 Repository API**: 不要直接操作 storage
2. **提交时删除草稿**: 避免残留草稿
3. **加载时优先草稿**: 支持"编辑已提交"场景
4. **索引与数据同步**: 维护索引时同步更新数据
5. **防御性编程**: 读取索引时过滤 null 数据
