## Why

前端当前所有用户可见文案都硬编码为中文，日期格式也固定为 `zh-CN`，这让产品无法支持英文等多语言用户，也阻碍后续扩展更多地区语言。

## What Changes

- 引入 `i18next` 与 `react-i18next` 作为前端国际化基础设施
- 为前端关键页面和核心组件接入翻译能力与语言切换入口
- 将日期与时间格式改为基于当前语言动态格式化
- 为测试环境补充 i18n 初始化，避免组件测试回归

## Impact

- Affected specs: `frontend-i18n`
- Affected code: `frontend/src/main.tsx`, `frontend/src/i18n/**`, `frontend/src/hooks/**`, `frontend/src/pages/**`, `frontend/src/components/**`, `frontend/src/test/**`
