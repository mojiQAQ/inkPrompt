# 提示词广场功能设计

## 文档定位

本文档用于定义 Ink & Prompt「提示词广场」的产品目标、页面结构、交互规则、数据模型与实施方案。目标不是只产出一个好看的页面，而是沉淀一套可以直接拆解为前后端任务的可执行设计。

---

## 一、背景与目标

### 1.1 背景

当前产品已经具备个人提示词库、标签、文件夹、优化、测试、版本管理等核心能力，但缺少一个“从社区发现优质提示词，再回到个人工作流继续创作”的入口。

提示词广场的价值不只是展示别人写的 prompt，而是让用户完成下面这条闭环：

1. 在广场发现优质案例
2. 理解它为什么好用
3. 一键复制到自己的工作区
4. 在现有 PromptDetail / TestPanel 中继续测试、优化、迭代

### 1.2 目标用户

- 新用户：不知道从哪里开始写提示词，需要参考样本
- 成长型用户：希望学习不同写法、结构和场景拆解
- 高活跃用户：愿意公开自己的优质提示词，获得使用量与反馈

### 1.3 核心目标

- 提升新用户首周留存和首次成功使用率
- 为已有用户提供稳定的“发现 -> 复制 -> 二次创作”路径
- 为后续“公开发布”“优质创作者体系”“精选推荐”打基础

### 1.4 成功指标

MVP 阶段重点关注以下指标：

- 广场访问 UV / DAU
- 广场卡片点击率（CTR）
- 详情页到复制的转化率
- 复制后进入测试面板的比例
- 首次访问广场的新用户 7 日留存

### 1.5 本期范围

本期包含：

- 广场首页
- 广场详情页
- 热门标签与基础筛选
- 公开发布与下架
- 点赞、收藏、复制到我的库
- 登录与未登录分支
- 基础排序、埋点、审核状态与异常态

本期不包含：

- 评论系统
- 创作者关注系统
- AI 个性化推荐
- 复杂榜单体系
- 多模型自动跑分与公开排行榜

---

## 二、与现有仓库对齐

### 2.1 现有技术栈

当前仓库的真实实现不是通用伪代码环境，而是：

- 前端：React 18 + TypeScript + Vite + React Router
- 后端：FastAPI + SQLAlchemy
- 鉴权：Supabase JWT
- 国际化：`frontend/src/i18n/locales/zh-CN.json` 与 `frontend/src/i18n/locales/en-US.json`

因此本设计需要遵守当前项目约束：

- 不引入新的前端数据层库作为 MVP 前提
- 前端接口风格沿用 `frontend/src/api/*.ts`
- 后端接口沿用 `/api/*` 前缀
- 复用现有 `Prompt`、`PromptVersion`、`Tag`、`PromptFolder` 模型与页面能力

### 2.2 现有可复用能力

- [frontend/src/components/Navbar.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/Navbar.tsx)：导航栏，可新增“广场”入口
- [frontend/src/components/PromptCard.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/PromptCard.tsx)：可参考现有卡片交互与视觉语言
- [frontend/src/components/TagFilter.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/TagFilter.tsx)：可复用标签筛选交互
- [frontend/src/components/AddToFolderDialog.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/AddToFolderDialog.tsx)：可复用“复制到我的库时选择文件夹”能力
- [frontend/src/components/Loading.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/Loading.tsx)：可复用骨架与加载态
- [frontend/src/components/EmptyState.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/EmptyState.tsx)：可复用空状态
- [frontend/src/pages/PromptEditor.tsx](/Users/moji/ground/inkPrompt/frontend/src/pages/PromptEditor.tsx)：复制后进入测试与优化的承接页

### 2.3 关键对齐结论

- 广场必须是公开可访问页面，不能像 `/prompts` 一样挂在 `ProtectedRoute` 下
- 广场列表与详情接口应支持匿名访问；只有点赞、收藏、复制、发布需要登录
- 当前项目普遍使用 `page + page_size` 分页，MVP 应保持一致；cursor-based 分页可作为后续优化
- 广场不是替代个人提示词库，而是个人库的发现入口和内容来源

---

## 三、产品定位与信息架构

### 3.1 页面结构

```
广场首页 /square
├── 顶部导航
├── Hero 区域（标题、说明、搜索入口）
├── 热门标签区
├── 筛选与排序栏
├── 提示词卡片列表
├── 分页 / 加载更多
└── 空状态 / 错误态

广场详情页 /square/:entryId
├── 返回与面包屑
├── 标题区（名称、标签、作者、统计）
├── 提示词摘要与结构预览
├── 推荐模型与适用场景
├── 操作区（点赞、收藏、复制、测试）
├── 作者信息
└── 相关推荐
```

### 3.2 导航

| 导航项 | 跳转目标 | 说明 |
|--------|----------|------|
| Logo | `/` 或 `/prompts` | 未登录去首页，已登录可继续保留当前逻辑 |
| 我的提示词 | `/prompts` | 已登录展示 |
| 广场 | `/square` | 始终展示 |
| 新建提示词 | `/prompts/new` | 未登录时引导登录 |
| 语言切换 | 当前页切换语言 | 沿用现有组件 |
| 用户头像 | 用户菜单 | 已登录显示 |

### 3.3 推荐新增路由

前端路由建议新增：

- `/square`：广场首页，公开访问
- `/square/:entryId`：广场详情页，公开访问

后端路由建议新增：

- `/api/square/entries`
- `/api/square/entries/{entry_id}`
- `/api/square/tags/popular`
- `/api/square/categories`
- `/api/square/entries/{entry_id}/like`
- `/api/square/entries/{entry_id}/favorite`
- `/api/square/entries/{entry_id}/copy`
- `/api/square/prompts/{prompt_id}/publish`
- `/api/square/entries/{entry_id}/unpublish`

---

## 四、核心用户旅程

### 4.1 发现与复用

```
进入广场
  ↓
浏览热门标签 / 搜索 / 筛选
  ↓
打开某个提示词详情
  ↓
查看摘要、适用场景、推荐模型
  ↓
选择“复制到我的库”或“立即测试”
  ↓
创建个人副本
  ↓
跳转到 PromptDetail / TestPanel 继续使用
```

### 4.2 发布到广场

```
用户在个人提示词详情页点击“发布到广场”
  ↓
填写标题、摘要、分类、标签、推荐模型、难度
  ↓
预览公开展示效果
  ↓
确认发布
  ↓
生成广场条目
  ↓
进入广场可被浏览、点赞、收藏、复制
```

### 4.3 登录状态差异

未登录用户：

- 可以浏览首页和详情页
- 可以搜索、筛选、查看标签与统计
- 点击点赞、收藏、复制、立即测试时弹登录引导

已登录用户：

- 可以点赞、取消点赞
- 可以收藏广场条目
- 可以复制到个人库并选择文件夹
- 可以从自己的提示词发布到广场或下架

---

## 五、页面设计

### 5.1 广场首页

#### 页面布局

```
┌──────────────────────────────────────────────────────────────┐
│ Navbar                                                      │
├──────────────────────────────────────────────────────────────┤
│ 标题：发现社区正在使用的优质提示词                            │
│ 副标题：找到灵感，复制到你的工作区继续优化                    │
│ [搜索框...............................] [搜索]               │
├──────────────────────────────────────────────────────────────┤
│ 热门标签：#产品文案 #代码审查 #总结提炼 #翻译 #SQL            │
├──────────────────────────────────────────────────────────────┤
│ 分类 | 难度 | 推荐模型 | 排序 | 仅看精选 | [重置]             │
├──────────────────────────────────────────────────────────────┤
│ 卡片列表（2-4 列，自适应）                                   │
│ ┌────────────┐ ┌────────────┐ ┌────────────┐                │
│ │ 标题       │ │ 标题       │ │ 标题       │                │
│ │ 摘要       │ │ 摘要       │ │ 摘要       │                │
│ │ 标签       │ │ 标签       │ │ 标签       │                │
│ │ 作者/统计  │ │ 作者/统计  │ │ 作者/统计  │                │
│ └────────────┘ └────────────┘ └────────────┘                │
├──────────────────────────────────────────────────────────────┤
│ 分页 / 加载更多                                               │
└──────────────────────────────────────────────────────────────┘
```

#### 卡片内容

每张卡片建议包含：

- 标题
- 1~2 行摘要
- 主标签与次标签
- 作者昵称 / 头像
- 推荐模型
- 统计信息：点赞、复制、最近更新时间
- CTA：查看详情 / 复制

#### 卡片交互

- 点击卡片主体：进入详情页
- 点击作者：进入作者公开页（本期可先不落地，仅保留保守样式）
- 点击标签：带入标签筛选
- 点击复制：已登录直接打开复制弹窗；未登录弹登录引导
- 点击点赞：仅登录用户可操作

### 5.2 广场详情页

详情页需比卡片多解决两个问题：

1. 用户要快速判断“这个提示词适不适合我”
2. 用户要清楚“复制后会发生什么”

#### 详情页模块

- 标题区：标题、摘要、作者、发布时间、标签
- 适用说明：适用场景、输入前提、输出风格、适用模型
- 提示词预览：默认展示脱敏或折叠后的内容摘要，避免首页直接泄露全部长文本
- 效果说明：示例输出片段、适合搭配的测试方式
- 操作区：点赞、收藏、复制到我的库、立即测试
- 作者信息：头像、名称、公开条目数
- 相关推荐：同标签或同分类条目

#### “立即测试”定义

“立即测试”不是在广场页直接跑模型，而是：

1. 为当前用户创建一个个人提示词副本
2. 可选加入某个文件夹
3. 跳转到 `/prompts/{new_prompt_id}` 并默认展开测试面板

这样可以完全复用现有 PromptDetail / TestPanel 能力，避免在广场重复建设测试逻辑。

### 5.3 发布对话框

当前文档原稿缺少“广场内容从哪来”的设计，这是必须补齐的能力。

发布到广场时建议弹出一个 `PublishToSquareDialog`，字段如下：

| 字段 | 必填 | 说明 |
|------|------|------|
| 标题 | 是 | 默认使用 prompt 名称，可编辑 |
| 摘要 | 是 | 80-200 字，用于卡片与详情说明 |
| 主分类 | 是 | 如写作、编程、分析、办公 |
| 使用场景 | 否 | 更细粒度，如代码审查、会议纪要 |
| 标签 | 是 | 1-8 个 |
| 推荐模型 | 否 | 多选 |
| 难度 | 是 | 简单 / 中等 / 进阶 |
| 是否允许公开预览完整正文 | 否 | 默认否 |

---

## 六、关键状态与边界规则

### 6.1 页面状态

首页与详情页都需要完整覆盖以下状态：

- 首次加载中：骨架屏
- 加载失败：错误提示 + 重试
- 无搜索结果：空状态 + 推荐清空筛选
- 条目已下架：详情页给出“内容暂不可见”
- 权限不足：用户尝试编辑他人条目时提示无权限

### 6.2 点赞、收藏、复制的语义区分

- 点赞：对公开条目表示认可，不进入个人库
- 收藏：轻量书签，方便以后回看，不生成个人副本
- 复制到我的库：创建一份属于当前用户的新 `Prompt`

### 6.3 复制规则

复制时系统需要做三件事：

1. 生成新的 `Prompt`
2. 复制当前公开版本内容、名称、标签
3. 记录来源 `source_square_entry_id`，便于后续统计“这条内容被复制了多少次”

### 6.4 发布规则

- 仅作者本人可以发布自己的 `Prompt`
- 仅最新内容或用户指定版本可发布
- 同一个 `Prompt` 同一时刻最多保留一个活跃广场条目
- 下架后原始 `Prompt` 不受影响

---

## 七、排序与发现策略

### 7.1 排序选项

| 排序 | 说明 |
|------|------|
| 最热 | 综合近 7 天点赞、复制、测试、浏览加权计算 |
| 最新 | `published_at desc` |
| 最多复制 | 按累计复制数排序 |

### 7.2 热度分建议

MVP 可使用简单热度分：

```text
ranking_score =
  0.4 * copies_7d +
  0.3 * likes_7d +
  0.2 * tests_7d +
  0.1 * views_7d -
  decay(published_days)
```

说明：

- 热度排序优先体现“真正被拿去用”的内容，因此复制权重高于浏览
- 新发布内容通过时间衰减避免长期旧内容霸榜
- 后续如果数据规模增长，再拆成离线计算任务

### 7.3 热门标签来源

热门标签只从 `status = published` 且 `moderation_status = approved` 的广场条目中聚合，不从私有 prompt 或已下架条目统计。

---

## 八、数据模型设计

### 8.1 总体原则

- 尽量复用现有 `Prompt`、`PromptVersion`、`Tag`、`User`
- 广场条目不直接替代 `Prompt`，而是“公开展示层”
- 复制行为必须保留来源追踪
- 点赞、收藏、复制日志拆表，避免把行为数据塞回主表

### 8.2 建议新增模型

#### PromptSquareEntry

```python
class PromptSquareEntry(Base):
    """提示词广场公开条目"""

    __tablename__ = "prompt_square_entries"

    id = Column(String(36), primary_key=True, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    prompt_version_id = Column(String(36), ForeignKey("prompt_versions.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)

    title = Column(String(255), nullable=False)
    summary = Column(String(500), nullable=False)
    category = Column(String(50), nullable=False, index=True)
    scenario = Column(String(50), nullable=True, index=True)
    difficulty = Column(String(20), default="simple", nullable=False, index=True)
    recommended_models = Column(Text, nullable=True)  # JSON 数组字符串

    status = Column(String(20), default="draft", nullable=False, index=True)  # draft/published/hidden/archived
    moderation_status = Column(String(20), default="approved", nullable=False, index=True)  # pending/approved/rejected
    allow_full_preview = Column(Boolean, default=False, nullable=False)

    views = Column(Integer, default=0, nullable=False)
    likes = Column(Integer, default=0, nullable=False)
    favorites = Column(Integer, default=0, nullable=False)
    copies = Column(Integer, default=0, nullable=False)
    tests = Column(Integer, default=0, nullable=False)
    ranking_score = Column(Integer, default=0, nullable=False)

    published_at = Column(DateTime(timezone=True), nullable=True, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)
```

#### PromptSquareLike

```python
class PromptSquareLike(Base):
    __tablename__ = "prompt_square_likes"

    id = Column(String(36), primary_key=True, index=True)
    entry_id = Column(String(36), ForeignKey("prompt_square_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("entry_id", "user_id", name="uix_square_like_entry_user"),
    )
```

#### PromptSquareFavorite

```python
class PromptSquareFavorite(Base):
    __tablename__ = "prompt_square_favorites"

    id = Column(String(36), primary_key=True, index=True)
    entry_id = Column(String(36), ForeignKey("prompt_square_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    __table_args__ = (
        UniqueConstraint("entry_id", "user_id", name="uix_square_favorite_entry_user"),
    )
```

#### PromptSquareCopyLog

```python
class PromptSquareCopyLog(Base):
    __tablename__ = "prompt_square_copy_logs"

    id = Column(String(36), primary_key=True, index=True)
    entry_id = Column(String(36), ForeignKey("prompt_square_entries.id", ondelete="CASCADE"), nullable=False, index=True)
    source_prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
    target_prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="SET NULL"), nullable=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
```

### 8.3 对现有模型的扩展建议

在 [backend/app/models/prompt.py](/Users/moji/ground/inkPrompt/backend/app/models/prompt.py) 中建议新增：

```python
square_entry = relationship(
    "PromptSquareEntry",
    back_populates="prompt",
    uselist=False,
    cascade="all, delete-orphan",
)

source_square_entry_id = Column(
    String(36),
    ForeignKey("prompt_square_entries.id", ondelete="SET NULL"),
    nullable=True,
    index=True,
)
```

说明：

- `square_entry`：标记该 prompt 是否被公开发布
- `source_square_entry_id`：标记某个个人 prompt 是否从广场复制而来

### 8.4 索引建议

- `prompt_square_entries(status, moderation_status, published_at)`
- `prompt_square_entries(category, difficulty)`
- `prompt_square_entries(ranking_score, published_at)`
- `prompt_square_likes(entry_id, user_id)` 唯一索引
- `prompt_square_favorites(entry_id, user_id)` 唯一索引
- `prompt_square_copy_logs(entry_id, created_at)`

---

## 九、API 设计

### 9.1 匿名可访问接口

```python
router = APIRouter(prefix="/square", tags=["prompt-square"])

@router.get("/entries")
async def list_square_entries(...)

@router.get("/entries/{entry_id}")
async def get_square_entry(...)

@router.get("/tags/popular")
async def get_popular_tags(...)

@router.get("/categories")
async def get_categories(...)
```

### 9.2 登录后接口

```python
@router.post("/entries/{entry_id}/like")
async def toggle_like(...)

@router.post("/entries/{entry_id}/favorite")
async def toggle_favorite(...)

@router.post("/entries/{entry_id}/copy")
async def copy_to_library(...)

@router.post("/prompts/{prompt_id}/publish")
async def publish_prompt(...)

@router.post("/entries/{entry_id}/unpublish")
async def unpublish_entry(...)
```

### 9.3 列表查询参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `page` | int | 页码，默认 1 |
| `page_size` | int | 默认 20，最大 50 |
| `search` | string | 搜索标题、摘要、标签 |
| `category` | string | 分类筛选 |
| `difficulty` | string | `simple / medium / advanced` |
| `recommended_model` | string | 推荐模型 |
| `tag` | string | 单标签筛选 |
| `sort_by` | string | `hot / newest / copies` |

### 9.4 鉴权实现注意点

当前 [backend/app/core/auth.py](/Users/moji/ground/inkPrompt/backend/app/core/auth.py) 中的 `HTTPBearer()` 默认会在无 token 时直接抛 401，因此如果要支持匿名浏览，不能直接把现有 `security` 复用于广场公开接口。

建议做法：

- 为可选登录场景单独定义 `HTTPBearer(auto_error=False)`
- 在广场列表/详情接口中使用 `get_optional_current_user`
- 在响应中返回 `is_liked`、`is_favorited` 等“当前用户视角字段”时，若匿名则统一返回 `false`

### 9.5 响应结构建议

```python
class PromptSquareEntryResponse(BaseModel):
    id: str
    prompt_id: str
    title: str
    summary: str
    category: str
    scenario: str | None
    difficulty: str
    tags: list[TagInDB]
    recommended_models: list[str]
    allow_full_preview: bool
    views: int
    likes: int
    favorites: int
    copies: int
    tests: int
    is_liked: bool = False
    is_favorited: bool = False
    author: dict
    published_at: datetime | None
    updated_at: datetime
```

---

## 十、前端实现设计

### 10.1 目录建议

```text
frontend/src/pages/PromptSquare/
├── index.tsx
├── PromptSquareDetail.tsx
├── components/
│   ├── SquareHero.tsx
│   ├── SquareToolbar.tsx
│   ├── SquareTagCloud.tsx
│   ├── SquareCard.tsx
│   ├── SquareDetailHeader.tsx
│   ├── PublishToSquareDialog.tsx
│   └── SquareEmptyState.tsx
├── hooks/
│   ├── usePromptSquareList.ts
│   └── usePromptSquareDetail.ts
└── types.ts
```

新增 API 文件：

```text
frontend/src/api/square.ts
```

### 10.2 路由接入点

需要修改 [frontend/src/App.tsx](/Users/moji/ground/inkPrompt/frontend/src/App.tsx)，新增公开路由：

```tsx
<Route path="/square" element={<PromptSquare />} />
<Route path="/square/:entryId" element={<PromptSquareDetail />} />
```

### 10.3 导航改动

需要修改 [frontend/src/components/Navbar.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/Navbar.tsx)：

- 新增“广场”导航项
- 根据当前路径判断高亮，不再默认只有“我的提示词”高亮

### 10.4 国际化改动

不要新建单独的 `promptSquare.json`，而是直接扩展现有：

- [frontend/src/i18n/locales/zh-CN.json](/Users/moji/ground/inkPrompt/frontend/src/i18n/locales/zh-CN.json)
- [frontend/src/i18n/locales/en-US.json](/Users/moji/ground/inkPrompt/frontend/src/i18n/locales/en-US.json)

建议新增根节点：

```json
{
  "square": {
    "title": "提示词广场",
    "subtitle": "发现社区共享的优秀提示词",
    "actions": {
      "viewDetail": "查看详情",
      "copy": "复制到我的库",
      "favorite": "收藏",
      "like": "点赞",
      "testNow": "立即测试",
      "publish": "发布到广场",
      "unpublish": "下架"
    }
  }
}
```

### 10.5 视觉与交互原则

- 沿用现有产品的浅色、水墨、纸张质感，不做全新品牌跳跃
- 卡片不宜堆过多按钮，主 CTA 保持 1 个，次操作 hover 出现
- 列表页优先提高可扫读性，详情页再提供完整上下文
- 摘要优先解释用途，而不是直接展示长 prompt 正文

---

## 十一、权限、审核与安全

### 11.1 权限规则

| 行为 | 未登录 | 已登录普通用户 | 条目作者 |
|------|--------|----------------|----------|
| 浏览列表/详情 | 允许 | 允许 | 允许 |
| 点赞/收藏/复制 | 需登录 | 允许 | 允许 |
| 发布 prompt | 不允许 | 允许发布自己的内容 | 允许 |
| 编辑/下架广场条目 | 不允许 | 仅本人 | 允许 |

### 11.2 内容审核

MVP 不做复杂审核后台，但数据层必须预留状态字段：

- `pending`
- `approved`
- `rejected`

默认策略建议：

- 第一版先走“发布即 approved”，但保留字段
- 当发现违规内容或垃圾刷屏时，可通过后台脚本直接下架

### 11.3 滥用控制

- 单用户每日发布次数限制
- 点赞、收藏接口做幂等处理
- 复制接口写日志，便于后续风控和统计

---

## 十二、性能与可访问性

### 12.1 性能

- 列表接口使用分页，默认每页 20 条
- 热门标签缓存 1 小时
- 分类缓存 24 小时
- 详情页统计可异步累加，避免阻塞主请求
- 卡片列表先做常规分页，后续再评估无限滚动

### 12.2 可访问性

- 卡片使用 `article`
- 所有交互元素可 Tab 聚焦
- 点赞、收藏、复制提供 `aria-label`
- 颜色对比度满足基础可读性

### 12.3 响应式规则

| 断点 | 卡片列数 | 标签区 | 筛选区 |
|------|----------|--------|--------|
| `<768px` | 1 列 | 横向滚动 | Drawer |
| `768-1199px` | 2 列 | 两行折叠 | 顶部折叠栏 |
| `>=1200px` | 3-4 列 | 完整展示 | 顶部工具栏 |

---

## 十三、埋点与数据分析

建议埋点事件：

- `square_list_view`
- `square_search`
- `square_filter_change`
- `square_card_click`
- `square_detail_view`
- `square_like_toggle`
- `square_favorite_toggle`
- `square_copy_click`
- `square_copy_success`
- `square_test_now_click`
- `square_publish_success`

关键属性：

- `entry_id`
- `prompt_id`
- `category`
- `tag`
- `sort_by`
- `is_logged_in`
- `source_page`

---

## 十四、验收标准

### 14.1 功能验收

- [ ] 未登录用户可以访问 `/square` 和 `/square/:entryId`
- [ ] 已登录用户可以点赞、收藏、复制公开条目
- [ ] 复制后成功创建新的个人 Prompt，并保留来源信息
- [ ] 发布后条目能出现在广场列表
- [ ] 下架后条目不再出现在公开列表
- [ ] 热门标签点击后能正确筛选
- [ ] 搜索、分类、难度、模型、排序能组合使用
- [ ] 列表、详情、空状态、错误态完整可用

### 14.2 工程验收

- [ ] 新路由不影响现有 `/prompts` 工作流
- [ ] 接口与现有 `/api/*` 风格保持一致
- [ ] 国际化键已加入中英文 locale 文件
- [ ] 新增模型具备必要索引与唯一约束
- [ ] 匿名访问不会因鉴权中间件误拦截

### 14.3 性能验收

- [ ] 广场首页接口 P95 < 400ms（本地 / 预发目标）
- [ ] 首屏在常规网络条件下可在 2.5s 内完成主要内容渲染
- [ ] 点赞、收藏、复制接口幂等且无明显重复提交问题

---

## 十五、实施计划

### Phase 1：数据层与公开读取

- 新增 `PromptSquareEntry`、`PromptSquareLike`、`PromptSquareFavorite`、`PromptSquareCopyLog`
- 新增列表、详情、热门标签、分类接口
- 接入匿名可访问鉴权逻辑

### Phase 2：前端广场首页与详情

- 新增 `/square`、`/square/:entryId`
- 补充 Navbar 入口
- 完成列表页、详情页、筛选、搜索、分页、空状态

### Phase 3：复制、点赞、收藏

- 完成复制到个人库
- 完成点赞、收藏幂等接口
- 跳转到 PromptDetail 测试面板

### Phase 4：发布与下架

- 新增发布对话框
- 允许用户把自己的 prompt 发布到广场
- 支持下架和重新发布

### Phase 5：指标与优化

- 接入埋点
- 优化排序策略
- 评估是否增加精选/推荐位

---

## 十六、风险与待确认事项

### 16.1 已识别风险

- 当前匿名鉴权实现与公开浏览诉求冲突，需要先改 auth 依赖
- 如果直接公开完整 prompt 正文，容易造成“只复制不理解”的内容消费方式，也可能暴露用户不想公开的细节
- 若复制不记录来源，后续将无法统计广场的真实贡献度

### 16.2 待确认决策

- 详情页默认展示全文，还是仅展示摘要 + 局部预览
- “收藏”是否需要单独的广场收藏页
- 是否允许一个 prompt 关联多个公开版本

当前建议：

- 默认只展示摘要和结构化说明，全文预览通过 `allow_full_preview` 控制
- 收藏先只做行为，不单独新建页面
- 一个 prompt 同时只允许一个活跃广场条目，降低复杂度

---

## 十七、相关文件

- [frontend/src/App.tsx](/Users/moji/ground/inkPrompt/frontend/src/App.tsx)
- [frontend/src/components/Navbar.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/Navbar.tsx)
- [frontend/src/components/PromptCard.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/PromptCard.tsx)
- [frontend/src/components/AddToFolderDialog.tsx](/Users/moji/ground/inkPrompt/frontend/src/components/AddToFolderDialog.tsx)
- [frontend/src/i18n/locales/zh-CN.json](/Users/moji/ground/inkPrompt/frontend/src/i18n/locales/zh-CN.json)
- [frontend/src/i18n/locales/en-US.json](/Users/moji/ground/inkPrompt/frontend/src/i18n/locales/en-US.json)
- [backend/app/core/auth.py](/Users/moji/ground/inkPrompt/backend/app/core/auth.py)
- [backend/app/models/prompt.py](/Users/moji/ground/inkPrompt/backend/app/models/prompt.py)
- [backend/app/models/prompt_version.py](/Users/moji/ground/inkPrompt/backend/app/models/prompt_version.py)
- [backend/app/api/prompts.py](/Users/moji/ground/inkPrompt/backend/app/api/prompts.py)

---

## 十八、结论

提示词广场不应被设计成一个孤立的展示页，而应成为 Ink & Prompt 的“社区发现层”。它前接公开内容消费，后接个人提示词库、测试面板和优化流程。只要把“公开浏览、复制沉淀、继续优化”这条链路设计顺，广场就能自然成为产品增长与内容复用的核心入口。
