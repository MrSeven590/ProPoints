# Phase 3 三个 Commit 切分清单

## 背景

- 项目当前未上线，仍处于开发阶段。
- Phase 3 的目标是将组件间传递从 `UTSJSONObject` 收口到 typed 协议。
- 需要控制回归风险，因此采用“按组件边界逐个收口”的方式推进。
- 总原则：每次只改一个组件边界 + `pages/work/entry.uvue` 对应调用面，避免同时触碰 adapter / validator / storage。

## 执行顺序建议

1. **先做 Commit 1**：已有真实运行时崩溃，收益最高。
2. **再做 Commit 2**：仓卡片交互最复杂，需要在第一套 typed 模式稳定后推进。
3. **最后做 Commit 3**：cross-bin 逻辑耦合更强，放在最后最稳妥。

## 使用方式

每个 commit 建议严格按以下顺序执行：

1. 按“文件级改动清单”完成最小必要修改。
2. 执行编译验证：`compile-propoints-android.sh cycle`
3. 执行运行验证，优先覆盖该 commit 对应组件主路径。
4. 查看 HBuilderX 运行日志，确认没有新增 runtime 异常。
5. 通过后再进入下一个 commit；若未通过，不要并行推进下一块。

## 通用提交前检查清单

每个 commit 在提交前都应满足：

- [ ] 仅修改当前 commit 范围内文件，无跨组件顺手改动
- [ ] 已执行 `compile-propoints-android.sh cycle`
- [ ] 编译通过，无新增 UTS / 模板类型错误
- [ ] 已实际运行对应主路径
- [ ] 已查看 HBuilderX 日志
- [ ] 无新增 `ClassCastException` / `null` 字段异常 / payload 结构异常
- [ ] 自动保存、日期切换、轮次切换至少验证一次
- [ ] 未误改 adapter / validator / storage

---

## Commit 1

### 目标

优先收口 `entry.uvue -> biz-session-role-card.uvue`，直接解决当前已出现的晾堂运行态崩溃，并建立 Phase 3 的第一套 typed 组件协议范式。

### 风险等级

- **风险：低到中**
- **原因：** 改动面集中，但会影响晾堂四岗位初始化、回填、change payload 与只读模式。

### 涉及文件

- `components/biz-session-role-card/biz-session-role-card.uvue`
- `pages/work/entry.uvue`
- 视情况补充 type import：`domain/models/assignment.uts`

### 改动边界

#### `components/biz-session-role-card/biz-session-role-card.uvue`

- `initialWorkers` 从 `UTSJSONObject[]` 改为 `SessionWorkerData[]` 或 `SessionPenaltyWorkerData[]`
- watcher 参数改为 typed
- `initWorkersFromProps()` 改为 typed 属性访问，不再使用 `w['personId']`
- `change` payload 对齐 `SessionRoleCardChangePayload`

#### `pages/work/entry.uvue`

- `getLiangTangInitialWorkers()` 返回类型与组件 props 对齐
- `<biz-session-role-card :initialWorkers="...">` 直接传 typed 数组
- 不新增 legacy helper，不再走 `UTSJSONObject` 中转

### 文件级改动清单

- [ ] 检查 `biz-session-role-card.uvue` 中 `props.initialWorkers` 定义
- [ ] 检查 `watch` / `watchEffect` / `observer` 中与 `initialWorkers` 相关的参数类型
- [ ] 把 `initWorkersFromProps()` 内所有 `['xxx']` 读取改为 typed 属性访问
- [ ] 核对组件 `emit('change', ...)` 的 payload 结构与页面接收方一致
- [ ] 核对 `entry.uvue` 中 `getLiangTangInitialWorkers()` 的返回类型
- [ ] 核对四个 `<biz-session-role-card>` 调用点全部改为直接传 typed 数组
- [ ] 搜索并清理此组件范围内残余 `UTSJSONObject[]` 声明

### 明确不做

- 不改 `biz-bin-card.uvue`
- 不改 `biz-cross-bin-input.uvue`
- 不改 storage / adapter / validator
- 不顺手重构 `entry.uvue` 其它业务方法

### 验证重点

#### 编译

- 全量编译通过
- 重点关注组件 props / watcher / emit 的类型错误

#### 运行

- 安曲页面打开、回填已有晾堂数据不再报 `ClassCastException`
- 麦料 / 守机 / 下曲 / 微机四个岗位能正常显示默认值和历史值
- 修改人员、修改工分、单人池自动跟随仍正常
- 只读模式、日期切换、轮次切换后晾堂岗位正常

#### 日志

- 不再出现 `SessionPenaltyWorkerData cannot be cast to UTSJSONObject`
- `onLiangTangRoleChange()` 收到结构稳定的 payload，无字段缺失

### DoD（本 commit）

- [ ] 编译通过
- [ ] 安曲页面可正常打开
- [ ] 四岗位默认值 / 历史值 / 编辑均正常
- [ ] 不再出现 role-card 相关 cast 异常
- [ ] 切换日期 / 轮次后晾堂区正常

### 推荐 commit message

```markdown
refactor(role-card): type biz-session-role-card props and payloads
```

### 必须留到下一个 commit

- 不要顺手改 `biz-bin-card` 的 `initialWorkers`
- 不要顺手把 `biz-cross-bin-input` 一并 typed 化
- 不要动 adapter 命名、页面事实源结构、保存链

### 为什么这样切

- 这是当前 Phase 3 最直接的风险点，且已经有真实运行时故障
- 改动集中，验证路径清晰，收益/风险比最高

---

## Commit 2

### 目标

收口 `entry.uvue -> biz-bin-card.uvue` 的组件边界，去掉当前“页面内部 typed、组件边界靠 `toBinWorkerPayload()` 降回 `UTSJSONObject[]`”的过渡方案，让仓卡片组件 props / 内部初始化 / emit payload 统一 typed。

### 风险等级

- **风险：中到高**
- **原因：** `biz-bin-card` 交互最复杂，涉及工人列表、扣分、曲量、总分平衡、自动保存联动。

### 涉及文件

- `components/biz-bin-card/biz-bin-card.uvue`
- `pages/work/entry.uvue`
- `domain/models/assignment.uts`
- 如有必要：`domain/models/session.uts`

### 改动边界

#### `components/biz-bin-card/biz-bin-card.uvue`

- `initialWorkers` 从 `UTSJSONObject[]` 改成 `SessionPenaltyWorkerData[]`
- `initWorkerList()` 改为 typed 访问
- 组件内部 worker item 初始化与 penalty 字段保持 typed
- `change` / `penaltyChange` / `kojiChange` payload 与共享 type 明确对齐

#### `pages/work/entry.uvue`

- 模板直接传 `getBinWorkers(stageBinId)`，不再走 `toBinWorkerPayload()`
- 删除 `toBinWorkerPayload()` 及其调用
- 核对 `onBinCardChange()` 与 typed payload 是否一致

### 文件级改动清单

- [ ] 检查 `biz-bin-card.uvue` 中 `initialWorkers` props 类型
- [ ] 检查 `initWorkerList()`、worker 初始化逻辑、扣分字段初始化逻辑
- [ ] 搜索并替换 `['personId']`、`['pointsUnits']`、`['deductedUnits']`、`['penaltyReason']` 等弱类型访问
- [ ] 核对 `change / penaltyChange / kojiChange` emit payload 的共享类型
- [ ] 在 `entry.uvue` 删除 `toBinWorkerPayload()` 及全部调用
- [ ] 核对 `getBinWorkers()` 输出类型与组件 props 对齐
- [ ] 核对 `onBinCardChange()` / `onPenaltyChange()` / `onKojiChange()` 的接收契约

### 明确不做

- 不改 `biz-cross-bin-input.uvue`
- 不改晾堂组件之外的其它页面
- 不做 validator / storage 改造

### 验证重点

#### 编译

- 重点验证 `biz-bin-card` 模板和 methods 中 worker 字段访问是否还有 `['xxx']` 残留

#### 运行

- 新建仓卡片默认工人正常
- 历史 session 回填仓工人正常
- 改曲量、改工分、加减人员、扣分展开 / 收起正常
- 跨仓扣减显示和总分平衡计算不回归
- 日期切换、轮次切换、自动保存后再加载仍正常

#### 日志

- 不出现与 bin worker 有关的 cast 异常
- penalty 相关操作不出现字段丢失，如 `deductedUnits` / `penaltyReason` / `penaltyId`

### DoD（本 commit）

- [ ] 编译通过
- [ ] 仓卡片新建 / 回填正常
- [ ] 扣分、曲量、工分编辑正常
- [ ] 自动保存后重载数据正常
- [ ] 不出现 bin-card 相关 cast 或字段丢失异常

### 推荐 commit message

```markdown
refactor(bin-card): remove legacy worker payloads from entry to biz-bin-card
```

### 必须留到下一个 commit

- 不要在本 commit 同时改 `biz-cross-bin-input`
- 不要顺手改 `entry.uvue` 的 cross-bin 派生逻辑
- 不要动 `session-adapter.uts` 的 bin 映射实现，除非编译必需
- 不要把统计页、详情页的弱类型读取一并处理

### 为什么这样切

- `biz-bin-card` 交互最复杂，单独成 commit 便于定位回归
- 它虽然还没像 role-card 一样炸，但目前明显仍是 legacy 边界，是下一步最该收口的点

---

## Commit 3

### 目标

收口 `entry.uvue -> biz-cross-bin-input.uvue` 边界，完成 Phase 3 范围内三个核心组件的 typed 协议统一，并做一次仅限组件边界范围的残余弱类型清理。

### 风险等级

- **风险：中**
- **原因：** cross-bin 与来源仓分配、occupiedIds、汇总计算耦合较强，但前两块稳定后改造更可控。

### 涉及文件

- `components/biz-cross-bin-input/biz-cross-bin-input.uvue`
- `pages/work/entry.uvue`
- `domain/models/assignment.uts`
- 如组件 payload type 还没齐，可补共享 type 文件

### 改动边界

#### `components/biz-cross-bin-input/biz-cross-bin-input.uvue`

- props 中与人员、sources、工分相关的数据改为 typed
- watcher / 初始化逻辑去掉 `UTSJSONObject` 下标读取
- emit payload 对齐共享 type，避免页面再手工解析弱类型

#### `pages/work/entry.uvue`

- `onCrossBinChange()` 优先直接吃 typed payload
- 若已有 `parseCrossBinChangePayload()`，此 commit 可决定：
  - 保留兼容 wrapper，但主调用走 typed
  - 或删掉 wrapper，仅保留 typed
- 对 Phase 3 范围做残余搜索清理：
  - `UTSJSONObject`
  - `UTSJSONObject[]`
  - `['personId']`
  - `['pointsUnits']`

### 文件级改动清单

- [ ] 检查 `biz-cross-bin-input.uvue` 中 props 类型定义
- [ ] 检查初始化逻辑、watcher、emit payload 是否仍存在弱类型下标访问
- [ ] 核对 cross-bin 相关共享 payload type 是否完整
- [ ] 核对 `entry.uvue` 的 `onCrossBinChange()` 接收逻辑
- [ ] 决定 `parseCrossBinChangePayload()` 保留兼容还是删除，并保持单一主路径
- [ ] 对 Phase 3 范围执行一次残余弱类型搜索清理

### 明确不做

- 不扩散到 storage 层
- 不处理统计页和其它历史页面
- 不在同 commit 做 Phase 4 存储层改造

### 验证重点

#### 编译

- 三个组件与 `entry.uvue` 全部通过
- 搜索 Phase 3 范围内是否还残留不该存在的组件边界弱类型

#### 运行

- 跨仓人员选择、来源仓分配、工分合计、回填历史数据正常
- 与仓卡片、晾堂岗位的 `occupiedIds` 互斥关系正常
- 提交、自动保存、重载后 cross-bin 数据不丢

#### 日志

- 不再出现 cross-bin payload cast / null 字段异常
- 日期切换、提交前后无新增 runtime warning

### DoD（本 commit）

- [ ] 编译通过
- [ ] cross-bin 选择、来源分配、工分合计正常
- [ ] occupiedIds 互斥关系正常
- [ ] 自动保存 / 提交 / 重载后数据一致
- [ ] Phase 3 范围内无新增组件边界弱类型残留

### 推荐 commit message

```markdown
refactor(cross-bin): align biz-cross-bin-input with typed component contracts
```

### 必须留到后续阶段

- 不要在这里启动 Phase 4 storage typed 化
- 不要顺手改 stats/detail 等读侧页面
- 不要把所有 `UTSJSONObject` 全项目清零；只收口 Phase 3 范围

### 为什么这样切

- cross-bin 逻辑和来源分配耦合更强，放最后做最稳妥
- 前两个 commit 稳定后，再做第三块边界和范围内清理，能减少联动误判

---

## Phase 3 范围内统一搜索建议

每完成一个 commit，建议在对应范围内搜索以下内容，确认没有遗漏：

```markdown
UTSJSONObject
UTSJSONObject[]
['personId']
['personName']
['pointsUnits']
['deductedUnits']
['penaltyReason']
['penaltyId']
```

注意：搜索结果不要求“全项目清零”，只要求当前 commit 负责的组件边界已收口。

---

## 如果只能先做一个最有价值的 commit

```markdown
先做 Commit 1
```

### 原因

- 它已经对应真实运行时故障，收益是“立即消除崩溃”
- 晾堂 `role-card` 的边界最简单，typed 化成本最低，最适合先建立 Phase 3 模式
- 做完后可以验证一条关键原则：
  - `props typed -> watcher typed -> init typed -> emit typed`

---

## 总原则

- 每次只改一个组件边界 + `pages/work/entry.uvue` 对应调用面
- 每次都先保证编译和该组件主路径运行稳定，再进入下一个组件
- 每次都避免同时触碰 adapter / validator / storage，否则很难判断回归来自组件协议还是数据流
- 若某个 commit 运行验证失败，不要继续推进下一个 commit，应先在当前 commit 内收敛问题
