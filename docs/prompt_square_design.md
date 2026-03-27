# 提示词广场功能设计

## 概述

为 Ink & Prompt 设计一个提示词广场，让用户可以发现、学习、使用社区分享的优秀提示词。用户可以浏览不同分类的提示词，通过标签查询，一键复制到自己的收藏夹或文件夹。

### 设计目标

- **目标用户**：需要灵感的新用户、想学习提示词技巧的创作者
- **核心价值**：社区化学习 + 一键复用
- **转化目标**：提高平台活跃度，促进用户间分享

---

## 页面结构

### 整体布局

```
┌─────────────────────────────────────────────────────────────┐
│ [Logo] Ink & Prompt   [我的] [广场] [创作]    [语言 ▼]  [头像] │
├─────────────────────────────────────────────────────────────┤
│                     热门标签栏                               │
│ #文案创作 #代码生成 #数据分析 #教育辅导 #营销策划 ...         │
├─────────────────────────────────────────────────────────────┤
│ 筛选栏 │            提示词瀑布流                          │
│ - 类别 │ ┌──────┐  ┌──────┐  ┌──────┐  ┌──────┐         │
│ - 用途 │ │      │  │      │  │      │  │      │         │
│ - 模型 │ │卡片1 │  │卡片2 │  │卡片3 │  │卡片4 │         │
│ - 难度 │ │      │  │      │  │      │  │      │         │
│ - 排序 │ └──────┘  └──────┘  └──────┘  └──────┘         │
│       │                                               │
└─────────────────────────────────────────────────────────────┘
```

### 导航设计

| 导航项 | 跳转目标 | 状态 |
|--------|----------|------|
| Logo | 落地页首页 | 常驻 |
| 我的 | `/prompts` (个人提示词库) | 常驻 |
| 广场 | `/square` (当前页) | 高亮激活 |
| 创作 | `/prompts/new` (创建新提示词) | 常驻 |
| 语言切换 | 切换语言 | 常驻 |
| 用户头像 | 用户菜单（设置、登出） | 登录后显示 |

---

## 功能详情

### 1. 热门标签云

```
┌────────────────────────────────────────────────────────────────┐
│                                                        │
│  #文案创作  #代码生成  #数据分析  #教育辅导            │
│  #营销策划  #产品描述  #会议纪要  #代码审查           │
│  #翻译助手  #文档总结  #邮件撰写  #对话设计             │
│                                                        │
└────────────────────────────────────────────────────────────────┘
```

**设计规范**：
- 每个标签可点击，跳转至该标签下的提示词列表
- 标签字体大小根据使用热度动态调整（更热门 = 更大）
- 悬停时显示该标签下的提示词数量

### 2. 筛选侧边栏

```
┌──────────────────────────────────┐
│  筛选                     │
│  ──────────────────           │
│  分类                      │
│  ├ 文案创作               │
│  ├ 代码生成               │
│  ├ 数据分析               │
│  └ 更多...                │
│                            │
│  用途                      │
│  ├ 提高回答质量           │
│  ├ 节省 Token 消耗       │
│  └ 提升输出结构           │
│                            │
│  推荐模型                 │
│  ☑ GPT-4                │
│  ☑ Claude 3              │
│  ☐ Gemini Pro             │
│                            │
│  难度                     │
│  ⚪ 简单                 │
│  ⚪ 中等                 │
│  ⚪ 困难                 │
│                            │
│  排序                     │
│  ◉ 最热                   │
│  ○ 最新                   │
│  ○ 最多使用               │
│                            │
│  [重置筛选]               │
└──────────────────────────────────┘
```

### 3. 提示词卡片

```
┌────────────────────────────────────────────────────────────┐
│  [测试]                              [⭐ 128]  [📥 2.5k] │
│                                                    │
│  ╔═══════════════════════════════════════════╗  │
│  ║ 📌 优秀的产品描述提示词                    ║  │
│  ║                                          ║  │
│  ║ 这个提示词帮助你写出简洁有力、      ║  │
│  ║ 吸引人的产品描述，突出核心卖点和      ║  │
│  ║ 用户收益。                                   ║  │
│  ╚═══════════════════════════════════════════╝  │
│                                                    │
│  #文案创作  #产品描述  #营销                    │
│                                                    │
│  ─────────────────────────────────────────────────            │
│  [头像] @tech_writer                  [收藏]          │
│  使用 2.5k · 收藏 156 · 3 天前更新             │
└────────────────────────────────────────────────────────────┘
```

**卡片交互**：
- 点击卡片：进入提示词详情页
- 点击"测试"按钮：直接跳转至 PromptDetail 页面的测试面板
- 点击"收藏"：收藏到用户的收藏文件夹
- 点击作者头像：查看该作者的其他提示词

### 4. 提示词详情页

```
┌──────────────────────────────────────────────────────────────────┐
│  ← 返回          提示词详情                              [分享]  │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────┐  ┌──────────────────────┐    │
│  │  提示词预览          │  │  作者信息            │    │
│  │                      │  │                      │    │
│  │  ╔════════════════╗  │  │  [头像]             │    │
│  │  ║ 预览内容...     ║  │  │  @tech_writer       │    │
│  │  ║                ║  │  │  优质创作者         │    │
│  │  ╚════════════════╝  │  │  分享 128 个提示词    │    │
│  │                      │  │  收获 2.5k 关注者    │    │
│  │  [复制到我的库]       │  │                      │    │
│  │                      │  │  [+ 关注]            │    │
│  └──────────────────────────┘  └──────────────────────┘    │
│                                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  使用统计                                        │   │
│  │  - 总使用次数：12,456                            │   │
│  │  - 本周使用：1,234 (+15%)                    │   │
│  │  - 平均评分：4.8 ⭐                             │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                          │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │  效果预览                                        │   │
│  │  ┌────────────┐  ┌────────────┐  ┌──────────┐│   │
│  │  │GPT-4 输出  │  │Claude 输出 │  │Gemini   ││   │
│  │  │            │  │            │  │输出     ││   │
│  │  │"产品描述... │  │"产品描述... │  │"产品...  ││   │
│  │  └────────────┘  └────────────┘  └──────────┘│   │
│  │                                                         │   │
│  │  [查看完整对比结果 →]                                 │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                          │
│  [一键测试多个模型 →]                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 5. 收藏流程

用户点击收藏后，弹出收藏文件夹选择对话框：

```
┌────────────────────────────────────────────┐
│  保存到收藏夹                       │
│  ──────────────────────────────────────   │
│  ┌───────────────────────────────────┐   │
│  │ ☑ 产品相关              │   │
│  │ ☑ 营销文案             │   │
│  │ ☐ 技术文档             │   │
│  │ [+ 新建收藏夹]            │   │
│  └───────────────────────────────────┘   │
│                              │
│  [取消]              [确认保存]  │
└────────────────────────────────────────────┘
```

---

## 用户旅程

### 发现与使用流程

```
用户访问提示词广场
      ↓
浏览热门标签或筛选
      ↓
发现感兴趣的提示词
      ↓
点击查看详情
      ↓
预览效果或直接测试
      ↓
复制到个人库或收藏
      ↓
在 PromptDetail 进行优化和测试
```

### 已登录用户行为

1. 可以直接收藏提示词到个人文件夹
2. 测试功能直接跳转至 PromptDetail 的测试面板
3. 关注作者，获取后续更新

### 未登录用户行为

1. 可以浏览和查看所有公开提示词
2. 点击收藏/复制时提示登录
3. 可以查看预览效果，但无法保存结果

---

## 数据模型设计

### 扩展 Prompt 模型

```python
class PromptSquare(Base):
    """提示词广场扩展表，用于管理公开提示词信息"""

    __tablename__ = "prompt_square"

    id = Column(String(36), primary_key=True, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)

    # 公开标识
    is_public = Column(Boolean, default=False, nullable=False, index=True)

    # 统计数据
    views = Column(Integer, default=0, nullable=False)      # 浏览次数
    likes = Column(Integer, default=0, nullable=False)      # 点赞数
    copies = Column(Integer, default=0, nullable=False)     # 复制次数

    # 分类信息
    category = Column(String(50), nullable=False, index=True)   # 主分类
    subcategory = Column(String(50), nullable=True)            # 子分类
    difficulty = Column(String(20), default="简单")           # 难度：简单/中等/困难

    # 推荐模型（适用模型的提示）
    recommended_models = Column(Text, nullable=True)  # JSON 字符串存储模型列表

    # 时间戳
    published_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False)

    # 关系
    prompt = relationship("Prompt", back_populates="square_info")

    def __repr__(self) -> str:
        return f"<PromptSquare(id={self.id}, prompt_id={self.prompt_id})>"
```

### Prompt 模型扩展

在现有 `Prompt` 模型中添加：

```python
class Prompt(Base):
    # ... 现有字段 ...

    # 广场关联
    square_info = relationship("PromptSquare", back_populates="prompt", uselist=False, cascade="all, delete-orphan")
```

### 点赞记录表

```python
class PromptLike(Base):
    """提示词点赞记录"""

    __tablename__ = "prompt_likes"

    id = Column(String(36), primary_key=True, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # 联合唯一索引
    __table_args__ = (
        UniqueConstraint('prompt_id', 'user_id', name='uix_prompt_user_like'),
    )
```

### 收藏记录表

```python
class PromptSquareFavorite(Base):
    """提示词广场收藏记录"""

    __tablename__ = "prompt_square_favorites"

    id = Column(String(36), primary_key=True, index=True)
    prompt_id = Column(String(36), ForeignKey("prompts.id", ondelete="CASCADE"), nullable=False, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    folder_id = Column(String(36), ForeignKey("prompt_folders.id", ondelete="SET NULL"), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)

    # 联合唯一索引（用户对同一提示词只能收藏一次）
    __table_args__ = (
        UniqueConstraint('prompt_id', 'user_id', name='uix_prompt_user_favorite'),
    )

    def __repr__(self) -> str:
        return f"<PromptSquareFavorite(id={self.id}, prompt_id={self.prompt_id})>"
```

---

## API 设计

### 提示词广场端点

```python
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.prompt_square import (
    PromptSquareResponse,
    PromptSquareListResponse,
    PromptLikeResponse,
    PromptCopyResponse,
)

router = APIRouter(prefix="/square", tags=["prompt-square"])

@router.get("/prompts", response_model=PromptSquareListResponse)
async def list_square_prompts(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    category: str | None = Query(None),
    subcategory: str | None = Query(None),
    difficulty: str | None = Query(None, regex="^(简单|中等|困难)$"),
    search: str | None = Query(None),
    sort_by: str = Query("hot", regex="^(hot|new|popular)$"),
    tags: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptSquareListResponse:
    """
    获取公开提示词列表。

    Args:
        page: 页码
        page_size: 每页数量
        category: 分类筛选
        subcategory: 子分类筛选
        difficulty: 难度筛选
        search: 搜索关键词
        sort_by: 排序（hot=最热, new=最新, popular=最多使用）
        tags: 标签筛选（逗号分隔）

    Returns:
        PromptSquareListResponse: 提示词列表
    """
    ...

@router.get("/prompts/{prompt_id}", response_model=PromptSquareResponse)
async def get_square_prompt(
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptSquareResponse:
    """获取单个提示词详情。"""
    ...

@router.post("/prompts/{prompt_id}/like", response_model=PromptLikeResponse)
async def like_prompt(
    prompt_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptLikeResponse:
    """
    点赞或取消点赞提示词。

    如果已点赞则取消，否则新增点赞。
    """
    ...

@router.post("/prompts/{prompt_id}/copy", response_model=PromptCopyResponse)
async def copy_prompt_to_library(
    prompt_id: str,
    folder_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptCopyResponse:
    """
    复制提示词到用户的提示词库。

    自动保存为新提示词，标记来源。
    """
    ...

@router.post("/prompts/{prompt_id}/favorite", response_model=PromptCopyResponse)
async def favorite_prompt(
    prompt_id: str,
    folder_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> PromptCopyResponse:
    """
    收藏提示词。

    如果未指定 folder_id，收藏到默认收藏夹。
    """
    ...

@router.get("/categories", response_model=List[dict])
async def get_categories(
    db: Session = Depends(get_db)
) -> List[dict]:
    """
    获取所有分类及子分类。
    """
    ...

@router.get("/trending", response_model=PromptSquareListResponse)
async def get_trending(
    limit: int = Query(10, ge=1, le=50),
    db: Session = Depends(get_db)
) -> PromptSquareListResponse:
    """
    获取热门/趋势提示词。

    基于最近 7 天的使用和点赞数据。
    """
    ...

@router.get("/tags/popular", response_model=List[dict])
async def get_popular_tags(
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
) -> List[dict]:
    """
    获取热门标签。
    """
    ...
```

---

## 前端设计

### 组件结构

```
frontend/src/pages/PromptSquare/
├── index.tsx                    # 广场主页面
├── components/
│   ├── PromptCard.tsx            # 提示词卡片
│   ├── FilterSidebar.tsx           # 筛选侧边栏
│   ├── TagCloud.tsx              # 热门标签云
│   ├── AuthorInfo.tsx            # 作者信息组件
│   ├── PromptDetail.tsx           # 提示词详情页
│   ├── StatsCard.tsx             # 统计卡片
│   └── EffectPreview.tsx         # 效果预览组件
├── hooks/
│   └── usePromptSquare.ts         # 广场相关 hooks
└── types/
    └── promptSquare.ts            # TypeScript 类型定义
```

### TypeScript 类型定义

```typescript
// frontend/src/types/promptSquare.ts

export interface PromptSquareCard {
  id: string
  promptId: string
  name: string
  content: string
  author: {
    id: string
    name: string
    avatar: string
  }
  category: string
  subcategory?: string
  difficulty: 'simple' | 'medium' | 'hard'
  tags: Tag[]
  stats: {
    views: number
    likes: number
    copies: number
    rating: number
  }
  recommendedModels: string[]
  isLiked: boolean
  isFavorited: boolean
  createdAt: string
  updatedAt: string
}

export interface SquareFilter {
  category?: string
  subcategory?: string
  difficulty?: 'simple' | 'medium' | 'hard'
  search?: string
  sortBy?: 'hot' | 'new' | 'popular'
  tags?: string[]
}

export interface AuthorProfile {
  id: string
  name: string
  avatar: string
  bio: string
  followerCount: number
  sharedCount: number
  likesReceived: number
}

export interface EffectPreview {
  model: string
  output: string
  tokenCount: number
  latency: number
}
```

### 主要组件伪代码

#### PromptCard.tsx

```tsx
export function PromptCard({ prompt, onLike, onFavorite, onCopy, onTest }: PromptCardProps) {
  return (
    <div className="bg-white border border-ink-200 rounded-2xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all cursor-pointer group">
      {/* 顶部操作栏 */}
      <div className="flex justify-between items-start mb-4">
        <TestButton onClick={onTest} />
        <div className="flex gap-3">
          <LikeButton count={prompt.stats.likes} isLiked={prompt.isLiked} onClick={onLike} />
          <UsageBadge count={prompt.stats.copies} />
        </div>
      </div>

      {/* 提示词内容预览 */}
      <PromptPreview content={prompt.content} maxLength={150} />

      {/* 标签 */}
      <TagList tags={prompt.tags} />

      {/* 底部信息 */}
      <div className="flex justify-between items-center mt-4 pt-4 border-t border-ink-100">
        <AuthorInfo author={prompt.author} size="small" />
        <FavoriteButton
          isFavorited={prompt.isFavorited}
          onClick={onFavorite}
        />
      </div>
    </div>
  )
}
```

---

## 响应式设计

### 断点规范

| 断点 | 筛选栏 | 提示词卡片 | 标签云 |
|------|----------|------------|--------|
| Mobile (<768px) | 折叠（抽屉式）| 1 列 | 2 行 |
| Tablet (768-1023px) | 侧边栏（占 25%）| 2 列 | 3 行 |
| Desktop (≥1024px) | 侧边栏（占 20%）| 3 列 | 4 行 |

---

## 多语言支持

### 翻译键结构

```json
// frontend/src/i18n/locales/zh/promptSquare.json
{
  "square": {
    "title": "提示词广场",
    "hero": {
      "subtitle": "发现社区共享的优秀提示词，一键复制使用"
    },
    "filter": {
      "title": "筛选",
      "category": "分类",
      "usage": "用途",
      "model": "推荐模型",
      "difficulty": "难度",
      "sortBy": "排序",
      "reset": "重置筛选"
    },
    "card": {
      "test": "测试",
      "copy": "复制",
      "favorite": "收藏",
      "views": "浏览",
      "likes": "点赞",
      "difficulty": {
        "simple": "简单",
        "medium": "中等",
        "hard": "困难"
      }
    },
    "detail": {
      "title": "提示词详情",
      "copyToLibrary": "复制到我的库",
      "preview": "效果预览",
      "usageStats": "使用统计",
      "authorInfo": "作者信息",
      "follow": "关注"
    }
  }
}
```

---

## 性能优化

### 缓存策略

| 数据类型 | 缓存方式 | TTL |
|----------|----------|-----|
| 提示词列表 | Redis | 5 分钟 |
| 热门标签 | Redis | 1 小时 |
| 分类列表 | Redis | 24 小时 |
| 单个提示词详情 | Redis | 10 分钟 |

### 分页策略

- 使用 cursor-based 分页替代 offset 分页，提高大列表性能
- 预加载下一页数据，优化滚动体验

---

## 可访问性

### 键盘导航

- Tab 键：在筛选选项和提示词卡片之间切换
- Enter/Space：激活当前聚焦的卡片或按钮
- Esc：关闭详情页、收起筛选栏

### 屏幕阅读器

- 所有图片包含 alt 属性
- 卡片使用正确的 HTML 语义（article、figure）
- 按钮和链接有明确的 aria-label

---

## 验收标准

### 功能验收

- [ ] 用户可以浏览所有公开提示词
- [ ] 筛选功能正常工作
- [ ] 点赞/取消点赞状态正确
- [ ] 复制到个人库成功
- [ ] 收藏功能正常
- [ ] 测试按钮正确跳转
- [ ] 作者信息展示正确
- [ ] 移动端布局合理

### 性能验收

- [ ] 首屏 LCP < 2.5s
- [ ] 列表滚动流畅（60fps）
- [ ] 筛选切换响应快速（< 100ms）
- [ ] 图片懒加载正常

---

## 实施计划

### 第一阶段：MVP

| 任务 | 优先级 | 预计时间 |
|------|--------|----------|
| 数据库模型创建 | 高 | 0.5 天 |
| API 端点实现 | 高 | 1 天 |
| 前端主页面和卡片组件 | 高 | 1 天 |
| 基础筛选功能 | 高 | 1 天 |

**预计时间**：3.5 天

### 第二阶段：完善体验

| 任务 | 优先级 | 预计时间 |
|------|--------|----------|
| 点赞和收藏功能 | 高 | 1 天 |
| 提示词详情页 | 高 | 1 天 |
| 标签云组件 | 中 | 0.5 天 |
| 作者信息组件 | 中 | 0.5 天 |
| 统计数据展示 | 中 | 0.5 天 |

**预计时间**：3.5 天

### 第三阶段：高级功能

| 任务 | 优先级 | 预计时间 |
|------|--------|----------|
| 效果预览展示 | 中 | 2 天 |
| 关注作者功能 | 低 | 1 天 |
| 评论系统 | 低 | 2 天 |
| AI 推荐系统 | 低 | 3 天 |

**预计时间**：8 天

---

## 相关资源

### 参考设计
- [Dribbble Shots](https://dribbble.com/shots) - 瀑布流布局参考
- [Behance Discover](https://www.behance.net/discover) - 分类筛选参考
- [GitHub Trending](https://github.com/trending) - 热门排序参考

### 相关文档
- [提示词详情页面重构计划](./prompt_detail_redesign_plan.md)
- [国际化设计方案](./i18n_design.md)
- [落地页设计方案](./landing_page_design.md)

### 现有组件复用
- `frontend/src/components/Navbar.tsx` - 导航栏（需添加"广场"入口）
- `frontend/src/components/TagFilter.tsx` - 标签筛选组件（可复用）
- `frontend/src/components/PromptCard.tsx` - 提示词卡片（需扩展为广场版）
- `frontend/src/components/FolderSidebar.tsx` - 文件夹侧边栏（参考设计）
