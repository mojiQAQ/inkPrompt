# 前端测试文档

## 📋 测试概述

本项目采用多层次测试策略，确保前端功能的正确性和稳定性。

### 测试金字塔

```
        /\
       /  \      E2E 测试 (Playwright)
      /----\     - 真实浏览器环境
     /      \    - 完整用户流程
    /--------\
   /          \  单元测试 (Vitest + Testing Library)
  /------------\ - 组件隔离测试
 /   Foundation \ - API 模拟
```

## 🛠️ 测试技术栈

### 单元测试
- **Vitest** - 现代化的测试框架（兼容 Vite）
- **@testing-library/react** - React 组件测试库
- **@testing-library/jest-dom** - DOM 匹配器
- **@testing-library/user-event** - 用户交互模拟

### E2E 测试
- **Playwright** - 跨浏览器端到端测试框架
- 支持 Chromium, Firefox, WebKit
- 支持移动设备模拟

## 📁 项目结构

```
frontend/
├── src/
│   ├── components/
│   │   └── __tests__/           # 组件单元测试
│   │       └── OptimizeButton.test.tsx
│   └── test/
│       ├── setup.ts              # 测试环境配置
│       └── test-utils.tsx        # 测试工具函数
├── e2e/                          # E2E 测试
│   └── optimize-button.spec.ts
├── vitest.config.ts              # Vitest 配置
└── playwright.config.ts          # Playwright 配置
```

## 🚀 运行测试

### 单元测试

```bash
# 运行所有单元测试（watch 模式）
npm run test

# 运行一次所有测试
npm run test:run

# 运行测试并生成覆盖率报告
npm run test:coverage

# 运行测试 UI（可视化界面）
npm run test:ui
```

### E2E 测试

```bash
# 运行所有 E2E 测试
npm run test:e2e

# 运行 E2E 测试（UI 模式）
npm run test:e2e:ui

# 调试模式运行 E2E 测试
npm run test:e2e:debug

# 查看测试报告
npm run test:e2e:report
```

## 📝 已实现的测试

### OptimizeButton 组件测试

#### 单元测试 (`OptimizeButton.test.tsx`)

**测试覆盖**：50+ 测试用例

##### 1. 按钮渲染测试
- ✅ 渲染优化按钮
- ✅ 显示闪电图标
- ✅ 正确的样式类名
- ✅ 正确的文本内容

##### 2. 下拉菜单测试
- ✅ 初始状态不显示下拉菜单
- ✅ 点击按钮显示下拉菜单
- ✅ 显示所有 5 个优化场景
- ✅ 显示场景标签和图标
- ✅ 点击外部关闭下拉菜单
- ✅ 多次点击按钮切换菜单状态

##### 3. 优化流程测试
- ✅ 选择场景时调用 API
- ✅ 调用 onOptimized 回调
- ✅ 显示成功 Toast 提示
- ✅ 选择场景后关闭下拉菜单
- ✅ 所有场景类型都能正常工作

##### 4. 加载状态测试
- ✅ 优化期间显示加载状态
- ✅ 优化期间禁用按钮
- ✅ 优化期间不显示下拉菜单
- ✅ 完成后恢复正常状态

##### 5. 错误处理测试
- ✅ API 失败时显示错误 Toast
- ✅ 错误时不调用 onOptimized
- ✅ 错误后重置加载状态

##### 6. 所有场景测试
- ✅ 通用优化
- ✅ 内容创作
- ✅ 代码生成
- ✅ 数据分析
- ✅ 对话交互

**测试示例**：

```typescript
it('should show dropdown menu when button is clicked', async () => {
  render(<OptimizeButton promptId={mockPromptId} onOptimized={mockOnOptimized} />)

  const button = screen.getByTestId('optimize-button')
  fireEvent.click(button)

  await waitFor(() => {
    const dropdown = screen.getByTestId('optimize-dropdown-menu')
    expect(dropdown).toBeInTheDocument()
  })
})
```

#### E2E 测试 (`optimize-button.spec.ts`)

**测试覆盖**：20+ 测试场景

##### 1. 下拉菜单交互
- ✅ 显示优化按钮
- ✅ 点击后显示下拉菜单
- ✅ 显示所有 5 个场景
- ✅ 显示场景标签和图标
- ✅ 点击外部关闭菜单
- ✅ 多次点击切换菜单

##### 2. 优化流程
- ✅ 选择场景后关闭下拉菜单
- ✅ 优化期间显示加载状态
- ✅ 成功后显示 Toast 通知
- ✅ 更新内容到编辑器
- ✅ 处理 API 错误
- ✅ 所有场景类型工作正常

##### 3. 视觉回归测试
- ✅ 按钮截图对比
- ✅ 下拉菜单截图对比

##### 4. 可访问性测试
- ✅ 键盘访问（Tab, Enter, Escape）
- ✅ ARIA 标签

**测试示例**：

```typescript
test('should show dropdown menu when clicked', async ({ page }) => {
  const button = page.getByTestId('optimize-button')

  // Initially hidden
  await expect(page.getByTestId('optimize-dropdown-menu')).not.toBeVisible()

  // Click the button
  await button.click()

  // Now visible
  await expect(page.getByTestId('optimize-dropdown-menu')).toBeVisible()
})
```

## 🧪 测试最佳实践

### 单元测试

#### 1. 使用 AAA 模式
```typescript
it('should do something', () => {
  // Arrange - 准备
  const props = { id: 'test' }

  // Act - 执行
  render(<Component {...props} />)

  // Assert - 断言
  expect(screen.getByText('Test')).toBeInTheDocument()
})
```

#### 2. 使用 data-testid
```tsx
// 组件中
<button data-testid="optimize-button">AI 优化</button>

// 测试中
const button = screen.getByTestId('optimize-button')
```

#### 3. 模拟 API 调用
```typescript
vi.mock('@/api/optimization', () => ({
  optimizePrompt: vi.fn(),
}))

vi.mocked(optimizationApi.optimizePrompt).mockResolvedValue({
  optimized_content: 'Optimized',
  token_count: 100,
  estimated_cost: 0.001,
})
```

#### 4. 等待异步更新
```typescript
await waitFor(() => {
  expect(screen.getByText('Success')).toBeInTheDocument()
})
```

### E2E 测试

#### 1. 使用页面对象模式（可选）
```typescript
class OptimizeButtonPage {
  constructor(private page: Page) {}

  async clickButton() {
    await this.page.getByTestId('optimize-button').click()
  }

  async selectScenario(scenario: string) {
    await this.page.getByTestId(`optimize-scenario-${scenario}`).click()
  }
}
```

#### 2. 模拟 API 响应
```typescript
await page.route('**/api/prompts/*/optimize', async (route) => {
  await route.fulfill({
    status: 200,
    body: JSON.stringify({ optimized_content: 'Test' }),
  })
})
```

#### 3. 等待元素可见
```typescript
await expect(page.getByTestId('dropdown-menu')).toBeVisible()
```

#### 4. 使用超时
```typescript
await expect(button).toBeEnabled({ timeout: 5000 })
```

## 📊 测试覆盖率目标

| 类型 | 目标覆盖率 | 当前状态 |
|------|-----------|----------|
| 单元测试 - 语句覆盖 | > 80% | 🟡 进行中 |
| 单元测试 - 分支覆盖 | > 75% | 🟡 进行中 |
| E2E 测试 - 关键流程 | 100% | ✅ 已完成 (OptimizeButton) |

## 🔍 调试测试

### Vitest 调试

#### 1. 使用测试 UI
```bash
npm run test:ui
```
打开浏览器界面，可视化查看测试结果。

#### 2. 使用 console.log
```typescript
it('should debug', () => {
  const { container } = render(<Component />)
  console.log(container.innerHTML)
})
```

#### 3. 使用 screen.debug()
```typescript
import { screen } from '@testing-library/react'

it('should debug', () => {
  render(<Component />)
  screen.debug() // 打印 DOM 结构
})
```

### Playwright 调试

#### 1. 调试模式
```bash
npm run test:e2e:debug
```

#### 2. 查看报告
```bash
npm run test:e2e:report
```

#### 3. 使用 page.pause()
```typescript
test('should debug', async ({ page }) => {
  await page.goto('/')
  await page.pause() // 暂停，打开 Inspector
})
```

## 🎯 添加新测试

### 添加单元测试

1. 在 `src/components/__tests__/` 创建测试文件
2. 使用命名约定：`ComponentName.test.tsx`
3. 导入测试工具：
```typescript
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@/test/test-utils'
```

4. 编写测试：
```typescript
describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />)
    expect(screen.getByText('Hello')).toBeInTheDocument()
  })
})
```

### 添加 E2E 测试

1. 在 `e2e/` 目录创建测试文件
2. 使用命名约定：`feature-name.spec.ts`
3. 导入 Playwright：
```typescript
import { test, expect } from '@playwright/test'
```

4. 编写测试：
```typescript
test('should do something', async ({ page }) => {
  await page.goto('/path')
  await expect(page.getByText('Hello')).toBeVisible()
})
```

## 🐛 常见问题

### 1. 测试超时

**问题**：测试运行超时
```
Error: Test timeout of 5000ms exceeded
```

**解决方案**：增加超时时间
```typescript
test('slow test', async () => {
  // Vitest
  // 在 test() 中不支持 timeout
  // 在 waitFor 中设置
  await waitFor(() => {
    expect(element).toBeInTheDocument()
  }, { timeout: 10000 })
})

test('slow e2e test', async ({ page }) => {
  // Playwright
  await expect(element).toBeVisible({ timeout: 10000 })
})
```

### 2. 无法找到元素

**问题**：`Unable to find element`

**解决方案**：
- 检查元素是否真的存在
- 使用 `screen.debug()` 查看 DOM
- 等待异步渲染完成
- 检查选择器是否正确

### 3. Portal 元素不在 document.body

**问题**：使用 Portal 渲染的元素找不到

**解决方案**：确保在 cleanup 中清理 Portal
```typescript
afterEach(() => {
  cleanup()
})
```

### 4. Mock 不生效

**问题**：Mock 的函数没有被调用

**解决方案**：
- 确保 mock 在 render 之前设置
- 使用 `vi.mocked()` 获取类型安全的 mock
- 检查 mock 的路径是否正确

## 📚 参考资源

### 文档
- [Vitest 文档](https://vitest.dev/)
- [Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 文档](https://playwright.dev/)
- [Jest DOM 匹配器](https://github.com/testing-library/jest-dom)

### 教程
- [React Testing Library 教程](https://testing-library.com/docs/react-testing-library/example-intro)
- [Playwright 入门](https://playwright.dev/docs/intro)
- [测试最佳实践](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## 🎉 下一步

### 待添加测试
- [ ] VersionList 组件测试
- [ ] VersionDetailDialog 组件测试
- [ ] TagInput 组件测试
- [ ] TagFilter 组件测试
- [ ] AdvancedSearch 组件测试
- [ ] PromptCard 组件测试
- [ ] PromptList 页面测试
- [ ] PromptEditor 页面测试

### 测试增强
- [ ] 添加集成测试
- [ ] 添加性能测试
- [ ] 添加视觉回归测试
- [ ] 添加 API 契约测试
- [ ] 设置 CI/CD 测试流程
- [ ] 添加测试覆盖率徽章

## ✅ 总结

目前已完成：
- ✅ 测试框架搭建（Vitest + Playwright）
- ✅ 测试工具函数和 Helpers
- ✅ OptimizeButton 组件完整测试（50+ 单元测试 + 20+ E2E 测试）
- ✅ 测试文档和最佳实践指南

下一步重点：
1. 为其他核心组件添加测试
2. 提高测试覆盖率到 80%+
3. 集成到 CI/CD 流程

---

**最后更新**：2025-12-10
**维护者**：InkPrompt 开发团队
