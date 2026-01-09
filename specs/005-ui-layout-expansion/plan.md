# Implementation Plan: 交互界面布局扩展优化

**Branch**: `005-ui-layout-expansion` | **Date**: 2026-01-09 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-ui-layout-expansion/spec.md`

## Summary

优化 CLI 交互界面的终端空间利用率和信息展示布局。通过动态检测终端尺寸、实现响应式布局和多列展示，充分利用可用屏幕空间，提升用户体验和操作效率。核心目标是在标准终端（80x24）中实现首屏完整显示，在宽屏终端（120+列）中达到 85% 以上的空间利用率。

## Technical Context

**Language/Version**: TypeScript 5.9+ / Node.js 18+
**Primary Dependencies**: @inquirer/prompts（已有）, chalk（已有）, 终端布局库（待研究）
**Storage**: N/A（无数据存储需求）
**Testing**: Vitest 4.0（已有测试框架）
**Target Platform**: Linux / macOS / Windows（跨平台 CLI）
**Project Type**: Single（CLI 工具）
**Performance Goals**: 窗口调整后 500ms 内完成重新布局；布局计算开销 < 10ms
**Constraints**: 必须兼容窄终端（最小 60 列）；无特殊终端特性依赖；字符模式渲染
**Scale/Scope**: ~10 个不同界面场景；3 种布局模式；影响所有交互式菜单组件

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

根据 `.specify/memory/constitution.md` 检查以下核心原则：

### I. 安全第一
- [x] 密钥/UUID 是否自动生成（禁止硬编码）- N/A（本功能不涉及密钥生成）
- [x] 敏感信息是否正确处理（不记录到日志）- N/A（不处理敏感信息）
- [x] 配置文件权限是否正确（600）- N/A（不修改配置文件权限）
- [x] 用户输入是否经过验证和清理 - N/A（不处理新的用户输入，仅布局调整）

### II. 简洁易用
- [x] 默认配置是否满足大多数用户需求 - 是，自动检测终端尺寸并选择最佳布局
- [x] 是否实现一键部署 - N/A（功能升级，不涉及部署流程）
- [x] 错误提示是否清晰（中英文双语）- 是，利用现有 i18n 系统
- [x] 是否避免不必要的复杂度 - 是，使用简单的布局模式切换逻辑

### III. 可靠稳定
- [x] 是否包含错误检测和友好提示 - 是，检测极小终端并提示用户调整窗口
- [x] 是否支持配置备份和恢复 - N/A（不修改用户配置）
- [x] 是否支持主流 Linux 发行版 - 是，跨平台终端 API
- [x] 网络操作是否有超时重试机制 - N/A（无网络操作）

### IV. 测试优先（强制性）
- [x] 是否先编写测试用例 - 是，为不同终端尺寸编写布局测试
- [x] 测试是否覆盖关键路径 - 是，测试尺寸检测、布局切换、边界条件
- [x] 是否包含集成测试 - 是，测试实际菜单渲染在不同终端尺寸下的表现
- [x] 安全功能测试优先级是否最高 - N/A（非安全功能）

### V. 文档完整
- [x] 是否更新 README - 是，添加最佳终端尺寸建议
- [x] 脚本是否有清晰注释 - 是，布局逻辑和决策注释
- [x] 配置文件是否有参数说明 - N/A（无新配置项）
- [x] 中英文文档是否同步 - 是，利用现有 i18n

**违规说明**（如有）：
| 违规项 | 必要性说明 | 被拒绝的简化方案及原因 |
|--------|-----------|---------------------|
| 无 | - | - |

## Project Structure

### Documentation (this feature)

```text
specs/005-ui-layout-expansion/
├── spec.md              # Feature specification
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output: 布局库选型、最佳实践
├── data-model.md        # Phase 1 output: TerminalLayout、ContentRegion 实体
├── quickstart.md        # Phase 1 output: 开发者快速上手指南
├── contracts/           # Phase 1 output: 布局 API 接口定义
└── checklists/          # Quality checklists
    └── requirements.md  # Specification quality checklist
```

### Source Code (repository root)

```text
src/
├── types/
│   ├── terminal.ts         # 已有：终端能力检测
│   └── layout.ts           # 新增：布局类型定义
├── utils/
│   ├── logger.ts           # 已有：输出模式管理
│   └── layout.ts           # 新增：布局计算工具
├── services/
│   └── layout-manager.ts   # 新增：布局管理服务
├── commands/
│   ├── interactive.ts      # 修改：集成响应式布局
│   ├── service.ts          # 修改：优化状态显示布局
│   ├── user.ts             # 修改：优化用户列表布局
│   └── logs.ts             # 修改：优化日志查看布局
├── constants/
│   └── ui-symbols.ts       # 已有：UI 符号常量
└── config/
    └── i18n.ts             # 已有：国际化支持

tests/
├── unit/
│   ├── utils/
│   │   └── layout.test.ts           # 新增：布局计算单元测试
│   └── services/
│       └── layout-manager.test.ts   # 新增：布局管理器测试
└── integration/
    ├── ui-layout.test.ts             # 新增：不同尺寸布局集成测试
    └── responsive-menu.test.ts       # 新增：响应式菜单测试
```

**Structure Decision**: 采用现有的单项目结构（Option 1）。新增布局相关模块遵循现有项目组织方式：types 存放类型定义，utils 存放纯函数工具，services 存放状态管理逻辑，commands 集成使用布局功能。测试文件镜像源码结构。

## Complexity Tracking

无需填写 - 所有 Constitution Check 项目均通过，无违规需要说明。

## Phase 0: Research & Technical Decisions

### Research Tasks

以下技术决策需要研究：

1. **终端布局库选型**
   - **问题**: 是否使用现有的终端 UI 库（如 blessed、ink、terminal-kit）还是自己实现布局逻辑？
   - **研究重点**:
     - 库的学习曲线和集成复杂度
     - 是否与现有 @inquirer/prompts 兼容
     - 包大小和性能影响
     - 是否支持响应式布局

2. **终端尺寸检测最佳实践**
   - **问题**: 如何可靠地检测和监听终端尺寸变化？
   - **研究重点**:
     - process.stdout.columns/rows 的跨平台兼容性
     - SIGWINCH 信号监听的可靠性
     - 不支持动态检测时的降级方案

3. **多列布局实现策略**
   - **问题**: 如何实现自适应多列布局且不依赖复杂的 UI 库？
   - **研究重点**:
     - CSS Flexbox 概念在终端中的映射
     - 字符对齐和间距计算
     - 动态列数调整算法

4. **渲染性能优化**
   - **问题**: 如何避免重新渲染时的闪烁和延迟？
   - **研究重点**:
     - Virtual DOM 概念在终端的应用
     - 差异化渲染技术
     - 防抖/节流策略

### Research Output Location

所有研究结果将合并到 `research.md`，包括：
- 每个决策点的最终选择
- 选择理由和权衡分析
- 被拒绝的替代方案及原因
- 实施建议和注意事项

## Phase 1: Design & API Contracts

### Data Model

基于 spec.md 中的 Key Entities，设计以下数据结构（详见 `data-model.md`）：

**核心实体**:
- `TerminalLayout`: 终端布局配置（width、height、mode、columns）
- `ContentRegion`: 内容区域定义（type、position、size、padding）
- `LayoutMode`: 布局模式枚举（compact、standard、wide）

**关系**:
- TerminalLayout 包含多个 ContentRegion
- 每个 ContentRegion 有明确的类型（header、menu、content、footer）

### API Contracts

创建以下接口定义（输出到 `/contracts/`）：

1. **Layout Manager API** (`contracts/layout-manager.ts`)
   - `detectTerminalSize(): { width: number; height: number }`
   - `calculateLayoutMode(width: number): LayoutMode`
   - `createLayout(mode: LayoutMode, content: ContentRegion[]): TerminalLayout`
   - `onResize(callback: (layout: TerminalLayout) => void): void`

2. **Content Rendering API** (`contracts/content-renderer.ts`)
   - `renderMenu(items: MenuItem[], layout: TerminalLayout): string`
   - `renderColumns(data: any[][], layout: TerminalLayout): string`
   - `renderSection(title: string, content: string, region: ContentRegion): string`

### Quickstart Guide

创建 `quickstart.md` 包含：
- 为开发者提供 5 分钟快速上手指南
- 如何使用新的布局 API
- 常见布局场景示例代码
- 调试技巧（如何模拟不同终端尺寸）

## Next Steps

**Phase 2 - Task Generation** (`/speckit.tasks` command):
1. 创建详细任务列表，按用户故事优先级组织
2. 每个任务包含：测试用例 → 实现 → 文档更新
3. 任务应可独立执行和验证

**Implementation Phases**:
- Phase 2.1: P1 - 全屏终端空间利用（核心功能）
- Phase 2.2: P2 - 分层信息架构展示（增强可读性）
- Phase 2.3: P3 - 多列布局支持（宽屏优化）

## Risk Mitigation

基于 spec.md 中的风险识别：

| 风险 | 缓解计划 |
|------|---------|
| 终端尺寸检测不一致 | 在 research.md 中评估多种检测方案；提供手动配置选项 |
| 布局逻辑维护成本高 | 使用清晰的布局抽象层；编写完整单元测试；代码注释详细 |
| 宽屏布局降低可读性 | 用户测试验证；提供配置项允许关闭宽屏优化 |
| 窗口调整时闪烁 | 使用防抖技术；缓存布局计算结果 |
| 极窄终端不可用 | 提供最小宽度检测和友好错误消息 |
