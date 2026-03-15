# 经验教训记录

本文档记录开发过程中遇到的坑、非显而易见的问题和解决方案。

---

## 2026-03-15: 编译错误修复系列

### 问题1: AppStore API 参数命名不一致

**现象：**
- 编译错误：`Number?` vs `Number` 类型不匹配
- 位置：`saveDraftSession()`, `saveSubmittedSession()`, `loadSessionForEdit()`, `deleteDraftSession()`

**根本原因：**
- storage-repository 层使用 `roundId: number | null`
- AppStore 层错误地使用 `classNo: number`
- 导致调用时传入 `this.roundId` (nullable) 出现类型不匹配

**解决方案：**
- 统一 AppStore 层的参数名和类型为 `roundId: number | null`
- 与 storage-repository 层保持一致

**教训：**
- 三层架构的类型签名必须保持一致
- 参数命名要准确反映业务含义（roundId 不是 classNo）

---

### 问题2: 过度严格的验证导致业务逻辑错误

**现象：**
- 用户设置班级编号为 3 后，自动变回 1
- 显示"已保存"但实际未生效

**根本原因：**
```typescript
// 错误的验证逻辑
if (classNo == 1 || classNo == 2) {
  return classNo
}
return 1 // 默认值
```
- 只允许 1 或 2，导致保存的 3 被当作无效值
- 这是修复类型安全时引入的过度限制

**解决方案：**
```typescript
// 正确的验证逻辑
if (classNo != null && classNo > 0) {
  return classNo
}
return 1 // 默认值
```

**教训：**
- 类型安全修复时要理解业务需求，不要过度限制
- 验证逻辑应该基于业务规则，而非假设
- 修复后要进行端到端测试

---

### 问题3: 系数变更检测误报

**现象：**
- 系数未修改，但保存时创建了新版本
- 每次保存都生成新的版本ID

**根本原因：**
```typescript
// 错误：比较整个对象（包含元数据）
const currentJson = JSON.stringify(currentCoefSet)
const newJson = JSON.stringify(coefSet)
```
- 存储的系数包含元数据字段（id/name/effectiveFrom等）
- 页面提交的数据只有系数字段（stages/duiQu/liangTang）
- 导致即使系数未变，JSON 字符串也不相等

**解决方案：**
```typescript
// 正确：只比较系数字段
const normalizeCoefSet = (set: UTSJSONObject): UTSJSONObject => {
  return {
    stages: set['stages'],
    duiQu: set['duiQu'],
    liangTang: set['liangTang']
  } as UTSJSONObject
}
const currentNormalized = JSON.stringify(normalizeCoefSet(currentCoefSet))
const newNormalized = JSON.stringify(normalizeCoefSet(coefSet))
```

**教训：**
- 对象比较要明确比较的字段范围
- 存储层和业务层的数据结构可能不完全一致
- 变更检测要基于业务关键字段，而非所有字段

---

### 问题4: 函数命名不一致导致编译错误

**现象：**
- `getBinSeqMaxByFloor` not found
- `loadCoefSetById` not found
- `getActiveCoefSetId` not found

**根本原因：**
- 重构时移除了函数别名，但部分调用点未更新
- 不同文件使用了不同的命名约定

**解决方案：**
- 全局搜索并替换所有调用点
- 统一命名约定：
  - `getBinSeqMax` (不带 ByFloor 后缀)
  - `loadCoefSet` (不带 ById 后缀)
  - `loadActiveCoefSetId` (load 前缀，不是 get)

**教训：**
- 重构API时要全局搜索所有调用点
- 使用 IDE 的重命名功能而非手动查找替换
- 保持命名约定的一致性

---

### 问题5: 魔法数字散落各处

**现象：**
- 代码中多处硬编码 `260000`（默认系数版本ID）
- 修改时容易遗漏

**解决方案：**
- 定义常量 `const DEFAULT_COEF_SET_ID = 260000`
- 全局替换硬编码为常量引用

**教训：**
- 避免魔法数字，使用命名常量
- 常量应该定义在使用最频繁的模块中
- 便于维护和理解代码意图

---

### 问题6: 自动保存在初始化时误触发

**现象：**
- 页面加载时自动保存被触发4次（AN_QU阶段）
- 没有用户操作，但 `scheduleAutoSave()` 被调用
- 日志显示来自 LiangTang 角色卡的 `change` 事件

**根本原因：**
```typescript
// 错误方案：使用时间延迟
setTimeout(() => {
  this.autoSaveEnabled = true;
}, 0);
```
- 组件的 `watch.poolUnits` 在异步更新周期中触发
- `setTimeout(..., 0)` 在组件 watch 回调之前执行
- 导致 `autoSaveEnabled` 被设置为 `true` 时，组件仍在初始化

**触发路径：**
1. `entry.uvue` 的 `applyState()` 设置 LiangTang 角色的 `poolUnits`
2. `biz-session-role-card` 的 `watch.poolUnits` 检测到变化
3. 如果只有1个工人，自动填充工分并 emit `change`
4. `entry.uvue` 的 `onLiangTangRoleChange()` 调用 `scheduleAutoSave()`
5. 4个 LiangTang 角色卡 = 4次触发

**解决方案：**
```typescript
// 正确方案：标记事件来源
// 1. 组件标记系统变更
emitChange(source: string = "user") {
  const payload = {
    roleCode: this.roleCode,
    workers: workersData,
    source: source  // "user" | "system"
  }
  this.$emit('change', payload)
}

// watch.poolUnits 使用 source: "system"
watch: {
  poolUnits: {
    handler(newVal: number) {
      if (this.workers.length == 1) {
        this.workers[0].pointsUnits = newVal
        this.emitChange('system')  // 标记为系统变更
      }
    }
  }
}

// 2. 页面只对用户变更自动保存
onLiangTangRoleChange(payload: UTSJSONObject) {
  // 更新状态（无论来源）
  this.updateLiangTangRole(payload)

  // 只对用户操作自动保存
  if (payload['source'] != 'system') {
    this.scheduleAutoSave()
  }
}
```

**同样适用于：**
- `biz-bin-selector` 的 `autoInfer` 预选
- `biz-session-role-card` 的 `watch.poolUnits` 自动填充
- 任何组件的初始化/派生逻辑

**教训：**
- 时间延迟（setTimeout）不可靠，组件生命周期是异步的
- 区分"系统派生变更"和"用户操作"，使用显式标记
- 自动保存应该只响应用户操作，不响应初始化/计算
- 组件 emit 事件时应该包含来源信息（source/reason）

---

## 最佳实践总结

1. **类型安全修复**
   - 理解业务需求，不要过度限制
   - 验证逻辑基于业务规则
   - 修复后进行端到端测试

2. **API 重构**
   - 全局搜索所有调用点
   - 保持三层架构的类型一致性
   - 使用 IDE 重构工具

3. **对象比较**
   - 明确比较的字段范围
   - 考虑存储层和业务层的差异
   - 基于业务关键字段比较

4. **代码质量**
   - 避免魔法数字
   - 保持命名约定一致
   - 参数命名要准确反映业务含义
