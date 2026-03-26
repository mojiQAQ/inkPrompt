# 提示词详情页面重构实施计划

将现有的 `PromptEditor` 页面重构为以"查看模式"为默认入口的 `PromptDetail` 页面，新增 Markdown 渲染、版本切换与对比、SSE 流式提示词优化面板，以及提示词测试面板（预留）。

## 需求摘要

### UI/UX 需求

1. **默认查看模式**：页面入口为不可编辑的提示词展示框，占满屏幕宽度
2. **内容布局**：横线切分，上半部分展示提示词名称，下半部分展示 Markdown 渲染的提示词内容
3. **编辑入口**：左上角编辑图标，点击进入编辑模式（原地切换，不跳转）
4. **版本控制**：底部版本选择下拉框 + 折叠按钮（展示历史版本、最后更新时间、回滚）+ 对比按钮
5. **版本对比**：点击对比按钮弹出 Dialog，使用 side-by-side 方式展示差异
6. **优化/测试按钮**：点击后宽度变为屏幕 50%，右侧出现对应功能的 Card

### 优化功能核心需求

1. **每次优化生成新版本**：点击"开始优化"按钮即生成一个完整的优化版本（结果 + 3～5 个优化建议）
2. **用户选择可选**：用户可以不选建议直接再次优化，也可以勾选建议后再优化
3. **会话持久化**：整个优化会话（包括每一轮的结果、建议、用户选择）**持久化到后端**，关闭页面后重新打开可以恢复上次会话继续优化
4. **自动保存**：编辑模式下修改内容后自动保存，不需要手动点击保存按钮
5. **版本关联**：优化会话关联到 `Prompt`，每轮优化记录生成的新版本 ID

### 测试功能核心需求

1. **多模型并发测试**：支持同时选择多个模型进行测试，最多数量由配置文件控制
2. **模型选择**：从配置文件的模型列表中选择，可添加多个不重复的模型
3. **System/User Prompt**：左侧提示词作为 system prompt，用户输入作为 user prompt
4. **流式输出**：每个模型的结果在各自的折叠框内流式输出
5. **会话独立**：每个模型有独立的会话记录，可查看历史内容
6. **会话不关闭**：会话一直保持活跃状态，通过 SSE complete 事件标识单次对话完成
7. **继续对话**：继续对话时，用户输入发送给所有模型，在原会话内追加新消息
8. **版本切换限制**：SSE 活跃时禁止切换版本，切换版本后会话自动跟随

---

## 用户确认的关键决策

| 决策项 | 选择 |
|--------|------|
| 保存机制 | 自动保存 |
| 优化结果版本策略 | 直接生成正式版本 |
| 左侧展示框内容 | 优化中显示临时预览，完成后切换到正式版本 |
| 优化历史轮次展示 | 单独展示区域 |
| LLM 模型配置 | 通过配置文件中的 base_url + model 控制 |
| 历史版本折叠面板 | 默认折叠状态 |
| 编辑模式 debounce 时间 | 2-3 秒 |
| 优化会话关联 | 关联到 Prompt，每轮记录生成的新版本 ID |
| 测试会话关联 | 关联到 PromptVersion |
| 多模型测试方式 | 真正并发，同时开启多个 SSE 链接 |
| 配置文件安全 | 只说明参数格式，不包含实际密钥 |
| 会话状态 | 不需要关闭状态，通过 SSE complete 标识完成 |
| 版本切换限制 | SSE 活跃时禁止切换，切换后会话跟随 |
| 继续对话 | 用户输入发送给所有模型，在原会话内追加 |

---

## Proposed Changes

### 后端 - 数据模型

#### [NEW] [optimization_session.py](backend/app/models/optimization_session.py)

新增两个模型支持优化会话持久化，**关联到 Prompt**：

```python
OptimizationSession（优化会话）:
  - id: UUID
  - prompt_id: FK → Prompt  # 关联到 Prompt，而非 PromptVersion
  - user_id: FK → User
  # 注意：不再需要 status 字段，会话一直保持活跃
  - created_at / updated_at

OptimizationRound（优化轮次）:
  - id: UUID
  - session_id: FK → OptimizationSession
  - round_number: int — 第几轮优化
  - user_idea: text | null — 用户本轮输入的优化想法
  - selected_suggestions: JSON | null — 用户上一轮选中的建议选项
  - optimized_content: text — LLM 返回的优化后提示词
  - suggestions: JSON — LLM 返回的优化建议（3～5 个问题+选项）
  - domain_analysis: text — 领域分析摘要
  - version_id: string | null — 本轮优化生成的新版本ID（用于追溯）
  - created_at
```

**版本创建策略**：
- 每次优化完成后，自动调用 `PromptService` 创建新的 `PromptVersion`
- 版本 ID 记录在 `OptimizationRound.version_id`，便于追溯

#### [NEW] [test_session.py](backend/app/models/test_session.py)

新增模型支持测试会话持久化，**关联到 PromptVersion**：

```python
TestSession（测试会话）:
  - id: UUID
  - prompt_version_id: FK → PromptVersion  # 关联到 PromptVersion
  - user_id: FK → User
  # 注意：不再需要 status 字段，会话一直保持活跃
  - created_at / updated_at

TestModelConversation（测试模型对话）:
  - id: UUID
  - test_session_id: FK → TestSession
  - model_name: string — 模型名称（从配置中获取）
  - model_config: JSON — 模型配置（base_url, model, params等）
  - messages: JSON — 对话历史 [{role: "system|user|assistant", content: "..."}]
  - created_at / updated_at
```

**会话机制**：
- 每次测试创建一个 `TestSession`，关联当前选中的 `PromptVersion`
- 每个模型一个 `TestModelConversation`，记录独立的对话历史
- `system` 消息固定为该版本提示词的内容
- 用户输入作为 `user` 消息追加
- 模型输出作为 `assistant` 消息流式追加
- 继续对话时，用户输入发送给所有模型

#### [MODIFY] [prompt_version.py](backend/app/models/prompt_version.py)

为支持优化和测试会话关联，添加反向关系：

```python
class PromptVersion(Base):
    # ... 原有字段 ...

    # Relationships
    prompt = relationship("Prompt", back_populates="versions")
    test_sessions = relationship("TestSession", back_populates="prompt_version")
```

#### [MODIFY] [prompt.py](backend/app/models/prompt.py)

为支持优化会话关联，添加反向关系：

```python
class Prompt(Base):
    # ... 原有字段 ...

    # Relationships
    user = relationship("User", back_populates="prompts")
    versions = relationship("PromptVersion", back_populates="prompt", cascade="all, delete-orphan", order_by="PromptVersion.version_number")
    tags = relationship("Tag", secondary=prompt_tags, back_populates="prompts")
    folders = relationship("PromptFolder", secondary=prompt_folder_items, back_populates="prompts")

    # 新增关系
    optimization_sessions = relationship("OptimizationSession", back_populates="prompt")
```

---

### 后端 - 新增 SSE 优化端点

#### [NEW] [optimization_sse.py](backend/app/api/optimization_sse.py)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/prompts/{prompt_id}/{version_id}/optimize/stream` | POST | SSE 流式优化，针对特定版本的优化 |

**SSE 事件流设计（`/optimize/stream`）：**

```
请求体：{
  user_idea?: string,       // 用户优化想法
  selected_suggestions?: [...] // 上一轮选中的建议
}

SSE 事件序列：
→ event: round_start    data: { round_number: 2 }
→ event: content        data: "优化后的"      ← 流式 chunk
→ event: content        data: "提示词内容..."  ← 流式 chunk
→ event: suggestions    data: { questions: [...] }  ← 优化建议（JSON）
→ event: version_saved  data: { version_id: "xxx", version_number: 4 }
→ event: complete      data: {}                ← 标识本次优化完成
```

每次调用自动：
1. 创建/复用 `OptimizationSession`（基于 prompt_id）
2. 新增一条 `OptimizationRound`
3. 优化完成后自动创建新的 `PromptVersion`
4. 发送 `complete` 事件标识单次优化完成

#### [NEW] [test_sse.py](backend/app/api/test_sse.py)

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/prompts/{version_id}/test/stream` | POST | SSE 流式测试，多模型并发调用 |
| `/api/prompts/{version_id}/test/session` | GET | 获取测试会话（含所有模型对话） |

**多模型并发策略**：
- 后端为每个选中的模型开启独立的 SSE 连接
- 前端为每个模型维护独立的 SSE 连接
- 模型之间完全独立，互不影响

**SSE 事件流设计（`/test/stream` - 单个模型）：**

```
请求体：{
  model: {                  // 当前模型的配置
    name: "gpt-4",
    base_url: "...",
    model: "gpt-4"
  },
  user_prompt: string,       // 用户输入的 user prompt
  continue: boolean         // 是否继续对话（追加到现有会话）
}

SSE 事件序列：
→ event: conversation_id data: { conversation_id: "xxx" }  // 对话ID
→ event: content        data: "GPT"        ← 流式 chunk
→ event: content        data: "-4 输出..."  ← 流式 chunk
→ event: complete       data: {}          ← 标识本次对话完成
```

**多模型调用示例**：
```
前端为每个模型发起独立的 SSE 请求：
/api/prompts/{prompt_id}/{version_id}/test/stream?model=gpt-4
/api/prompts/{prompt_id}/{version_id}/test/stream?model=claude-3
/api/prompts/{prompt_id}/{version_id}/test/stream?model=gemini-pro
```

#### [MODIFY] [optimization_service.py](backend/app/services/optimization_service.py)
- 新增 `optimize_prompt_stream()` — 流式 LLM 调用 + 自动保存轮次 + 自动创建版本
- 新增 `get_or_create_session()` — 获取/创建活跃会话（基于 prompt_id）
- 新增 `get_session_with_rounds()` — 加载会话 + 所有轮次
- 新增领域分析系统提示词（详见下方"系统提示词设计"节）

#### [NEW] [test_service.py](backend/app/services/test_service.py)
- 新增 `start_test_session()` — 创建测试会话（基于 version_id）
- 新增 `get_test_session()` — 获取测试会话 + 所有对话
- 新增 `test_model_stream()` — 单模型流式测试（为每个模型独立调用）

#### [MODIFY] [main.py](backend/app/main.py)
- 注册 `optimization_sse` 路由
- 注册 `test_sse` 路由

---

### 后端 - 配置文件扩展

#### [MODIFY] [config.py](backend/app/core/config.py)

```python
# 优化配置
MAX_CONCURRENT_TEST_MODELS: int = 5  # 最多同时测试的模型数量

# 模型配置（从配置文件读取）
AVAILABLE_MODELS: List[Dict[str, str]] = [
    {
        "name": "GPT-4",
        "base_url": "https://api.openai.com/v1",
        "model": "gpt-4",
        "api_key": "{{OPENAI_API_KEY}}"  # 环境变量占位符
    },
    {
        "name": "Claude 3 Opus",
        "base_url": "https://api.anthropic.com",
        "model": "claude-3-opus-20240229",
        "api_key": "{{ANTHROPIC_API_KEY}}"
    },
    # ... 更多模型配置
]
```

**配置文件示例**（不包含实际密钥）：
```yaml
# config.example.yaml
models:
  - name: "GPT-4"
    base_url: "https://api.openai.com/v1"
    model: "gpt-4"
    api_key: "{{OPENAI_API_KEY}}"

  - name: "Claude 3 Opus"
    base_url: "https://api.anthropic.com"
    model: "claude-3-opus-20240229"
    api_key: "{{ANTHROPIC_API_KEY}}"

optimization:
  max_concurrent_test_models: 5
```

---

### 后端 - 系统提示词设计

**单次优化调用的系统提示词**（融合领域分析 + 优化 + 建议于一次 LLM 调用）：

```text
你是一位顶级提示词工程专家。请完成以下任务：

## 任务1：分析并优化提示词
分析提示词所属领域（如软件开发需考虑前后端/架构/DevOps，短视频需考虑爆款/脚本/勾子等），
结合用户想法和选择的方向，输出优化后的完整提示词。

## 任务2：生成下一轮优化建议
给出 3～5 个进一步优化方向的问题，每个问题 3～5 个选项。

---输出格式---
先输出优化后的提示词（纯文本），然后输出分隔符 `---SUGGESTIONS---`，
最后输出 JSON 格式的建议：{ "domain": "...", "questions": [...] }
```

> 使用分隔符将内容和建议分开，便于 SSE 流式处理时在后端解析并分别发送两种事件类型。

---

### 前端 - 新增依赖

#### [MODIFY] [package.json](frontend/package.json)
- `react-markdown`, `remark-gfm`, `diff`, `@types/diff`

---

### 前端 - 类型定义

#### [MODIFY] [prompt.ts](frontend/src/types/prompt.ts)

```typescript
export interface OptimizationSession {
  id: string
  prompt_id: string  // 关联到 Prompt
  user_id: string
  created_at: string
  updated_at: string
  rounds: OptimizationRound[]
}

export interface OptimizationRound {
  id: string
  session_id: string
  round_number: number
  user_idea: string | null
  selected_suggestions: Record<string, string[]> | null  // { question: [选项...] }
  optimized_content: string
  suggestions: OptimizeSuggestion[]
  domain_analysis: string
  created_at: string
  version_id?: string  // 本轮生成的新版本ID
}

export interface OptimizeSuggestion {
  question: string
  options: string[]
}

export interface OptimizationHistoryItem {
  round: OptimizationRound
  expanded: boolean
}

// 测试会话类型
export interface TestSession {
  id: string
  prompt_version_id: string  // 关联到 PromptVersion
  user_id: string
  created_at: string
  updated_at: string
  conversations: TestModelConversation[]
}

export interface TestModelConversation {
  id: string
  test_session_id: string
  model_name: string
  model_config: {
    base_url: string
    model: string
    [key: string]: any
  }
  messages: ChatMessage[]
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface ModelConfig {
  name: string
  base_url: string
  model: string
  [key: string]: any
}

// SSE 事件类型
export type OptimizeSSEEvent =
  | { type: 'round_start'; data: { round_number: number } }
  | { type: 'content'; data: string }
  | { type: 'suggestions'; data: { questions: OptimizeSuggestion[] } }
  | { type: 'version_saved'; data: { version_id: string; version_number: number } }
  | { type: 'complete'; data: {} }

export type TestSSEEvent =
  | { type: 'conversation_id'; data: { conversation_id: string } }
  | { type: 'content'; data: string }
  | { type: 'complete'; data: {} }
```

---

### 前端 - API 层

#### [MODIFY] [optimization.ts](frontend/src/api/optimization.ts)
- `startOptimizeStream(promptId, versionId, callback)` — SSE 连接 `/optimize/stream`
- `getOptimizationSession(promptId)` — GET 加载已有会话

#### [NEW] [optimization_sse.ts](frontend/src/api/optimization_sse.ts)
- SSE 连接封装
- 事件类型处理（round_start, content, suggestions, version_saved, complete）

#### [NEW] [test.ts](frontend/src/api/test.ts)
- `startTestStream(versionId, model, callback)` — SSE 连接 `/test/stream`
- `getTestSession(versionId)` — GET 加载测试会话

#### [NEW] [test_sse.ts](frontend/src/api/test_sse.ts)
- SSE 连接封装
- 事件类型处理（conversation_id, content, complete）
- 支持多个并发 SSE 连接（每个模型一个）

#### [NEW] [models.ts](frontend/src/api/models.ts)
- `getAvailableModels()` — 获取配置文件中的可用模型列表

---

### 前端 - 核心页面和组件

#### [NEW] [PromptDetail.tsx](frontend/src/pages/PromptDetail.tsx)

页面布局结构：

**默认模式（无右侧面板）：**
```
┌─────────────────────────────────────────────────┐
│        提示词展示 Card（占满全屏宽度）             │
│                                                 │
│ [编辑✏️] [提示词优化⚡] [提示词测试🧪]  ← 左上工具栏│
│                                                 │
│   提示词名称                                     │
│   ──────────────────────────────────────         │
│   提示词内容 (Markdown 渲染)                      │
│                                                 │
│ [v3 ▼ 版本选择] [▶ 展开历史] [📊 对比]  ← 底部栏  │
└─────────────────────────────────────────────────┘
```

**点击"提示词优化"后：**
```
┌───────────────────────┐ ┌───────────────────────┐
│  提示词展示 Card (50%) │ │  优化 Card (50%)      │
│                       │ │                    [×] │
│ [✏️] [⚡] [🧪]         │ │  提示词优化             │
│                       │ │  ────────────────────  │
│  提示词名称            │ │  [优化想法输入框]        │
│  ─────────────────    │ │  [历史轮次区域]          │
│  提示词内容            │ │  [上一轮建议选项]        │
│  (Markdown 渲染)       │ │  [开始优化]             │
│                       │ │                       │
│ [v3 ▼] [▶] [📊]       │ │                       │
└───────────────────────┘ └───────────────────────┘
```

**点击"提示词测试"后：**
```
┌───────────────────────┐ ┌───────────────────────┐
│  提示词展示 Card (50%) │ │  测试 Card (50%)       │
│                       │ │                    [×] │
│ [✏️] [⚡] [🧪]         │ │  提示词测试             │
│                       │ │  ────────────────────  │
│  提示词名称            │ │  [模型选择器] [+]       │
│  ─────────────────    │ │  [已选模型列表]          │
│  提示词内容            │ │  [User Prompt 输入框]   │
│  (Markdown 渲染)       │ │  [测试/继续对话按钮]     │
│                       │ │  ────────────────────  │
│ [v3 ▼] [▶] [📊]       │ │  [模型1输出折叠框]       │
│                       │ │  [模型2输出折叠框]       │
│                       │ │  [模型3输出折叠框]       │
└───────────────────────┘ └───────────────────────┘
```

- 两个 Card 是**完全独立**的容器，各自有边框/圆角/阴影
- 默认只显示左侧 Card（全屏宽度），点击优化/测试按钮后左侧缩至 50%，右侧 Card 出现（动画过渡）
- 编辑模式：在左侧 Card 内原地切换为可编辑的 textarea，不跳转路由
- 页面加载时：检查是否有活跃优化/测试会话 → 加载上次状态
- **自动保存**：编辑模式下内容变化时自动触发保存
- **版本切换限制**：SSE 活跃时禁止切换版本

#### [NEW] [OptimizePanel.tsx](frontend/src/components/OptimizePanel.tsx)

- 标题"提示词优化"+ 右上角"×"关闭
- **历史轮次回放**：单独展示区域，加载时显示上次会话的所有优化轮次
  - 每轮显示：轮次号、用户想法、优化结果摘要、建议选项
  - 支持展开/折叠查看详情
- **当前输入区域**：
  - 优化想法输入框
  - 上一轮的建议选项（checkbox 可勾选）
  - "开始优化"按钮
- **流式输出**：优化中时，左侧提示词内容显示"临时预览内容"，优化完成后切换到"正式版本内容"
- 优化完成后：
  - 新轮次追加到历史列表
  - 新版本自动创建并显示在版本选择器中

#### [NEW] [TestPanel.tsx](frontend/src/components/TestPanel.tsx)

- 标题"提示词测试"+ 右上角"×"关闭
- **模型选择器**：
  - 下拉框选择可用模型（从配置文件获取）
  - "+" 添加按钮，可添加多个不重复的模型
  - 最多选择数量由后端配置控制
  - 已选模型以标签形式展示，可点击删除
- **User Prompt 输入框**：
  - 多行文本输入
  - 提示：左侧提示词将作为 System Prompt
- **测试/继续对话按钮**：
  - 首次点击：开始多模型并发测试
  - 再次点击：继续对话（用户输入发送给所有模型）
  - SSE 活跃时按钮禁用
- **模型输出区域**：
  - 每个模型一个独立的 SSE 连接
  - 每个模型一个折叠框
  - 折叠框标题显示模型名称 + 状态（进行中/已完成）
  - 展开后显示流式输出内容
  - 每个模型的对话历史独立保存

#### [NEW] [VersionDiffDialog.tsx](frontend/src/components/VersionDiffDialog.tsx)

- side-by-side 差异对比 Dialog
- 两个版本选择下拉框 + `diff` 库差异计算 + 红绿高亮

#### [NEW] [VersionHistoryDrawer.tsx](frontend/src/components/VersionHistoryDrawer.tsx)

- 从底部展开的抽屉组件，展示所有历史版本
- 每个版本显示：版本号、创建时间、change_note、回滚按钮
- 与优化/测试历史分开展示
- 默认折叠状态

#### [NEW] [ModelSelector.tsx](frontend/src/components/ModelSelector.tsx)

- 模型选择组件
- 下拉框选择可用模型
- "+" 添加按钮
- 已选模型标签展示和删除
- 遵重最大数量限制

#### [NEW] [ModelOutputBox.tsx](frontend/src/components/ModelOutputBox.tsx)

- 单个模型输出折叠框
- 标题：模型名称 + 状态指示器
- 展开后显示对话历史
- 支持独立的 SSE 流式接收
- 每个模型有独立的 SSE 连接实例

---

### 前端 - 路由更新

#### [MODIFY] [App.tsx](frontend/src/App.tsx)
- `/prompts/:id` → `PromptDetail`（查看模式入口）
- `/prompts/:id/edit` → `PromptDetail`（URL 中带 edit，自动进入编辑模式）
- `/prompts/new` → 继续使用 `PromptEditor`

---

## 数据流图

### 优化流程数据流

```
用户操作
  │
  ├─ 1. 打开页面 + 选择特定版本
  │    └─ 检查该 Prompt 是否有活跃会话
  │        ├─ 有: 加载 OptimizationSession + 所有轮次
  │        └─ 无: 初始化为空会话状态
  │
  ├─ 2. 点击"开始优化"
  │    ├─ 发送 SSE 请求 /optimize/stream/{prompt_id}/{version_id}
  │    │   ├─ round_start → 开始第 N 轮
  │    │   ├─ content (stream) → 左侧显示"临时预览内容"
  │    │   ├─ suggestions → 显示 3-5 个优化建议
  │    │   ├─ version_saved → 新版本已创建，更新版本列表
  │    │   ├─ complete → 标识本次优化完成
  │    │   └─ 左侧切换为"正式版本内容"
  │    │
  │    └─ 用户可以：
  │        ├─ 不选建议 → 直接再次优化
  │        ├─ 勾选建议 → 作为下一轮参数
  │        └─ 关闭页面 → 会话持久化保存
  │
  ├─ 3. 优化中切换版本
  │    └─ SSE 活跃时禁止切换版本
  │
  └─ 4. 切换版本后（SSE 已结束）
       └─ 在原会话中过滤显示特定版本的优化历史
```

### 测试流程数据流

```
用户操作
  │
  ├─ 1. 点击"提示词测试"按钮
  │    └─ 右侧面板展开，加载可用模型列表
  │
  ├─ 2. 选择模型 + 输入 User Prompt
  │
  ├─ 3. 点击"测试"按钮
  │    ├─ 为每个模型发起独立的 SSE 请求（基于当前版本）
  │    │   ├─ 模型1: /test/stream/{version_id}?model=gpt-4
  │    │   │   ├─ conversation_id → 获取对话ID
  │    │   │   ├─ content (stream) → 流式输出
  │    │   │   └─ complete → 标识本次对话完成
  │    │   │
  │    │   ├─ 模型2: /test/stream/{version_id}?model=claude-3
  │    │   │   └─ ... (与模型1并行)
  │    │   │
  │    │   └─ 模型3: /test/stream/{version_id}?model=gemini-pro
  │    │       └─ ... (与模型1、2并行)
  │    │
  │    └─ 所有模型独立保存对话历史到当前版本的测试会话
  │
  ├─ 4. 继续对话
  │    ├─ 用户输入新的 User Prompt
  │    ├─ 点击"继续对话"按钮
  │    └─ 用户输入发送给所有模型
  │        └─ 每个模型的对话历史追加新消息
  │
  └─ 5. 切换版本
       ├─ SSE 活跃时禁止切换版本
       └─ 切换后会话自动切换到新版本的测试会话
```

### 编辑模式数据流

```
用户进入编辑模式
  │
  ├─ 左侧 Card 切换为可编辑 textarea
  │
  ├─ 用户修改内容 → 自动触发保存（debounce 2-3秒）
  │   ├─ 调用 updatePrompt API
  │   ├─ 后端自动创建新的 PromptVersion
  │   └─ 前端更新版本列表
  │
  └─ 退出编辑模式 → 切换回 Markdown 渲染视图
```

---

## Verification Plan

### 手动验证（浏览器）
1. 查看模式 → Markdown 渲染 → 版本切换 → 折叠历史 → 版本对比
2. 编辑模式 → 修改内容 → 自动保存 → 自动生成新版本 → 回到查看模式
3. 优化面板 → 输入想法 → 开始优化 → 左侧显示临时预览 → SSE 完成 → 切换到正式版本
4. 优化历史 → 看到建议 → 勾选建议 → 再次优化
5. 关闭页面 → 重新打开 → 优化会话历史恢复 → 继续优化
6. 优化中尝试切换版本 → 应该禁止切换
7. 测试面板 → 选择多个模型 → 输入 User Prompt → 点击测试 → 多模型并发流式输出
8. 测试会话继续对话 → 用户输入发送给所有模型 → 所有模型对话历史追加
9. 测试中尝试切换版本 → 应该禁止切换
10. 测试完成后切换版本 → 在原会话中切换到新版本的优化历史

### 自动化测试
```bash
# 前端
cd /Users/moji/ground/inkPrompt/frontend && npm run test:run
# 后端
cd /Users/moji/ground/inkPrompt/backend && python -m pytest tests/ -v
```

---

## 实施优先级

### Phase 1: 基础重构（高优先级）
1. 创建 `PromptDetail` 页面基础框架
2. 实现查看模式（Markdown 渲染）
3. 实现编辑模式（原地切换，自动保存）
4. 实现版本历史折叠面板（默认折叠）

### Phase 2: 版本管理（高优先级）
1. 实现版本选择下拉框
2. 实现版本对比 Dialog
3. 实现回滚功能

### Phase 3: 优化功能（核心优先级）
1. 后端新增优化会话数据模型（关联 Prompt）
2. 后端新增 SSE 优化端点
3. 前端实现 OptimizePanel 组件
4. 前端实现历史轮次回放
5. 前端实现 SSE 流式接收
6. 实现临时预览内容显示

### Phase 4: 测试功能（核心优先级）
1. 后端新增测试会话数据模型（关联 PromptVersion）
2. 后端新增单模型 SSE 测试端点
3. 后端配置文件扩展（模型列表、最大并发数）
4. 前端实现 TestPanel 组件
5. 前端实现 ModelSelector 组件
6. 前端实现 ModelOutputBox 组件（支持多并发 SSE）
7. 前端实现继续对话功能（发送给所有模型）
8. 实现版本切换限制（SSE 活跃时禁止）

---

## 已确认配置

| 配置项 | 设置 |
|--------|------|
| LLM 模型 | 通过配置文件中的 base_url + model 控制 |
| 历史版本折叠面板 | 默认折叠状态 |
| 编辑模式 debounce 时间 | 2-3 秒 |
| 优化会话关联 | 关联到 Prompt，每轮记录生成的新版本 ID |
| 测试会话关联 | 关联到 PromptVersion |
| 多模型测试方式 | 真正并发，每个模型独立的 SSE 连接 |
| 配置文件安全 | 只说明参数格式，不包含实际密钥 |
| 会话状态 | 不需要关闭状态，通过 SSE complete 标识完成 |
| 版本切换限制 | SSE 活跃时禁止切换，切换后会话跟随 |
| 继续对话 | 用户输入发送给所有模型，在原会话内追加 |
| 优化中左侧显示 | 临时预览内容，完成后切换到正式版本 |

---

## 附录：领域分析示例

| 领域 | 分析维度 | 示例问题 |
|------|---------|---------|
| 软件开发 | 前后端、架构、选型、UI 设计、部署运维 | 是否需要包含代码示例？是否关注性能优化？ |
| 短视频创作 | 爆款分析、脚本拆解、勾子设计 | 目标受众是谁？视频时长限制？ |
| 内容写作 | 结构、风格、SEO、受众 | 写作风格偏好？是否需要关键词优化？ |
| 数据分析 | 数据源、分析方法、可视化 | 数据格式？输出格式？ |
| 客服话术 | 场景、语气、问题类型 | 目标客户群体？常见问题类型？ |

---

## 附录：配置文件示例

```yaml
# config.example.yaml
# 复制此文件为 config.yaml 并填入实际配置

models:
  - name: "GPT-4"
    base_url: "https://api.openai.com/v1"
    model: "gpt-4"
    api_key: "{{OPENAI_API_KEY}}"

  - name: "Claude 3 Opus"
    base_url: "https://api.anthropic.com"
    model: "claude-3-opus-20240229"
    api_key: "{{ANTHROPIC_API_KEY}}"

  - name: "Gemini Pro"
    base_url: "https://generativelanguage.googleapis.com/v1beta"
    model: "gemini-pro"
    api_key: "{{GEMINI_API_KEY}}"

optimization:
  max_concurrent_test_models: 5
```

**说明**：
- 将 `{{...}}` 替换为实际的环境变量值或 API 密钥
- 不要将包含实际密钥的 config.yaml 提交到代码仓库
- 使用环境变量或密钥管理服务更安全
