# Code Review with Snow CLI - 代码审查

使用 Snow CLI 的无头模式进行代码审查，支持多角度分析和会话管理。

## 审查流程

### Phase 1: 获取变更文件

```bash
# 获取未提交的变更
git diff --name-only

# 获取与主分支的差异
git diff main...HEAD --name-only

# 获取最近一次提交的变更
git diff --name-only HEAD^
```

### Phase 2: 初始审查

使用 Snow CLI 进行初始审查：

```bash
snow --ask "审查这些文件的变更：[文件列表]

请从以下角度分析：
1. 代码质量：是否符合最佳实践
2. 潜在问题：逻辑错误、边界条件
3. 性能影响：是否有性能隐患
4. 安全风险：是否存在安全漏洞

参考项目规范：
- 前端规范：@.trellis/spec/frontend/
- 后端规范：@.trellis/spec/backend/
- 经验教训：@.claude/rules/LESSONS_LEARNED.md"
```

**输出包含**：
- AI 审查意见
- SESSION_ID（用于后续对话）

### Phase 3: 深度分析（使用 SESSION_ID）

基于初始审查的 SESSION_ID，进行针对性深度分析：

```bash
# 安全分析
snow --ask "从安全角度详细分析这些变更，重点关注：
- 输入验证
- SQL 注入风险
- XSS 风险
- 权限控制" <SESSION_ID>

# 性能分析
snow --ask "从性能角度分析这些变更，重点关注：
- 数据库查询优化
- 循环复杂度
- 内存使用
- 并发问题" <SESSION_ID>

# 规范检查
snow --ask "检查代码是否符合项目规范：
- 命名约定
- 文件结构
- 错误处理
- 日志记录" <SESSION_ID>
```

### Phase 4: 生成审查报告

整合所有审查结果，生成结构化报告。

## 审查报告格式

```markdown
## 代码审查报告

### 变更概览
- 变更文件数：[数量]
- 变更类型：[新增/修改/删除]
- 影响范围：[前端/后端/全栈]

### 文件清单
1. `path/to/file1.ts` - [变更类型]
2. `path/to/file2.ts` - [变更类型]

### 审查结果

#### ✓ 通过项
- [符合规范的部分]
- [良好实践]

#### ⚠ 需要注意
- [潜在问题]
- [改进建议]

#### ✗ 必须修复
- [严重问题]
- [安全风险]

### 详细分析

#### 代码质量
[分析内容]

#### 性能影响
[分析内容]

#### 安全风险
[分析内容]

#### 规范符合度
[分析内容]

### 改进建议
1. [建议1]
2. [建议2]

### 会话信息
SESSION_ID: [uuid]
审查时间: [timestamp]
```

## 使用示例

### 场景1: 审查当前未提交的变更

```bash
# 1. 获取变更文件
changed_files=$(git diff --name-only | tr '\n' ' ')

# 2. 执行审查
output=$(snow --ask "审查这些文件的变更：$changed_files

参考规范：
@.claude/rules/core-protocol.md
@.claude/rules/LESSONS_LEARNED.md")

# 3. 提取 SESSION_ID
session_id=$(echo "$output" | grep "SESSION_ID=" | cut -d'=' -f2)

# 4. 深度分析
snow --ask "从安全和性能角度深度分析" $session_id
```

### 场景2: 审查 PR 变更

```bash
# 1. 获取 PR 变更
changed_files=$(git diff main...HEAD --name-only | tr '\n' ' ')

# 2. 分类审查
frontend_files=$(echo "$changed_files" | grep -E "\.vue$|\.uvue$")
backend_files=$(echo "$changed_files" | grep -E "store/|api/")

# 3. 前端审查
if [ -n "$frontend_files" ]; then
  snow --ask "审查前端变更：$frontend_files
  参考：@.trellis/spec/frontend/"
fi

# 4. 后端审查
if [ -n "$backend_files" ]; then
  snow --ask "审查后端变更：$backend_files
  参考：@.trellis/spec/backend/"
fi
```

### 场景3: 针对特定文件的深度审查

```bash
snow --ask "深度审查这个文件 @src/store/app-store.uts

重点检查：
1. 类型安全：是否有类型不匹配
2. 状态管理：是否正确处理状态更新
3. 错误处理：是否有完善的错误处理
4. 性能优化：是否有性能问题

参考经验教训：@.claude/rules/LESSONS_LEARNED.md"
```

## 审查检查清单

### 代码质量
- [ ] 命名清晰，符合约定
- [ ] 逻辑简洁，易于理解
- [ ] 无重复代码
- [ ] 注释适当（复杂逻辑）

### 功能正确性
- [ ] 逻辑正确，无明显 bug
- [ ] 边界条件处理完善
- [ ] 错误处理完整
- [ ] 类型安全（TypeScript/UTS）

### 性能考虑
- [ ] 无不必要的循环嵌套
- [ ] 数据库查询优化
- [ ] 避免内存泄漏
- [ ] 合理使用缓存

### 安全性
- [ ] 输入验证
- [ ] 无 SQL 注入风险
- [ ] 无 XSS 风险
- [ ] 权限控制正确

### 规范符合度
- [ ] 符合项目文件结构
- [ ] 符合命名约定
- [ ] 符合代码风格
- [ ] 符合架构设计

### 可维护性
- [ ] 代码结构清晰
- [ ] 职责单一
- [ ] 易于测试
- [ ] 文档完善（如需要）

## 集成到工作流

### Pre-commit Hook

在 `.git/hooks/pre-commit` 中添加：

```bash
#!/bin/bash

echo "🔍 Running code review with Snow CLI..."

# 获取暂存的文件
staged_files=$(git diff --cached --name-only | tr '\n' ' ')

if [ -z "$staged_files" ]; then
  echo "No files to review"
  exit 0
fi

# 执行快速审查
output=$(snow --ask "快速审查这些即将提交的文件：$staged_files

只指出严重问题（安全风险、逻辑错误、类型不匹配）")

# 检查是否有严重问题
if echo "$output" | grep -q "✗ 必须修复"; then
  echo "❌ Code review found critical issues. Please fix before committing."
  echo "$output"
  exit 1
fi

echo "✅ Code review passed"
exit 0
```

### CI/CD 集成

在 GitHub Actions 中：

```yaml
name: Code Review with Snow CLI

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup Snow CLI
        run: npm install -g snow-ai

      - name: Configure Snow CLI
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
        run: |
          snow config set apiKey $ANTHROPIC_API_KEY

      - name: Review Changes
        run: |
          changed_files=$(git diff origin/main...HEAD --name-only | tr '\n' ' ')

          output=$(snow --ask "审查 PR 变更：$changed_files

          生成 GitHub 格式的审查报告")

          echo "$output" >> $GITHUB_STEP_SUMMARY
```

## 最佳实践

### 1. 分层审查

```bash
# 第一轮：快速扫描
snow --ask "快速扫描这些文件，只指出明显问题：[文件列表]"

# 第二轮：深度分析（使用 SESSION_ID）
snow --ask "对标记的问题进行深度分析" <SESSION_ID>
```

### 2. 上下文引用

```bash
# 引用相关文件提供上下文
snow --ask "审查 @src/new-feature.ts

参考相关文件：
@src/existing-feature.ts
@.claude/rules/LESSONS_LEARNED.md"
```

### 3. 增量审查

```bash
# 只审查变更的部分，不是整个文件
git diff src/file.ts | snow --ask "审查这个 diff，重点关注变更部分"
```

### 4. 会话复用

```bash
# 保存 SESSION_ID 用于后续讨论
session_id=$(snow --ask "初始审查" | grep "SESSION_ID=" | cut -d'=' -f2)

# 后续问题
snow --ask "这个问题如何修复？" $session_id
snow --ask "有更好的实现方式吗？" $session_id
```

## 注意事项

1. **API 配置**：确保 Snow CLI 已正确配置 API 密钥
2. **文件大小**：大文件可能需要分批审查
3. **敏感信息**：审查输出可能包含代码片段，注意保密
4. **成本控制**：频繁审查会消耗 API 额度，建议只审查关键变更
5. **人工复核**：AI 审查是辅助工具，重要变更仍需人工复核

## 故障排除

### 问题1: Snow CLI 未安装

```bash
npm install -g snow-ai
```

### 问题2: API 密钥未配置

```bash
snow config set apiKey YOUR_API_KEY
```

### 问题3: 会话 ID 丢失

```bash
# 查看最近的会话
ls -lt ~/.snow/sessions/$(basename $(pwd))/$(date +%Y-%m-%d)/

# 使用最新的会话 ID
latest_session=$(ls -t ~/.snow/sessions/$(basename $(pwd))/$(date +%Y-%m-%d)/ | head -1)
snow --ask "继续之前的审查" $latest_session
```

## 相关资源

- Snow CLI 文档：https://github.com/MayDay-wpf/snow-cli
- 项目规范：`.trellis/spec/`
- 经验教训：`.claude/rules/LESSONS_LEARNED.md`
- 核心协议：`.claude/rules/core-protocol.md`
