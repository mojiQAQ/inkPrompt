# 核心功能增强任务清单 (Sprint 3-4)

## 1. 数据模型和数据库扩展
- [x] 1.1 修改 PromptVersion 模型增加 change_note 字段
- [x] 1.2 创建 ModelCall 数据模型
- [x] 1.3 创建数据库迁移脚本
- [x] 1.4 为 prompts 表的 name 和 content 字段添加索引
- [x] 1.5 为 tags 表的 name 字段添加索引
- [x] 1.6 执行数据库迁移

## 2. 版本历史功能实现 ✅
- [x] 2.1 定义版本历史 Pydantic Schema (backend/app/schemas/version.py)
- [x] 2.2 实现版本列表 API (GET /api/prompts/{id}/versions)
- [x] 2.3 实现版本详情 API (GET /api/prompts/{id}/versions/{version_id})
- [x] 2.4 实现版本回滚 API (POST /api/prompts/{id}/versions/{version_id}/restore)
- [x] 2.5 修改提示词更新逻辑支持 change_note 参数 (已通过 UpdatePromptData schema 支持)
- [x] 2.6 前端创建版本列表组件 (VersionList.tsx)
- [x] 2.7 前端创建版本详情对话框组件 (VersionDetailDialog.tsx)
- [x] 2.8 在 PromptEditor 中集成版本历史入口
- [x] 2.9 实现版本回滚确认对话框 (已集成在 VersionList 和 VersionDetailDialog 中)
- [x] 2.10 封装版本 API 调用函数 (frontend/src/api/versions.ts)
- [x] 2.11 修复前端数据解析问题，版本历史功能完整可用
- [x] 2.12 在 PromptCard 上显示版本数量徽章 (可选优化) ✅

## 3. 高级搜索和标签筛选 ✅
- [x] 3.1 修改提示词列表 API 支持全文搜索 (name + content)
- [x] 3.2 修改提示词列表 API 支持多标签筛选 (AND/OR 逻辑)
- [x] 3.3 实现搜索结果排序功能 (按更新时间/创建时间/名称/Token数)
- [x] 3.4 前端创建标签筛选组件 (TagFilter.tsx，支持AND/OR逻辑切换)
- [x] 3.5 前端创建高级搜索组件 (AdvancedSearch.tsx，带debounce搜索和排序)
- [x] 3.6 在 PromptList 中集成标签筛选和高级搜索，采用响应式布局
- [x] 3.7 更新前端API函数支持新参数 (tag_logic, sort_by, sort_order)
- [x] 3.8 更新TypeScript类型定义 (PromptFilters)
- [x] 3.9 实现搜索关键词高亮显示 (可选优化) ✅
- [x] 3.10 实现搜索历史记录 LocalStorage (可选优化) ✅

## 4. LangChain 基础设施搭建 ✅
- [x] 4.1 安装 LangChain 相关依赖 (langchain, langchain-openai) ✅
- [x] 4.2 配置环境变量 (OPENAI_API_KEY, OPENAI_API_BASE, DEFAULT_MODEL) ✅
- [x] 4.3 创建 LangChain 配置管理 (app/core/langchain_config.py) ✅
- [x] 4.4 创建自定义 CallbackHandler 记录调用历史 (app/callbacks/call_tracker.py) ✅
- [x] 4.5 测试 LangChain 基础调用 ✅

## 5. 提示词优化功能实现 (简化版) ✅
- [x] 5.1 定义优化场景枚举 (内容创作/代码生成/数据分析等) ✅
- [x] 5.2-5.4 创建优化模板和 Schema (简化实现) ✅
- [x] 5.5 实现优化 Service 层 (app/services/optimization_service.py) ✅
- [x] 5.6 实现优化 API (POST /api/prompts/{id}/optimize) ✅
- [ ] 5.7 实现优化历史记录保存 ⏸️ (后续迭代)
- [x] 5.8-5.11 创建优化按钮组件 (OptimizeButton.tsx) ✅
- [x] 5.12 封装优化 API 调用函数 (frontend/src/api/optimization.ts) ✅
- [x] 5.13 添加优化加载状态和错误处理 ✅
- [x] 5.14 实现优化 Token 消耗展示 ✅

## 6. 大模型调用记录功能 ✅
- [x] 6.1 定义 ModelCall Schema (app/schemas/model_call.py) ✅
- [x] 6.2 实现调用记录 API (GET /api/model-calls) ✅
- [x] 6.3 实现调用详情 API (GET /api/model-calls/{id}) ✅
- [x] 6.4 在 CallbackHandler 中自动记录调用 ✅
- [ ] 6.5 前端创建调用记录页面 (ModelCallHistory.tsx - 可选) ⏸️ (后续迭代)
- [ ] 6.6 在导航栏中添加调用记录入口 (可选) ⏸️ (后续迭代)

## 7. 用量限制和成本控制
- [ ] 7.1 实现用户调用频率限制 (每小时/每天)
- [ ] 7.2 创建调用配额检查中间件
- [ ] 7.3 实现成本估算功能
- [ ] 7.4 前端显示用户剩余配额
- [ ] 7.5 添加配额耗尽提示

## 8. UI/UX 优化
- [x] 8.1 设计版本历史时间线 UI ✅ (带渐变时间线、星标当前版本、视觉层级优化)
- [ ] 8.2 设计优化面板 UI (侧边栏/对话框) ⏸️ (后续迭代)
- [x] 8.3 优化标签筛选交互体验 ✅ (标签云、AND/OR切换、清除功能)
- [x] 8.4 添加搜索和筛选的快捷键支持 ✅ (已有 Ctrl+K)
- [ ] 8.5 实现优化过程的流式展示 (可选) ⏸️ (后续迭代)
- [x] 8.6 添加功能引导提示 (首次使用) ✅

## 9. 测试
- [x] 9.1 编写版本历史 API 单元测试 ✅
- [x] 9.2 编写优化 API 单元测试 ✅
- [x] 9.3 编写 LangChain 调用链测试 ✅
- [x] 9.4 编写搜索和筛选功能测试 ✅
- [ ] 9.5 编写前端组件测试 ⏸️ (后续迭代)
- [ ] 9.6 进行集成测试 (完整优化流程) ⏸️ (后续迭代)
- [ ] 9.7 性能测试 (搜索查询性能) ⏸️ (后续迭代)

## 10. 文档和部署
- [x] 10.1 更新 API 文档 (新增接口) ✅
- [x] 10.2 编写 LangChain 集成文档 ✅
- [x] 10.3 编写优化功能使用指南 ✅
- [x] 10.4 更新环境变量配置文档 ✅
- [x] 10.5 更新数据库迁移指南 ✅
- [x] 10.6 创建用户流程验证检查清单 ✅
