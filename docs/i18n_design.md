# 国际化设计方案

## 项目分析

### 技术栈
- **前端框架**: React 18 + TypeScript
- **构建工具**: Vite
- **样式**: Tailwind CSS
- **认证**: Supabase
- **路由**: React Router v6
- **状态管理**: React Hooks (useState, useContext)
- **通知**: react-hot-toast

### 现状
- 所有文本硬编码为中文
- 无国际化框架
- 日期格式使用 `toLocaleDateString('zh-CN', ...)`
- 用户信息从 Supabase 获取，包含 email

---

## 国际化方案设计

### 1. i18n 框架选择

**选择：`i18next` + `react-i18next`**

理由：
1. React 生态系统最流行的 i18n 解决方案
2. 与 TypeScript 完美集成
3. 支持懒加载语言包
4. 丰富的插件生态（translation、interpolation、pluralization 等）
5. 与 Vite 良好集成
6. 支持命名空间（按页面/模块组织翻译）
7. 支持上下文翻译

---

### 2. 项目结构

```
frontend/src/
├── i18n/
│   ├── locales/                    # 语言包目录
│   │   ├── zh-CN.json           # 简体中文
│   │   ├── zh-TW.json           # 繁体中文
│   │   ├── en-US.json           # 美式英语
│   │   └── ja-JP.json           # 日语
│   ├── index.ts                  # i18n 配置入口
│   └── types.ts                 # 类型定义
├── components/
│   ├── LanguageSwitcher.tsx       # 语言切换组件
│   └── ...
├── hooks/
│   └── useI18n.ts               # i18n 自定义 hook（可选）
└── ...
```

---

### 3. 语言包结构

#### 方案 A：按命名空间组织（推荐）

```json
// frontend/src/i18n/locales/zh-CN.json
{
  "common": {
    "app.name": "Ink & Prompt",
    "app.tagline": "让提示词写作，像水墨晕染般自然流畅",
    "button.save": "保存",
    "button.cancel": "取消",
    "button.confirm": "确认",
    "button.delete": "删除",
    "button.edit": "编辑",
    "button.close": "关闭",
    "button.search": "搜索",
    "button.create": "创建",
    "button.loading": "加载中...",
    "toast.success": "操作成功",
    "toast.error": "操作失败",
    "toast.copied": "已复制到剪贴板"
  },

  "nav": {
    "logo.linkTitle": "返回提示词列表",
    "myPrompts": "我的提示词",
    "logout": "退出登录",
    "profile.avatar": "{email} 的首字母"
  },

  "login": {
    "title": "Ink & Prompt",
    "tagline": "让提示词，更像写作",
    "card.title.signup": "创建账户",
    "card.title.welcome": "欢迎回来",
    "button.googleLogin": "使用 Google 登录",
    "button.signIn": "登录",
    "button.signUp": "注册",
    "button.hasAccount": "已有账户？去登录",
    "button.noAccount": "没有账户？去注册",
    "label.email": "邮箱",
    "label.password": "密码",
    "placeholder.email": "your@email.com",
    "placeholder.password": "至少6个字符",
    "validation.emailRequired": "请输入邮箱",
    "validation.passwordRequired": "请输入密码",
    "validation.passwordMinLength": "密码至少需要6个字符",
    "error.loginFailed": "登录失败，请重试",
    "error.signupFailed": "注册失败，请重试",
    "error.authRequired": "请先登录",
    "success.signup": "注册成功！请检查邮箱以验证账户。",
    "success.signedIn": "登录成功",
    "success.signedUp": "注册成功",
    "footer.terms": "登录即表示您同意我们的服务条款和隐私政策",
    "footer.brand": "让提示词写作，像水墨晕染般自然流畅"
  },

  "promptList": {
    "title.all": "全部提示词",
    "title.favorites": "收藏提示词",
    "title.custom": "{folderName}",
    "subtitle.count": "共 {count} 个提示词",
    "button.newPrompt": "新建提示词",
    "search.title": "搜索和排序",
    "filter.tags": "标签",
    "filter.active": "正在筛选",
    "filter.search": "{keyword}",
    "filter.tagsCount": "· {count} 个标签",
    "filter.andLogic": "（同时包含）",
    "filter.orLogic": "（包含任一）",
    "button.clearFilters": "清除所有筛选",
    "results.found": "找到 {count} 个匹配的提示词",
    "button.previousPage": "上一页",
    "button.nextPage": "下一页",
    "pagination.current": "第 {current} / {total} 页",
    "empty.title.search": "未找到匹配的提示词",
    "empty.description.search": "尝试使用其他关键词搜索",
    "empty.title.default": "还没有提示词",
    "empty.description.default": "开始创建你的第一个提示词吧",
    "empty.action.label": "创建提示词",
    "versionBadge.title": "{count} 个历史版本",
    "date.updated": "更新于 {date}",
    "tags.showMore": "+{count}",
    "card.versionBadge": "{count} 个历史版本",
    "card.favorite.title": "收藏",
    "card.favorite.untitle": "取消收藏",
    "card.action.addToFolder": "添加到文件夹",
    "card.action.edit": "编辑",
    "card.action.delete": "删除",
    "dialog.delete.title": "确认删除",
    "dialog.delete.message": "确定要删除提示词 \"{name}\" 吗？此操作无法撤销。",
    "dialog.delete.confirm": "删除",
    "dialog.delete.cancel": "取消",
    "dialog.addToFolder.title": "添加到文件夹",
    "folder.sidebar.title.all": "全部提示词",
    "folder.sidebar.title.favorites": "收藏提示词",
    "folder.sidebar.title.custom": "我的文件夹",
    "folder.sidebar.button.new": "新建文件夹",
    "folder.dialog.create.title": "新建文件夹",
    "folder.dialog.create.name": "文件夹名称",
    "folder.dialog.create.confirm": "创建",
    "folder.dialog.create.cancel": "取消",
    "folder.dialog.rename.title": "重命名文件夹",
    "folder.dialog.rename.name": "文件夹名称",
    "folder.dialog.rename.confirm": "重命名",
    "folder.dialog.rename.cancel": "取消",
    "folder.dialog.delete.title": "删除文件夹",
    "folder.dialog.delete.message": "确定要删除文件夹 \"{name}\" 吗？",
    "folder.dialog.delete.confirm": "删除",
    "folder.dialog.delete.cancel": "取消",
    "folder.empty.default": "默认文件夹",
    "folder.count.prompts": "{count} 个提示词",
    "folder.system.all": "全部提示词",
    "folder.system.favorites": "收藏提示词"
  },

  "promptEditor": {
    "title.edit": "编辑提示词",
    "title.new": "新建提示词",
    "button.close": "关闭",
    "button.cancel": "取消",
    "button.save": "保存更改",
    "button.create": "创建提示词",
    "button.saveLoading": "保存中...",
    "button.createLoading": "创建中...",
    "label.name": "提示词名称",
    "placeholder.name": "例如：代码审查助手",
    "validation.nameRequired": "请输入提示词名称",
    "label.content": "提示词内容",
    "placeholder.content": "输入你的提示词内容...",
    "validation.contentRequired": "请输入提示词内容",
    "tokenCount.estimate": "估算值，±5% 误差",
    "tokenCount.label": "tokens",
    "button.optimize": "提示词优化",
    "label.tags": "标签",
    "placeholder.tags": "输入标签后按回车添加，支持自动补全",
    "label.changeNote": "版本更新说明 (可选)",
    "placeholder.changeNote": "例如：优化了提示词结构",
    "hint.changeNote": "如果内容有变化，将自动创建新版本",
    "toast.saved": "提示词已更新",
    "toast.created": "提示词已创建",
    "toast.optimized": "内容已更新为优化后的版本",
    "versionHistory.title": "版本历史 ({count} 个版本)",
    "versionHistory.empty": "暂无版本历史",
    "versionDetailDialog.title": "版本详情",
    "versionDetailDialog.version": "版本 {number}",
    "versionDetailDialog.createdAt": "创建时间",
    "versionDetailDialog.tokenCount": "Token 数量",
    "versionDetailDialog.content": "内容",
    "versionDetailDialog.changeNote": "更新说明",
    "versionDetailDialog.restore": "恢复到此版本",
    "button.viewVersion": "查看版本",
    "button.restoreVersion": "恢复",
    "toast.restored": "已恢复到版本 {number}"
  },

  "promptDetail": {
    "title": "提示词详情",
    "toolbar.edit": "编辑",
    "toolbar.optimize": "提示词优化",
    "toolbar.test": "提示词测试",
    "content.name": "提示词名称",
    "content.rendered": "提示词内容",
    "footer.versionSelector": "v{number}",
    "footer.versionSelectorLabel": "版本选择",
    "footer.expandHistory": "展开历史",
    "footer.diff": "对比",
    "versionHistoryDrawer.title": "历史版本",
    "versionHistoryDrawer.version": "版本 {number}",
    "versionHistoryDrawer.createdAt": "创建于 {date}",
    "versionHistoryDrawer.changeNote": "更新说明",
    "versionHistoryDrawer.rollback": "回滚",
    "versionDiffDialog.title": "版本对比",
    "versionDiffDialog.fromVersion": "对比版本",
    "versionDiffDialog.toVersion": "与版本对比",
    "versionDiffDialog.noDiff": "两个版本内容完全相同",
    "optimizePanel.title": "提示词优化",
    "optimizePanel.close": "关闭",
    "optimizePanel.historyTitle": "优化历史",
    "optimizePanel.round": "第 {roundNumber} 轮",
    "optimizePanel.userIdea": "用户想法",
    "optimizePanel.optimizedContent": "优化结果",
    "optimizePanel.suggestions": "优化建议",
    "optimizePanel.input.placeholder": "输入你的优化想法",
    "optimizePanel.button.optimize": "开始优化",
    "optimizePanel.button.optimizing": "优化中...",
    "optimizePanel.tempPreview": "临时预览内容",
    "optimizePanel.toast.roundStart": "开始第 {roundNumber} 轮优化",
    "optimizePanel.toast.versionSaved": "新版本已创建",
    "optimizePanel.toast.complete": "优化完成",
    "testPanel.title": "提示词测试",
    "testPanel.close": "关闭",
    "testPanel.modelSelector.label": "选择模型",
    "testPanel.modelSelector.add": "+",
    "testPanel.selectedModels": "已选模型",
    "testPanel.maxModelsWarning": "最多同时选择 {max} 个模型",
    "testPanel.input.placeholder": "左侧提示词将作为 System Prompt",
    "testPanel.input.label": "用户输入 (User Prompt)",
    "testPanel.button.test": "测试",
    "testPanel.button.testing": "测试中...",
    "testPanel.button.continue": "继续对话",
    "testPanel.modelOutput.title": "{modelName}",
    "testPanel.modelOutput.status.running": "进行中",
    "testPanel.modelOutput.status.completed": "已完成",
    "testPanel.modelOutput.empty": "暂无对话",
    "testPanel.toast.conversationStart": "对话已开始",
    "testPanel.toast.complete": "测试完成"
  },

  "advancedSearch": {
    "title": "搜索和排序",
    "input.placeholder": "搜索提示词...",
    "sortBy.label": "排序方式",
    "sortBy.updatedAt": "最后更新",
    "sortBy.createdAt": "创建时间",
    "sortBy.name": "名称",
    "sortBy.tokenCount": "Token 数量",
    "sortOrder.asc": "升序",
    "sortOrder.desc": "降序"
  },

  "tagFilter": {
    "title": "标签筛选",
    "input.placeholder": "输入标签名称搜索...",
    "logic.label": "筛选逻辑",
    "logic.and": "同时包含 (AND)",
    "logic.or": "包含任一 (OR)",
    "selected.none": "未选择标签"
  },

  "loading": {
    "text": "加载中..."
  },

  "emptyState": {
    "title.search": "未找到匹配的提示词",
    "description.search": "尝试使用其他关键词搜索",
    "title.default": "还没有提示词",
    "description.default": "开始创建你的第一个提示词吧",
    "action.label": "创建提示词"
  },

  "confirmDialog": {
    "title": "确认操作"
  },

  "addToFolderDialog": {
    "title": "添加到文件夹"
  },

  "featureTour": {
    "title": "欢迎来到 Ink & Prompt！",
    "subtitle": "让我们快速了解如何使用",
    "step1.title": "创建提示词",
    "step1.description": "点击新建按钮，开始创建你的第一个提示词",
    "step2.title": "管理文件夹",
    "step2.description": "使用侧边栏组织你的提示词",
    "step3.title": "搜索和筛选",
    "step3.description": "快速找到你需要的提示词",
    "step4.title": "版本管理",
    "step4.description": "查看和恢复历史版本",
    "button.skip": "跳过",
    "button.next": "下一步",
    "button.finish": "完成",
    "button.showAgain": "再次显示导览"
  }
}
```

#### 方案 B：按页面组织（备选）

```
// frontend/src/i18n/locales/zh-CN.json
{
  "common": { ... },  // 通用文本
  "login": { ... },   // 登录页面
  "promptList": { ... },  // 提示词列表
  "promptEditor": { ... },  // 编辑器
  "promptDetail": { ... },  // 详情页
  "navbar": { ... },  // 导航栏
  ...
}
```

**推荐方案 A**：更灵活，易于维护和扩展

---

### 4. i18n 配置

#### `frontend/src/i18n/index.ts`

```typescript
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import LanguageDetector from 'i18next-browser-languagedetector'

// 导入语言包
import zhCN from './locales/zh-CN.json'
import zhTW from './locales/zh-TW.json'
import enUS from './locales/en-US.json'
import jaJP from './locales/ja-JP.json'

const resources = {
  'zh-CN': { translation: zhCN },
  'zh-TW': { translation: zhTW },
  'en-US': { translation: enUS },
  'ja-JP': { translation: jaJP },
}

const i18nInstance = i18n
  .use(initReactI18next)
  .use(LanguageDetector, {
    // 只检测，不自动设置
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  })
  .init({
    resources,
    fallbackLng: 'zh-CN',  // 默认语言
    lng: localStorage.getItem('userLanguage') || 'zh-CN',  // 优先使用存储的语言
    debug: import.meta.env.DEV,

    interpolation: {
      escapeValue: false,
    },

    react: {
      useSuspense: false,  // 禁用 Suspense 以避免异步加载问题
    },
  })

export default i18nInstance
```

#### `frontend/src/i18n/types.ts`

```typescript
export type LanguageCode = 'zh-CN' | 'zh-TW' | 'en-US' | 'ja-JP'

export interface Language {
  code: LanguageCode
  name: string
  nativeName: string
  flag: string
}

export const LANGUAGES: Language[] = [
  {
    code: 'zh-CN',
    name: '简体中文',
    nativeName: '简体中文',
    flag: '🇨🇳'
  },
  {
    code: 'zh-TW',
    name: '繁体中文',
    nativeName: '繁體中文',
    flag: '🇹🇼'
  },
  {
    code: 'en-US',
    name: 'English',
    nativeName: 'English',
    flag: '🇺🇸'
  },
  {
    code: 'ja-JP',
    name: '日本語',
    nativeName: '日本語',
    flag: '🇯🇵'
  },
]

export type TranslationNamespace =
  | 'common'
  | 'nav'
  | 'login'
  | 'promptList'
  | 'promptEditor'
  | 'promptDetail'
  | 'advancedSearch'
  | 'tagFilter'
  | 'loading'
  | 'emptyState'
  | 'confirmDialog'
  | 'addToFolderDialog'
  | 'featureTour'
```

---

### 5. Hook 封装

#### `frontend/src/hooks/useI18n.ts`

```typescript
import { useTranslation, useI18next } from 'react-i18next'
import { useCallback, useMemo } from 'react'
import { LanguageCode, LANGUAGES } from '@/i18n/types'

export function useI18n(namespace?: string) {
  const { t, i18n, ready } = useTranslation(namespace)
  const { changeLanguage } = useI18next()

  // 切换语言
  const setLanguage = useCallback(
    (langCode: LanguageCode) => {
      i18n.changeLanguage(langCode)
      localStorage.setItem('userLanguage', langCode)
      // 更新 document 的 lang 属性（可访问性）
      document.documentElement.lang = langCode
    },
    [i18n]
  )

  // 获取当前语言信息
  const currentLanguage = useMemo(() => {
    const langCode = i18n.language as LanguageCode || 'zh-CN'
    return LANGUAGES.find((lang) => lang.code === langCode)
  }, [i18n.language])

  return {
    t,
    i18n,
    ready,
    setLanguage,
    currentLanguage,
    languages: LANGUAGES,
  }
}
```

---

### 6. 语言切换组件

#### `frontend/src/components/LanguageSwitcher.tsx`

```typescript
import { useI18n } from '@/hooks/useI18n'
import { LanguageCode, Language } from '@/i18n/types'

export function LanguageSwitcher({ position = 'right' }: { position?: 'left' | 'right' }) {
  const { currentLanguage, languages, setLanguage } = useI18n()

  return (
    <div className={`flex items-center gap-2 ${position === 'right' ? 'ml-auto' : ''}`}>
      {/* 当前语言 */}
      <div className="relative group">
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-ink-200 hover:border-ink-300 transition-colors"
        >
          <span className="text-lg">{currentLanguage?.flag || '🌐'}</span>
          <span className="text-sm font-medium text-ink-700">
            {currentLanguage?.name}
          </span>
          <svg className="w-4 h-4 text-ink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* 下拉菜单 */}
        <div className="absolute right-0 top-full mt-2 w-40 bg-white border border-ink-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
          <div className="py-1">
            {languages.map((lang) => (
              <button
                key={lang.code}
                onClick={() => setLanguage(lang.code)}
                className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-ink-50 transition-colors ${
                  lang.code === currentLanguage?.code ? 'bg-ink-50' : ''
                }`}
              >
                <span className="text-lg">{lang.flag}</span>
                <div className="flex-1">
                  <div className="text-sm font-medium text-ink-900">{lang.name}</div>
                  <div className="text-xs text-ink-500">{lang.nativeName}</div>
                </div>
                {lang.code === currentLanguage?.code && (
                  <svg className="w-5 h-5 text-accent-purple" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010-1.414L10 10.586 8.293 8a1 1 0 00-1.414 0l-8 8a1 1 0 000 1.414l-2.293 2.293a1 1 0 011.414 0l8 8a1 1 0 000 1.414l-2.293 2.293a1 1 0 011.414 0z" />
                  </svg>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
```

---

### 7. 组件使用示例

#### 示例 1：简单文本

```typescript
// 之前
<h1 className="text-2xl font-bold text-ink-900">
  编辑提示词
</h1>

// 之后
import { useI18n } from '@/hooks/useI18n'

export function PromptEditor() {
  const { t } = useI18n('promptEditor')

  return (
    <h1 className="text-2xl font-bold text-ink-900">
      {t('title.edit')}
    </h1>
  )
}
```

#### 示例 2：带插值的文本

```typescript
// common.json
{
  "button.deleteConfirm": "确定要删除 \"{name}\" 吗？"
}

// 使用
const { t } = useI18n('common')
const promptName = "我的提示词"
t('button.deleteConfirm', { name: promptName })
// 输出: 确定要删除 "我的提示词" 吗？
```

#### 示例 3：日期格式化

```typescript
// 之前
new Date(prompt.updated_at).toLocaleDateString('zh-CN', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})

// 之后
import { useI18n } from '@/hooks/useI18n'

const { i18n } = useI18n()
new Date(prompt.updated_at).toLocaleDateString(i18n.language, {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
})
```

#### 示例 4：Navbar 组件改造

```typescript
// Navbar.tsx
import { useI18n } from '@/hooks/useI18n'
import { LanguageSwitcher } from '@/components/LanguageSwitcher'

export function Navbar() {
  const { t } = useI18n('nav')

  return (
    <header className="...">
      <div className="...">
        <div className="flex items-center">
          <button onClick={handleLogoClick} className="...">
            <img src="/favicon.svg" alt="inkPrompt" className="..." />
            <h1 className="...">{t('app.name')}</h1>
          </button>
        </div>

        <nav className="...">
          <button onClick={() => navigate('/prompts')} className="...">
            {t('myPrompts')}
          </button>
        </nav>

        <div className="flex items-center gap-3">
          {/* 新增语言切换器 */}
          <LanguageSwitcher />

          {user && (
            <>
              <div className="...">...</div>
              <button onClick={handleLogout} className="...">
                {t('logout')}
              </button>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
```

---

### 8. App.tsx 改造

```typescript
// App.tsx
import '@/i18n'  // 必须在路由之前导入 i18n 配置

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Toaster ... />
        <Routes>
          {/* ... 路由配置保持不变 */}
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  )
}
```

---

### 9. 新增依赖

#### `frontend/package.json`

```json
{
  "dependencies": {
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0",
    "i18next-browser-languagedetector": "^7.2.0"
  },
  "devDependencies": {
    "@types/i18next": "^23.7.0"
  }
}
```

---

### 10. 实施优先级

#### Phase 1: 基础设施（高优先级）
1. 安装 i18next 相关依赖
2. 创建 i18n 目录结构和配置文件
3. 实现 useI18n hook
4. 实现 LanguageSwitcher 组件
5. 在 main.tsx 中初始化 i18n

#### Phase 2: 语言包创建（高优先级）
1. 创建 zh-CN.json（简体中文）
2. 创建 en-US.json（英语）
3. 逐步添加翻译 key（按组件逐步迁移）

#### Phase 3: 组件改造（中优先级）
1. Navbar 组件国际化
2. Login 组件国际化
3. PromptList 组件国际化
4. PromptCard 组件国际化
5. 其他组件逐步迁移

#### Phase 4: 高级功能（低优先级）
1. 多语言 SEO 优化
2. RTL 语言支持预留
3. 语言包懒加载
4. 翻译覆盖率统计

---

### 11. 注意事项

#### 命名规范
- 使用 `.` 分隔命名空间和 key：`namespace.key`
- key 使用小驼峰命名：`userName`, `button.save`
- 支持插值：`greeting: "你好, {name}!"`

#### 日期和数字格式
- 日期格式通过 i18n.language 动态适配
- 数字格式使用 `toLocaleString()`

#### 翻译缺失处理
```typescript
// i18n 配置中添加
fallbackLng: 'zh-CN',
saveMissing: ['zh-CN'],  // 将缺失的翻译保存到默认语言
```

#### 性能优化
- 使用 `react-i18next` 的 Suspense 模式实现语言包懒加载
- 语言包分离到独立文件，减少初始加载体积

#### 可访问性
- 切换语言时更新 `document.documentElement.lang`
- 语言切换器使用语义化按钮

---

## 翻译覆盖率目标

| 组件/模块 | 中文覆盖率 | 英语覆盖率 | 优先级 |
|-----------|-----------|-----------|--------|
| common (通用文本) | 100% | 100% | 高 |
| Navbar | 100% | 100% | 高 |
| Login | 100% | 100% | 高 |
| PromptList | 100% | 100% | 高 |
| PromptCard | 100% | 100% | 高 |
| PromptEditor | 100% | 100% | 高 |
| PromptDetail | 100% | 80% | 高 |
| AdvancedSearch | 100% | 80% | 中 |
| TagFilter | 100% | 80% | 中 |
| Loading | 100% | 100% | 低 |
| EmptyState | 100% | 80% | 中 |
| ConfirmDialog | 100% | 80% | 中 |
| AddToFolderDialog | 100% | 80% | 低 |
| FeatureTour | 100% | 60% | 低 |

**第一阶段目标**：优先级为"高"的模块达到 100% 中英双语覆盖率

---

## 测试计划

### 手动测试
1. 切换语言时，所有文本立即更新
2. 刷新页面后，语言设置保持
3. 插值文本正确渲染
4. 日期格式随语言正确变化
5. 缺失翻译时显示 key 或 fallback

### 自动化测试（可选）
```typescript
// 测试示例
import { renderHook, act } from '@testing-library/react'
import { useI18n } from '@/hooks/useI18n'

describe('useI18n', () => {
  it('should return translation function', () => {
    const { result } = renderHook(() => useI18n('common'))
    expect(result.current.t).toBeInstanceOf(Function)
  })

  it('should support interpolation', () => {
    const { result } = renderHook(() => useI18n('common'))
    expect(result.current.t('greeting', { name: 'John' })).toBe('你好, John!')
  })

  it('should change language', () => {
    const { result } = renderHook(() => useI18n())
    act(() => {
      result.current.setLanguage('en-US')
    })
    expect(result.current.currentLanguage?.code).toBe('en-US')
  })
})
```

---

## 后续扩展

### 新增语言支持
1. 创建新的语言文件：`fr-FR.json`, `de-DE.json` 等
2. 在 `LANGUAGES` 数组中添加语言信息
3. 翻译对应的语言包内容

### 翻译管理
1. 可选：集成本地化平台（Crowdin, Transifex）
2. 支持翻译人员在线协作
3. 自动同步翻译文件

---

## 参考资源

- [i18next 官方文档](https://www.i18next.com/)
- [react-i18next 文档](https://react.i18next.com/)
- [i18next 最佳实践](https://www.i18next.com/principles/best-practices)
