# InkPrompt 测试文档

> 项目级测试概览。前端详细测试指南请参阅 [frontend/TESTING.md](../frontend/TESTING.md)。

## 测试框架

| 层 | 框架 | 配置文件 |
|----|------|---------|
| 前端单元测试 | Vitest + @testing-library/react | `frontend/vitest.config.ts` |
| 前端 E2E | Playwright | `frontend/playwright.config.ts` |
| 后端单元测试 | Pytest | `backend/pytest.ini` |

## 测试统计

```
前端单元测试:  46 个 (2 个文件)  ✅ 全部通过
前端 E2E:     20+ 个场景 (2 个文件)
后端单元测试:  60+ 个 (4 个文件)   ✅ 全部通过
───────────────────────────────────
总计:         125+ 个测试
```

## 前端测试覆盖

### 单元测试

| 组件 | 测试数 | 覆盖内容 |
|------|-------|---------|
| `OptimizeButton` | 24 | 渲染、下拉菜单交互、5 种场景、加载状态、错误处理 |
| `PromptCard` | 22 | 渲染、版本徽章、标签显示、用户交互、搜索高亮、边缘情况 |

### E2E 测试

| 文件 | 场景数 | 覆盖内容 |
|------|-------|---------|
| `optimize-button.spec.ts` | ~10 | 下拉菜单、优化流程、视觉回归、可访问性 |
| `prompt-crud.spec.ts` | 20+ | CRUD 完整流程、搜索筛选、响应式设计 |

### 待补充

- [ ] TagInput 组件测试
- [ ] TagFilter 组件测试
- [ ] VersionList 组件测试
- [ ] ConfirmDialog 组件测试

## 后端测试覆盖

| 文件 | 测试数 | 覆盖内容 |
|------|-------|---------|
| `test_versions_api.py` | 15+ | 版本历史 API |
| `test_optimization_api.py` | 12+ | 优化 API |
| `test_langchain.py` | 15+ | LangChain 集成 |
| `test_search_filter.py` | 20+ | 搜索筛选 |

**测试 fixtures**: `test_db` (SQLite in-memory), `test_user`, `test_prompt`

## 运行测试

```bash
# 前端
cd frontend
npm run test          # Watch 模式
npm run test:run      # 运行一次
npm run test:coverage # 覆盖率报告
npm run test:e2e      # E2E 测试

# 后端
cd backend
source venv/bin/activate
pytest                # 运行所有测试
pytest -v             # 详细输出
```

## 测试工具

**文件**: `frontend/src/test/test-utils.tsx`

提供：
- `render()` — 自定义渲染 (含 Router + Auth Provider)
- `createMockPrompt()` / `createMockVersion()` / `createMockTag()` — Mock 数据
- `mockOptimizeResponse` — Mock API 响应
- `mockGetAccessToken()` — Mock 认证

## 已修复的测试相关 Bug

1. **OptimizeButton 表单提交** — 按钮缺少 `type="button"`，触发表单提交导致 state 重置
2. **Vitest 配置冲突** — 需排除 `e2e/` 目录避免运行 Playwright 文件
3. **PromptCard 高亮测试** — 需用 `querySelector('mark')` 而非纯文本匹配

---

*整合自原始文档: FRONTEND_TESTING_COMPLETE_REPORT.md, FRONTEND_TESTING_SUMMARY.md*
