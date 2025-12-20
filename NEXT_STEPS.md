# 🎯 下一步实施计划

> 当前进度: 45% | 最后更新: 2025-12-05 20:25

## ✅ 已完成功能总结

### 后端 API (100%)
- ✅ 用户认证系统 (JWT + Supabase)
- ✅ 提示词 CRUD API (6 个端点)
- ✅ Token 自动计算 (tiktoken)
- ✅ 版本自动创建
- ✅ 搜索、分页、标签筛选

### 前端基础 (80%)
- ✅ 项目搭建 (Vite + React + TypeScript)
- ✅ Tailwind v3 + 墨色系主题
- ✅ 用户认证 UI (登录页 + OAuth)
- ✅ 路由守卫
- ⚠️ 提示词列表页 (仅占位符)

---

## 🚀 优先级 1: 前端提示词管理 UI

### 需要实现的文件

#### 1. API 调用封装
**文件**: `frontend/src/api/prompts.ts`
```typescript
// 封装所有提示词相关的 API 调用
- fetchPrompts(params) - 获取列表
- fetchPrompt(id) - 获取详情
- createPrompt(data) - 创建
- updatePrompt(id, data) - 更新
- deletePrompt(id) - 删除
- fetchPromptVersions(id) - 获取版本历史
```

#### 2. TypeScript 类型定义
**文件**: `frontend/src/types/prompt.ts`
```typescript
export interface Prompt {
  id: string
  name: string
  content: string
  token_count: number
  tags: Tag[]
  created_at: string
  updated_at: string
}

export interface Tag {
  id: string
  name: string
  is_system: boolean
  use_count: number
}

export interface PromptVersion {
  id: string
  version_number: number
  content: string
  token_count: number
  change_note: string | null
  created_at: string
}
```

#### 3. 提示词卡片组件
**文件**: `frontend/src/components/PromptCard.tsx`
- 显示提示词名称、内容预览、Token 数
- 显示标签列表
- 编辑/删除按钮
- 点击查看详情

#### 4. 提示词列表页面
**文件**: `frontend/src/pages/PromptList.tsx` (完善)
- 列表展示 (使用 PromptCard)
- 搜索框
- 标签筛选
- 分页控件
- 新建按钮
- 加载状态
- 空状态

#### 5. 提示词编辑器页面
**文件**: `frontend/src/pages/PromptEditor.tsx`
- 创建/编辑表单
- 名称输入
- 内容输入 (textarea)
- Token 实时显示
- 标签选择/创建
- 保存/取消按钮
- 版本历史展示

#### 6. 删除确认对话框
**文件**: `frontend/src/components/ConfirmDialog.tsx`
- 通用确认对话框组件
- 用于删除提示词确认

---

## 🎨 优先级 2: UI 组件库

### 基础组件

#### 1. Layout 组件
**文件**: `frontend/src/components/Layout.tsx`
- 整体页面布局
- 导航栏位置
- 内容区域

#### 2. Navbar 组件
**文件**: `frontend/src/components/Navbar.tsx`
- Logo
- 用户信息
- 登出按钮
- 响应式设计

#### 3. Loading 组件
**文件**: `frontend/src/components/Loading.tsx`
- 加载动画 (墨水晕染风格)
- 支持全屏和内联

#### 4. EmptyState 组件
**文件**: `frontend/src/components/EmptyState.tsx`
- 空状态提示
- 引导用户创建第一个提示词

#### 5. Toast 通知系统
**选项**:
- 使用 `react-hot-toast` 库
- 或自己实现简单的 Toast

---

## 📋 优先级 3: 标签管理功能

### 后端 API
**文件**: `backend/app/api/tags.py`
```python
GET /api/tags - 获取标签列表
POST /api/tags - 创建标签
DELETE /api/tags/{id} - 删除标签
```

**文件**: `backend/app/services/tag_service.py`
- 标签 CRUD 业务逻辑
- 使用次数统计

### 前端组件
**文件**: `frontend/src/components/TagInput.tsx`
- 标签输入框
- 自动补全
- 创建新标签
- 删除标签

**文件**: `frontend/src/components/TagFilter.tsx`
- 标签筛选器
- 多选支持

### 系统预设标签
**文件**: `backend/app/utils/init_data.py`
```python
def init_system_tags():
    """初始化系统预设标签"""
    system_tags = [
        "角色扮演", "代码生成", "文本润色",
        "翻译", "总结", "问答", "创作"
    ]
```

---

## 📊 实施建议

### 阶段 1: 基础可用 (约 2-3 小时)
1. 实现 API 调用封装
2. 完善提示词列表页
3. 实现简单的创建/编辑表单
4. 添加删除功能

**目标**: 用户可以创建、查看、编辑、删除提示词

### 阶段 2: 完善体验 (约 1-2 小时)
1. 添加搜索功能
2. 添加分页
3. 实现 Loading/Empty 状态
4. 添加 Toast 通知

**目标**: 完整的用户体验

### 阶段 3: 标签系统 (约 2 小时)
1. 后端标签 API
2. 前端标签组件
3. 标签筛选功能
4. 系统预设标签

**目标**: 完整的标签管理

---

## 🔧 开发环境状态

✅ 前端: http://localhost:3000
✅ 后端: http://localhost:8000
✅ API 文档: http://localhost:8000/api/docs

### 当前可测试的 API

```bash
# 需要先配置 Supabase 并登录获取 Token
# 然后在 Authorization header 中添加: Bearer YOUR_TOKEN

# 创建提示词
POST http://localhost:8000/api/prompts
{
  "name": "测试提示词",
  "content": "这是一个测试提示词的内容",
  "tag_names": ["测试", "演示"]
}

# 获取列表
GET http://localhost:8000/api/prompts?page=1&page_size=20

# 搜索
GET http://localhost:8000/api/prompts?search=测试

# 更新
PUT http://localhost:8000/api/prompts/{id}
{
  "name": "更新后的名称",
  "content": "更新后的内容",
  "change_note": "修改了内容"
}

# 删除
DELETE http://localhost:8000/api/prompts/{id}

# 查看版本历史
GET http://localhost:8000/api/prompts/{id}/versions
```

---

## 💡 技术要点

### Token 显示
```typescript
// 显示 Token 数时添加说明
<div className="text-sm text-ink-500">
  <span className="font-medium">{prompt.token_count}</span> tokens
  <span className="ml-2 text-ink-400">
    (估算值，实际可能有 ±5% 误差)
  </span>
</div>
```

### 版本历史
- 只在编辑页面显示
- 按版本号降序排列
- 显示每个版本的变更说明
- 可以点击查看历史版本内容

### 墨色系设计
- 主色调: `ink-700`, `ink-800`
- 背景: `paper-white`, `paper-cream`
- 强调色: `accent-purple`, `accent-green`
- 边框: `ink-200`, `ink-300`

---

## 📁 建议的实施顺序

```
1. frontend/src/types/prompt.ts         (类型定义)
2. frontend/src/api/prompts.ts          (API 封装)
3. frontend/src/components/Loading.tsx  (加载组件)
4. frontend/src/components/EmptyState.tsx (空状态)
5. frontend/src/components/PromptCard.tsx (卡片组件)
6. frontend/src/pages/PromptList.tsx    (完善列表页)
7. frontend/src/pages/PromptEditor.tsx  (编辑器页面)
8. frontend/src/components/ConfirmDialog.tsx (确认对话框)
9. backend/app/api/tags.py              (标签 API)
10. frontend/src/components/TagInput.tsx (标签输入)
```

---

## 🎯 成功标准

### MVP 完成标准
- [ ] 用户可以登录 (配置 Supabase 后)
- [ ] 用户可以创建提示词
- [ ] 用户可以查看提示词列表
- [ ] 用户可以编辑提示词
- [ ] 用户可以删除提示词
- [ ] Token 数自动计算并显示
- [ ] 版本历史自动创建
- [ ] 可以搜索提示词
- [ ] 可以通过标签筛选
- [ ] UI 符合墨色系设计风格

### 下一版本功能
- [ ] 导出提示词 (Markdown/JSON)
- [ ] 批量操作
- [ ] 提示词分享
- [ ] LLM 测试功能
- [ ] 提示词模板库

---

**准备继续？** 我可以立即开始实现前端提示词管理 UI！
