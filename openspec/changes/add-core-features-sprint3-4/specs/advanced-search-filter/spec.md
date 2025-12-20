# 高级搜索和筛选规范

## ADDED Requirements

### Requirement: 全文搜索
系统SHALL支持在提示词的标题和内容中进行全文搜索。

#### Scenario: 搜索匹配标题
- **WHEN** 用户在搜索框输入关键词
- **THEN** 系统返回所有标题包含该关键词的提示词
- **AND** 搜索不区分大小写

#### Scenario: 搜索匹配内容
- **WHEN** 用户输入的关键词不在标题中
- **THEN** 系统搜索提示词的内容字段
- **AND** 返回内容包含该关键词的提示词

#### Scenario: 搜索关键词高亮
- **WHEN** 显示搜索结果时
- **THEN** 系统在提示词卡片中高亮显示匹配的关键词
- **AND** 标题和内容预览中都进行高亮

#### Scenario: 空搜索返回全部
- **WHEN** 用户清空搜索框或搜索内容为空
- **THEN** 系统返回所有提示词列表
- **AND** 按默认排序规则显示

### Requirement: 多标签筛选
系统SHALL支持按多个标签组合筛选提示词。

#### Scenario: 单标签筛选
- **WHEN** 用户选择一个标签进行筛选
- **THEN** 系统返回包含该标签的所有提示词

#### Scenario: 多标签 AND 筛选
- **WHEN** 用户选择多个标签,并选择 AND 逻辑
- **THEN** 系统返回同时包含所有选中标签的提示词

#### Scenario: 多标签 OR 筛选
- **WHEN** 用户选择多个标签,并选择 OR 逻辑
- **THEN** 系统返回包含任意一个选中标签的提示词

#### Scenario: 标签筛选状态显示
- **WHEN** 用户选择标签筛选后
- **THEN** 系统在 UI 中明确显示当前激活的筛选标签
- **AND** 提供快速清除筛选的按钮

### Requirement: 搜索和筛选组合
系统SHALL支持搜索和标签筛选同时使用。

#### Scenario: 组合搜索和标签
- **WHEN** 用户同时输入搜索关键词和选择标签筛选
- **THEN** 系统返回同时满足搜索条件和标签条件的提示词
- **AND** 搜索和筛选条件使用 AND 逻辑组合

#### Scenario: 清除单个条件
- **WHEN** 用户清除搜索关键词但保留标签筛选
- **THEN** 系统仅按标签筛选显示结果
- **AND** 反之亦然

### Requirement: 搜索结果排序
系统SHALL支持多种排序方式帮助用户快速找到需要的提示词。

#### Scenario: 按相关度排序
- **WHEN** 用户进行搜索操作时
- **THEN** 系统默认按相关度排序结果
- **AND** 标题完全匹配的结果排在前面
- **AND** 内容匹配的结果排在后面

#### Scenario: 按更新时间排序
- **WHEN** 用户选择按时间排序
- **THEN** 系统按 updated_at 降序排序(最新更新的在前)

#### Scenario: 按 Token 数排序
- **WHEN** 用户选择按 Token 数排序
- **THEN** 系统按 token_count 字段排序
- **AND** 支持升序和降序切换

#### Scenario: 按名称排序
- **WHEN** 用户选择按名称排序
- **THEN** 系统按 name 字段字母顺序排序

### Requirement: 搜索性能优化
系统SHALL保证搜索和筛选操作的响应速度。

#### Scenario: 数据库索引优化
- **WHEN** 执行搜索查询时
- **THEN** 系统使用 prompts 表的 name 和 content 字段索引
- **AND** 搜索响应时间应在 500ms 以内(1000 条提示词以内)

#### Scenario: 分页加载
- **WHEN** 搜索结果超过分页大小(默认 50 条)
- **THEN** 系统仅返回当前页的结果
- **AND** 提供分页导航

### Requirement: 搜索历史记录
系统SHALL保存用户的搜索历史,提升检索效率。

#### Scenario: 保存搜索历史
- **WHEN** 用户执行搜索操作
- **THEN** 系统将搜索关键词保存到 LocalStorage
- **AND** 最多保存最近 10 条搜索记录

#### Scenario: 搜索建议
- **WHEN** 用户聚焦搜索框时
- **THEN** 系统显示最近的搜索历史下拉列表
- **AND** 用户可以点击快速填充搜索框

#### Scenario: 清除搜索历史
- **WHEN** 用户点击"清除历史"按钮
- **THEN** 系统清空 LocalStorage 中的搜索记录

### Requirement: API 接口定义
系统SHALL通过查询参数支持搜索和筛选功能。

#### Scenario: 搜索查询参数
- **WHEN** 客户端发送 GET /api/prompts?search={keyword} 请求
- **THEN** 系统返回标题或内容包含关键词的提示词列表

#### Scenario: 标签筛选参数
- **WHEN** 客户端发送 GET /api/prompts?tags={tag1,tag2}&tag_logic={and|or} 请求
- **THEN** 系统按指定逻辑筛选包含指定标签的提示词
- **AND** tag_logic 默认为 "and"

#### Scenario: 排序参数
- **WHEN** 客户端发送 GET /api/prompts?sort_by={field}&order={asc|desc} 请求
- **THEN** 系统按指定字段和顺序排序结果
- **AND** sort_by 支持 relevance, updated_at, token_count, name
- **AND** order 默认为 desc

#### Scenario: 组合查询
- **WHEN** 客户端发送包含多个查询参数的请求
- **THEN** 系统应用所有筛选条件并返回结果
- **AND** 保持向后兼容,未提供的参数使用默认值
