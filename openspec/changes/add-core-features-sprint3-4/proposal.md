# 核心功能增强提案 (Sprint 3-4)

## Why

MVP (Phase 1) 已经完成了基础的提示词管理功能,但仍缺少一些核心价值功能来真正实现 "让提示词更像写作,而不是编程" 的理念。用户需要:

1. **版本历史查看**: 能够追溯提示词的演变过程,像 Git 一样管理创作历史
2. **标签筛选和搜索**: 快速在大量提示词中找到需要的内容,提升检索效率
3. **提示词优化**: 通过 AI 辅助优化提示词质量,让提示词创作更专业

这些功能是产品核心价值的重要组成部分,将显著提升用户体验和产品竞争力。

## What Changes

### 1. 版本历史查看功能
- 实现提示词版本列表展示
- 支持查看任意历史版本的完整内容
- 显示版本号、修改时间、Token 数变化
- 支持版本对比 (可选的高级功能)
- 支持版本回滚功能

### 2. 标签筛选和搜索增强
- 实现多标签组合筛选 (AND/OR 逻辑)
- 优化标签筛选 UI (标签云/标签列表)
- 增强搜索功能 (支持标题+内容全文搜索)
- 添加搜索高亮显示
- 实现搜索结果排序 (相关度/时间/Token 数)

### 3. 提示词优化功能 (单场景)
- 集成 LangChain 进行大模型调用
- 实现单场景优化 (选择一个预设场景)
- 创建优化 API 端点
- 设计优化结果展示 UI
- 记录大模型调用历史
- 实现优化建议应用功能

### 4. 数据模型扩展
- 扩展 PromptVersion 模型支持变更说明
- 创建 ModelCall 模型记录大模型调用
- 优化数据库索引提升查询性能

## Impact

### 受影响的规范
- **NEW**: `prompt-version-history` - 提示词版本历史规范
- **NEW**: `advanced-search-filter` - 高级搜索和筛选规范
- **NEW**: `prompt-optimization` - 提示词优化规范
- **NEW**: `model-call-tracking` - 大模型调用记录规范
- **MODIFIED**: `prompt-management` - 提示词管理规范 (增加版本相关功能)
- **MODIFIED**: `tag-management` - 标签管理规范 (增加筛选功能)

### 受影响的代码

**前端新增**:
- `src/pages/PromptHistory.tsx` - 版本历史页面
- `src/components/VersionList.tsx` - 版本列表组件
- `src/components/VersionCompare.tsx` - 版本对比组件 (可选)
- `src/components/TagFilter.tsx` - 标签筛选组件
- `src/components/OptimizationPanel.tsx` - 优化面板组件
- `src/api/versions.ts` - 版本历史 API
- `src/api/optimization.ts` - 优化 API

**前端修改**:
- `src/pages/PromptList.tsx` - 增加高级搜索和标签筛选
- `src/pages/PromptEditor.tsx` - 集成优化功能
- `src/components/PromptCard.tsx` - 显示版本数量

**后端新增**:
- `app/api/versions.py` - 版本历史 API 路由
- `app/api/optimization.py` - 提示词优化 API 路由
- `app/services/optimization_service.py` - 优化业务逻辑
- `app/chains/prompt_optimizer.py` - LangChain 优化链
- `app/prompts/optimization_templates.py` - 优化提示词模板
- `app/callbacks/call_tracker.py` - 模型调用记录回调
- `app/models/model_call.py` - 大模型调用记录模型
- `app/schemas/version.py` - 版本相关 Schema
- `app/schemas/optimization.py` - 优化相关 Schema

**后端修改**:
- `app/api/prompts.py` - 增加高级搜索和筛选参数
- `app/services/prompt_service.py` - 优化版本创建逻辑,支持变更说明
- `app/api/tags.py` - 增加标签筛选相关接口

**数据库**:
- 修改 `prompt_versions` 表增加 `change_note` 字段
- 创建 `model_calls` 表
- 优化数据库索引 (prompts 表的 name/content 字段,tags 表的 name 字段)

### 技术风险
- **LangChain 集成复杂度**: 需要正确配置 LangChain,处理各种模型 API 的差异
- **大模型 API 成本**: 需要实现调用频率限制,防止成本失控
- **全文搜索性能**: SQLite 的全文搜索性能可能不足,未来可能需要迁移到 PostgreSQL 或引入 Elasticsearch
- **版本数据量增长**: 历史版本会持续增长,需要考虑归档策略

### 业务影响
- 用户可以完整追踪提示词的演变历史
- 用户可以快速找到需要的提示词
- 用户可以通过 AI 辅助提升提示词质量
- 为未来的积分系统和成本核算提供数据基础

### 非功能性影响
- **性能**: 需要优化数据库查询,添加索引
- **成本**: 引入大模型 API 调用成本,需要实现用量控制
- **可扩展性**: 为未来的多场景优化、对话功能预留架构空间
