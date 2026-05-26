# 数据导入类型边界 Team 执行指导

> 适用项目：ProPoints / uni-app x / UTS Android
> 编写日期：2026-05-26
> 关联方案：`数据导入与类型边界彻底重构执行方案.md`（标题已调整为“数据导入与类型边界渐进修复方案”）
> 目的：为 team 模式执行 P0 导入止血提供统一任务拆分、边界约束、验收标准和合并顺序。

---

## 1. 总目标

本轮只执行 **P0：Transfer 导入止血**，不是全项目彻底重构。

目标是让以下链路面对非法 JSON、缺字段、错类型、重复数据、本地历史字段缺失时不再触发 Android UTS 运行时崩溃：

```text
pages/transfer/transfer-import.uvue
  -> domain/stores/AppStore.uts::previewTransferImport(envelope)
    -> domain/services/TransferService.uts::unseal(text)
  -> domain/stores/AppStore.uts::applyTransferImport(payload, resolvedRoundId, applyFloorConfig)
```

本轮必须解决：

1. 外部导入 JSON 错误只返回业务错误，不触发 runtime crash。
2. `TransferService.unseal()` 不再让未校验字段进入 typed builder。
3. ANQ / CONFIG 空包、缺字段、重复数据在 preview 阶段被拦截。
4. AMBIGUOUS 轮次行为与页面候选选择 UI 对齐。
5. CONFIG / ANQ apply 阶段避免明显半写入。
6. 历史兼容只放在 parser / adapter / repository 读入口，不扩散到页面和业务规则。

---

## 2. 本轮严格不做事项

为避免过度工程化和长期兼容遗留，本轮禁止扩大范围：

- 不新增 `domain/services/transfer-import/` 目录。
- 不新增 `TransferImportFacade.uts`。
- 不新增 `TransferImportPreviewBuilder.uts`。
- 不新增 `TransferImportApplyService.uts`。
- 不新增 `utils/dynamic-boundary.uts`。
- 不做全量 storage migration。
- 不新增长期 `LegacyXXX` 双轨模型。
- 不修改导出格式。
- 不全项目清理 `UTSJSONObject`。
- 不顺手改 `session-adapter.uts`、`storage-repository.uts`、`default-data-parser.uts`，除非阻塞 P0 验收。

---

## 3. 历史兼容原则

### 3.1 外部导入 JSON：严格模式

导入包是跨设备、跨人传播的数据，必须尽早失败：

```text
缺必填字段 -> preview 失败
字段类型错误 -> preview 失败
重复 id/key -> preview 失败或明确 warning
版本不支持 -> preview 失败并提示升级/重新导出
```

不要为了兼容未知导入包而加入猜测逻辑。

### 3.2 本地历史 Storage：容错模式

本地旧数据是用户已存在的数据，目标是“不崩溃、可打开、可重新保存为新结构”：

```text
缺可选字段 -> 使用默认值
数组字段不是数组 -> 当空数组处理或跳过索引
数字字段缺失 -> 不进入索引或使用业务安全默认值
未知字段 -> 忽略，不回写
```

### 3.3 兼容逻辑放置位置

允许：

```text
TransferService 内部 decoder/parser
session-adapter.uts
storage-repository.uts 的索引提取边界
default-data-parser.uts
AnQuSnapshotService.uts / StageCoefService.uts 的 snapshot parser
```

禁止：

```text
pages/*.uvue
components/*.uvue
Validator 业务规则主体
Store 的普通状态推导逻辑
```

---

## 4. Team 任务拆分

### 4.1 任务 A：TransferService 导入校验增强

#### 负责人建议

一个实现 agent 独占该任务，不与其他 agent 同时修改 `TransferService.uts` 同一区域。

#### 修改文件

```text
domain/services/TransferService.uts
utils/json-reader.uts
```

#### 重点函数

```text
validateAnQuPayload()
validateConfigPayload()
validatePersonsArray()
validateCoefData()
buildAnQuPayloadFromJSON()
buildConfigPayloadFromJSON()
unseal()
```

#### 修改目标

1. 补齐 ANQ shape 校验：

```text
bins[].id: string
bins[].seq: number
bins[].floor: number
bins[].koji: number
```

2. 拒绝空 ANQ：

```text
bins.length == 0 -> EMPTY_BINS
```

3. 检测 ANQ 重复：

```text
duplicate bin.id
duplicate floor + seq
same floor + seq but different koji
duplicate f.floorNo
```

4. 拒绝空 CONFIG：

```text
persons == null && coef == null -> INVALID_PAYLOAD
```

5. 检测 CONFIG 重复：

```text
duplicate person.id
duplicate non-empty person.name
duplicate coef.stages.code
duplicate coef.duiQu.key
duplicate coef.liangTang.key
```

6. 小幅补齐 `utils/json-reader.uts`：

```text
readObjectArray
readStringArray
readNumberArray
isNumber
isString
isObjectArray
safeErrorMessage
```

#### 边界

- 保持 `unseal(text: string)` 外部签名不变。
- 不把 raw JSON 直接 `as TransferPayload`。
- builder 只读取 shape validation 已覆盖的字段。
- 不把 json-reader 做成大框架。

#### 验收

- 当前导出的 ANQ 可正常 preview。
- 当前导出的 CONFIG 可正常 preview。
- ANQ 缺 `seq` / `floor` 返回错误，不崩溃。
- ANQ `bins=[]` 返回 `EMPTY_BINS`。
- ANQ duplicate `id`、duplicate `floor + seq` 返回错误。
- CONFIG 空包返回 `INVALID_PAYLOAD`。
- CONFIG duplicate person id/name 返回错误或按产品决策 warning。
- CONFIG duplicate coef key 返回错误。

---

### 4.2 任务 B：AppStore preview/apply 止血

#### 修改文件

```text
domain/stores/AppStore.uts
```

#### 重点函数

```text
previewTransferImport()
applyTransferImport()
applyAnQuImportInStore()
applyConfigImportInStore()
```

#### 修改目标

1. 修正 AMBIGUOUS preview 行为。

建议约定：

```text
success = true
payload != null
payloadKind = 'ANQ'
matchStatus = 'AMBIGUOUS'
resolvedRoundId = null
candidates = 候选轮次
canImport = false，直到页面选择候选
```

2. `applyTransferImport()` 显式校验 ANQ `resolvedRoundId != null`。

3. CONFIG apply 预检查优先：

```text
如果 payload.coef != null：
  先检查 activeCoefSet 是否存在
  先构造 updatedCoefSet
  全部可写条件满足后再保存 persons / coef
```

4. ANQ apply 写入顺序调整：

```text
先构造 snapshot
先保存 snapshot
snapshot 成功后再按需保存楼层配置
```

#### 边界

- 不新增 ApplyService。
- 不实现完整事务 / staged rollback。
- 不改变导出结构。
- 不引入第二套 ImportPreview 结果结构。

#### 验收

- AMBIGUOUS 能让页面进入候选选择流程。
- ANQ 未选择轮次时不能 apply。
- CONFIG persons + coef 同包时，如果 active coef set 缺失，应整体失败且不保存 persons。
- CONFIG 仅 persons 时仍可导入人员。
- CONFIG 仅 coef 时 active coef set 存在才可导入。
- ANQ snapshot 保存失败时不提前声称楼层配置已应用。

---

### 4.3 任务 C：导入页面候选选择适配

#### 修改文件

```text
pages/transfer/transfer-import.uvue
```

#### 重点函数

```text
onParseData()
onCandidateChange()
canImport()
```

#### 修改目标

1. `onParseData()` 允许 `success=true && matchStatus='AMBIGUOUS'` 的 preview 进入 step 2。
2. 候选列表正常显示。
3. 选择候选后更新 `resolvedRoundId`。
4. `canImport()` 支持：

```text
matchStatus == 'AMBIGUOUS'
&& resolvedRoundId > 0
&& 冲突/警告确认满足
```

#### 边界

- 不改页面布局大结构。
- 不改导出页。
- 不新增导入状态模型。

#### 验收

- AMBIGUOUS 时显示候选列表。
- 未选择候选时确认导入不可用。
- 选择候选后确认导入可用。
- 冲突/警告确认逻辑仍有效。

---

### 4.4 任务 D：QA 验证

#### 修改文件

原则上不改源码，除非发现阻塞性问题并由主控确认。

#### 验证样例

至少覆盖：

1. 当前导出的 CONFIG。
2. 当前导出的 ANQ。
3. ANQ 缺 `seq`。
4. ANQ 缺 `floor`。
5. ANQ 空 `bins`。
6. ANQ duplicate `id`。
7. ANQ duplicate `floor + seq`。
8. CONFIG 空包。
9. CONFIG duplicate person id/name。
10. CONFIG duplicate coef key。
11. AMBIGUOUS round 候选选择。

#### 验证命令

```bash
git diff --check -- domain/services/TransferService.uts domain/stores/AppStore.uts pages/transfer/transfer-import.uvue utils/json-reader.uts
./compile-propoints-android.sh cycle
```

---

## 5. 合并顺序

必须按以下顺序合并，避免协议不一致：

```text
1. 合并任务 A：TransferService + json-reader
2. 编译验证
3. 合并任务 B：AppStore preview/apply
4. 合并任务 C：transfer-import 页面适配
5. 编译验证
6. 执行任务 D：QA 验证
7. 根据 QA 结果做最小修复
```

不要同时合并 B 和 C 后再找协议问题。B 必须先明确 AMBIGUOUS 的 `ImportPreview` 返回约定。

---

## 6. Team prompt 模板

### 6.1 任务 A prompt

```text
只修改 domain/services/TransferService.uts 和必要的 utils/json-reader.uts。
执行 P0 Transfer 导入校验止血：补 ANQ shape/empty/duplicate 校验，补 CONFIG empty/duplicate 校验，保持 unseal 外部签名不变，不新增 Facade/Builder/ApplyService，不修改导出结构。禁止 raw JSON 直接 as TransferPayload。完成后运行 git diff --check 和 Android 编译。
```

### 6.2 任务 B prompt

```text
只修改 domain/stores/AppStore.uts。
执行 P0 AppStore preview/apply 止血：修正 AMBIGUOUS preview 为 success=true 但 canImport=false 并保留 candidates/payload；applyTransferImport 显式校验 resolvedRoundId；CONFIG apply 做预检查优先避免 persons 已写而 coef 失败；ANQ apply 先保存 snapshot 再按需保存楼层配置。不新增 ApplyService/Facade。完成后运行 git diff --check 和 Android 编译。
```

### 6.3 任务 C prompt

```text
只修改 pages/transfer/transfer-import.uvue。
适配 AppStore 的 AMBIGUOUS preview 约定：onParseData 允许 success=true 且 matchStatus=AMBIGUOUS 进入候选选择；onCandidateChange 更新 resolvedRoundId；canImport 在选择候选且确认冲突/警告后允许导入。不改页面大结构，不改导出页。完成后运行 git diff --check 和 Android 编译。
```

### 6.4 任务 D prompt

```text
只做 QA 验证，优先不改源码。检查 Transfer 导入 P0：非法 ANQ/CONFIG 不崩溃，正常导出包可导入，AMBIGUOUS 候选选择可用，apply 阶段无明显半写入。运行 git diff --check 与 ./compile-propoints-android.sh cycle，并列出阻塞/非阻塞问题。
```

---

## 7. 风险与止损

### 7.1 UTS 类型风险

风险：UTS Android 可能对联合类型、数组、对象字面量 cast 敏感。

止损：

- 每轮只改一个明确边界。
- 每轮跑 Android 编译。
- builder 逐字段构造 typed object。
- 不使用 raw JSON 伪装业务类型。

### 7.2 AMBIGUOUS 协议风险

风险：Store 返回结构与页面判断不一致，导致候选显示但按钮不可用。

止损：

- 先由任务 B 明确返回约定。
- 任务 C 严格按约定适配。
- 如果页面适配不稳，可临时只合并任务 A，先解决崩溃。

### 7.3 半写入行为变化

风险：旧行为可能允许 persons 成功、coef 失败；修复后变为整体失败。

止损：

- P0 明确导入同包是整体操作。
- 如果产品要求部分成功，后续单独设计结果展示，不在 P0 混入。

### 7.4 重复姓名误杀

风险：同名不同人可能被 duplicate name 阻断。

止损：

- duplicate id 必须阻断。
- duplicate non-empty name 如业务确认允许，可降级为 warning。

---

## 8. 最终验收标准

1. `git diff --check` 通过。
2. `./compile-propoints-android.sh cycle` 通过。
3. 当前导出的 CONFIG / ANQ 可正常 preview。
4. 非法 ANQ / CONFIG 只返回错误，不崩溃。
5. AMBIGUOUS 能进入候选选择。
6. 选择候选后可导入，未选择不可导入。
7. CONFIG apply 不再出现明显 persons 已写但 coef 预检查失败的半导入。
8. 未新增 Facade / PreviewBuilder / ApplyService / DynamicBoundary。
9. 未新增长期 Legacy 双轨模型。
10. 保存仍只写当前结构。

---

## 9. 一句话执行原则

> P0 只做导入止血：先让非法数据不崩、合法数据可导、候选交互可用、半写入风险下降；任何架构提取和全项目统一都后置。
