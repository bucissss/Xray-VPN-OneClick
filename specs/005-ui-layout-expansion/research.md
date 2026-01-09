# Technical Research: 交互界面布局扩展优化

**Feature**: 005-ui-layout-expansion
**Research Date**: 2026-01-09
**Researcher**: Claude Code

## 概述

本文档记录了针对终端布局扩展优化功能的四个关键技术决策的研究结果。研究基于当前项目架构（已使用 @inquirer/prompts、chalk、无外部 UI 库）和业界最佳实践。

---

## 1. 终端布局库选型

### Decision（推荐方案）

**不引入完整的终端 UI 库，使用自定义布局实现 + 轻量级表格库（cli-table3）**

具体方案：
- 核心布局逻辑自行实现（基于字符串拼接和计算）
- 使用 `cli-table3` 处理表格场景（用户列表、服务状态详情）
- 保持现有 `@inquirer/prompts` 用于交互式输入
- 扩展现有 `src/utils/logger.ts` 添加布局工具函数

### Rationale（选择理由）

1. **兼容性优势**
   - 现有项目已深度集成 `@inquirer/prompts`，完整 UI 库（blessed/ink）与 inquirer 存在终端状态冲突
   - 这些库服务于不同目的 - inquirer 用于顺序提示，而 blessed/ink 用于全屏交互式 TUI

2. **项目需求匹配度**
   - 项目不需要复杂的实时更新、鼠标交互或全屏 TUI
   - 核心需求是优化菜单布局、表格展示和响应式列宽
   - 当前 `src/utils/logger.ts` 已实现基础布局功能，只需扩展

3. **包大小和性能**
   - blessed: ~400KB，学习曲线陡峭，已基本不维护
   - ink: 依赖 React 生态，包体积 ~500KB+，引入 Virtual DOM 开销
   - cli-table3: 仅 ~50KB，专注表格渲染，零冲突
   - 自定义布局: 0 额外依赖，完全掌控代码

4. **维护成本**
   - 项目已有 `TerminalCapabilities` 检测系统和 `OutputMode` 管理
   - 添加布局工具函数（200-300 行代码）远比集成新库成本低

### Alternatives Considered（被拒绝的替代方案）

#### 方案 A: 使用 Ink（React for CLI）
- **缺点**: 与 inquirer 冲突，需重写所有交互逻辑，引入 React 运行时增加 ~500KB
- **拒绝原因**: 迁移成本过高，与现有架构不兼容

#### 方案 B: 使用 Blessed
- **缺点**: 原始 blessed 已不维护，与 inquirer 管理终端状态冲突，过度设计
- **拒绝原因**: 维护风险高，功能过剩

#### 方案 C: 使用 Terminal-kit
- **缺点**: 社区较小，与 inquirer 可能冲突，学习成本高
- **拒绝原因**: 社区支持不足，性价比低

### Implementation Notes

**依赖安装**:
```bash
npm install cli-table3 --save
npm install @types/cli-table3 --save-dev
```

**架构设计**:
- 新增 `src/utils/layout.ts` 存放布局计算函数
- 新增 `src/services/layout-manager.ts` 管理布局状态
- 扩展现有 `src/utils/logger.ts` 添加布局工具

**注意事项**:
- 终端能力检测优先，在窄终端（< 60 列）显示警告
- 布局计算应 < 5ms（使用缓存避免重复计算）
- 为不同宽度编写单元测试

---

## 2. 终端尺寸检测最佳实践

### Decision（推荐方案）

**使用 Node.js 内置 API（process.stdout.on('resize')）+ TTY 检测 + 降级机制**

### Rationale（选择理由）

1. **跨平台兼容性**
   - `process.stdout.columns` 和 `process.stdout.rows` 在 Node.js 18+ 所有平台均可用
   - Node.js 官方文档确认 resize 事件在宽度或高度变化时触发

2. **可靠性保证**
   - Node.js 现代版本已修复 SIGWINCH/resize 事件冲突问题
   - 无需手动监听 SIGWINCH 信号（Node.js 内部自动处理）

3. **降级方案完善**
   - 非 TTY 环境：默认 80x24
   - 缺失尺寸信息：使用标准布局模式
   - 极小终端（< 60 列）：显示警告并使用紧凑模式

### Alternatives Considered

#### 方案 A: 手动监听 SIGWINCH 信号
- **拒绝原因**: Node.js 已提供更高级的 resize 事件抽象，Windows 支持更好

#### 方案 B: 使用 term-size 第三方库
- **拒绝原因**: 非必要依赖，现有代码已覆盖

#### 方案 C: 轮询 process.stdout.columns
- **拒绝原因**: 性能差，响应延迟高

### Implementation Notes

**防止无限循环**: 缓存上次尺寸，仅在变化时处理

**Windows 特殊处理**: 需要写入才能触发 resize，在菜单渲染前主动触发检测

**最小宽度警告**: 检测到窄终端时提示用户调整

---

## 3. 多列布局实现策略

### Decision（推荐方案）

**基于列宽计算的自适应 Flexbox 映射算法**

### Rationale（选择理由）

1. **CSS Flexbox 概念映射**
   - 将 Flexbox 布局概念映射到终端字符布局
   - 支持动态列数调整和列间距

2. **字符对齐精确性**
   - 核心挑战：中文字符（2 宽度）vs 英文字符（1 宽度）
   - 解决方案：精确计算显示宽度（基于 Unicode 范围判断）

3. **动态列数调整逻辑**
   - 窄终端（< 80 列）: 1 列
   - 标准终端（80-120 列）: 1-2 列
   - 宽屏（> 120 列）: 2-3 列
   - 算法避免过度拥挤

4. **性能考虑**
   - 时间复杂度：O(n)
   - 空间复杂度：O(n)
   - 无复杂循环或递归

### Alternatives Considered

#### 方案 A: 按列填充（Column-first）
- **拒绝原因**: 用户视线需要上下跳跃，不符合阅读习惯

#### 方案 B: 使用 cli-table3 实现多列
- **拒绝原因**: cli-table3 设计用于表格，不适合纯列布局

#### 方案 C: 硬编码列宽
- **拒绝原因**: 不响应式，违反需求

### Implementation Notes

**Unicode 宽度处理**: 使用正则判断中文字符，计算准确的显示宽度

**响应式列数**: 根据终端宽度和内容数量动态调整

**对齐方式**: 支持左对齐、右对齐、居中（可选扩展）

---

## 4. 渲染性能优化

### Decision（推荐方案）

**防抖（Debounce）+ 布局缓存 + 差异化渲染（轻量级）**

### Rationale（选择理由）

1. **防抖 vs 节流选择**
   - 选择防抖：等待用户停止调整窗口 300ms 后才重新渲染
   - 窗口调整是低频操作，防抖避免中间状态渲染

2. **缓存策略**
   - 按布局模式 + 内容键缓存渲染结果
   - 仅在布局模式变化或内容更新时清空缓存
   - 预期节省 5-10ms 布局计算时间

3. **差异化渲染（轻量级）**
   - 非 Virtual DOM：按行比较字符串，仅重绘变化行
   - 适用于 resize 事件（大部分内容不变）
   - 降级：复杂度高时直接全量渲染

4. **为什么不用 Virtual DOM**
   - CLI 场景字符串操作极快（几微秒）
   - Virtual DOM 反而增加开销（对象创建、diff 算法）
   - 简单 diff 足够满足需求

### Alternatives Considered

#### 方案 A: 节流代替防抖
- **拒绝原因**: 场景不匹配，可能造成闪烁

#### 方案 B: 引入 Ink 的 Virtual DOM
- **拒绝原因**: 需要全面迁移，性价比极低

#### 方案 C: 完全不优化（全量重绘）
- **拒绝原因**: 用户体验差，违反性能要求

#### 方案 D: 使用 virtual-dom npm 包
- **拒绝原因**: 为 Web DOM 设计，API 不匹配终端场景

### Implementation Notes

**防抖延迟**: 推荐 300ms，平衡响应性和性能

**缓存使用**: 按布局模式和内容键组合缓存

**差异化渲染**: 仅在频繁更新的界面使用，避免过度优化

**性能监控**: 记录渲染时间，确保 < 500ms

---

## 总结与下一步

### 技术栈选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 终端 UI 库 | 不引入（自定义实现） | 与 inquirer 兼容，包大小小，完全掌控 |
| 表格渲染 | cli-table3 | 轻量（50KB），专注表格，零冲突 |
| 尺寸检测 | process.stdout.on('resize') | Node.js 内置，跨平台，可靠 |
| 布局算法 | 自定义 Flexbox 映射 | 响应式，精确对齐，性能高 |
| 性能优化 | 防抖 + 缓存 + 轻量 diff | 平衡性能和复杂度，避免过度设计 |

### 实施优先级

1. **Phase 1（P1 - 全屏终端空间利用）**:
   - 实现 `LayoutManager`（尺寸检测 + resize 监听）
   - 实现 `calculateLayout()`（布局模式切换）
   - 集成 cli-table3（用户列表、服务状态表格）

2. **Phase 2（P2 - 分层信息架构）**:
   - 扩展 `logger.ts`（添加分组、缩进工具函数）
   - 优化菜单分隔符和标题展示

3. **Phase 3（P3 - 多列布局）**:
   - 实现 `calculateColumnLayout()` 和 `renderColumns()`
   - 应用到宽屏菜单和仪表板

4. **Phase 4（性能优化）**:
   - 添加防抖和缓存机制
   - 可选：实现差异化渲染（如有性能问题）

### 风险控制

- **兼容性**: 在 Linux/macOS/Windows 三平台测试尺寸检测
- **性能**: 监控渲染时间，确保 < 500ms
- **降级**: 窄终端自动简化，非 TTY 使用默认布局
