# Data Model: 交互界面布局扩展优化

**Feature**: 005-ui-layout-expansion
**Created**: 2026-01-09
**Related**: [spec.md](./spec.md) | [plan.md](./plan.md)

## Overview

本文档定义终端布局系统的核心数据实体、类型定义、验证规则和关系。所有类型定义将实现在 `src/types/layout.ts` 中。

---

## Core Entities

### 1. LayoutMode (Enum)

布局模式枚举，定义不同终端尺寸下的布局策略。

**TypeScript Definition**:
```typescript
export enum LayoutMode {
  COMPACT = 'compact',   // < 80 列
  STANDARD = 'standard', // 80-120 列
  WIDE = 'wide'          // > 120 列
}
```

**Mapping Rules** (from FR-003):
- `width < 80` → `LayoutMode.COMPACT`
- `80 ≤ width ≤ 120` → `LayoutMode.STANDARD`
- `width > 120` → `LayoutMode.WIDE`

**Usage**:
```typescript
const mode = width < 80 ? LayoutMode.COMPACT :
             width > 120 ? LayoutMode.WIDE :
             LayoutMode.STANDARD;
```

---

### 2. ContentRegionType (Enum)

内容区域类型枚举，定义界面中不同功能区域的分类。

**TypeScript Definition**:
```typescript
export enum ContentRegionType {
  HEADER = 'header',     // 页面标题区
  MENU = 'menu',         // 菜单选项区
  STATUS = 'status',     // 状态信息区
  CONTENT = 'content',   // 主内容区
  FOOTER = 'footer'      // 底部提示区
}
```

**Layout Order** (top to bottom):
1. `HEADER` - 页面标题和导航信息
2. `STATUS` - 服务状态、系统概览
3. `MENU` - 操作菜单选项
4. `CONTENT` - 动态内容（列表、详情等）
5. `FOOTER` - 操作提示、快捷键说明

---

### 3. ContentRegion (Interface)

表示界面中的内容区域，包括类型、位置、尺寸和填充。

**TypeScript Definition**:
```typescript
export interface ContentRegion {
  /**
   * 区域唯一标识符
   */
  id: string;

  /**
   * 区域类型
   */
  type: ContentRegionType;

  /**
   * 区域位置（行偏移量，从 0 开始）
   */
  position: {
    row: number;
    column: number;
  };

  /**
   * 区域尺寸
   */
  size: {
    width: number;
    height: number;
  };

  /**
   * 内边距（字符数）
   */
  padding: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };

  /**
   * 是否显示边框
   */
  showBorder: boolean;

  /**
   * 内容数据（任意类型，由渲染器解析）
   */
  content?: unknown;
}
```

**Validation Rules**:
- `id`: 必须唯一，建议格式 `${type}-${index}`
- `position.row`: 必须 ≥ 0 且 < 终端高度
- `position.column`: 必须 ≥ 0 且 < 终端宽度
- `size.width`: 必须 > 0 且 ≤ (终端宽度 - position.column)
- `size.height`: 必须 > 0 且 ≤ (终端高度 - position.row)
- `padding.*`: 必须 ≥ 0，且 `padding.left + padding.right < size.width`

**Example**:
```typescript
const headerRegion: ContentRegion = {
  id: 'header-0',
  type: ContentRegionType.HEADER,
  position: { row: 0, column: 0 },
  size: { width: 80, height: 3 },
  padding: { top: 1, right: 2, bottom: 1, left: 2 },
  showBorder: false,
  content: { title: 'Xray VPN Manager', subtitle: 'v1.1.1' }
};
```

---

### 4. TerminalLayout (Interface)

表示当前终端的布局配置，包括尺寸、模式和包含的内容区域。

**TypeScript Definition**:
```typescript
export interface TerminalLayout {
  /**
   * 终端宽度（列数）
   */
  width: number;

  /**
   * 终端高度（行数）
   */
  height: number;

  /**
   * 布局模式
   */
  mode: LayoutMode;

  /**
   * 多列布局的列数（仅在 WIDE 模式下 > 1）
   */
  columns: number;

  /**
   * 包含的内容区域列表
   */
  regions: ContentRegion[];

  /**
   * 布局计算时间戳（用于缓存失效）
   */
  timestamp: number;
}
```

**Validation Rules**:
- `width`: 必须 ≥ 60（最小可用宽度，from FR-009）
- `height`: 必须 ≥ 20（最小可用高度）
- `mode`: 必须与 width 匹配（见 LayoutMode Mapping Rules）
- `columns`:
  - `mode === COMPACT` → `columns === 1`
  - `mode === STANDARD` → `columns === 1`
  - `mode === WIDE` → `columns ∈ [2, 3]`（from AS-005）
- `regions`: 不能为空，至少包含一个区域
- `timestamp`: 必须是有效的 Unix 时间戳（毫秒）

**Default Values**:
```typescript
export const DEFAULT_LAYOUT: TerminalLayout = {
  width: 80,
  height: 24,
  mode: LayoutMode.STANDARD,
  columns: 1,
  regions: [],
  timestamp: 0
};
```

**Example**:
```typescript
const layout: TerminalLayout = {
  width: 120,
  height: 40,
  mode: LayoutMode.WIDE,
  columns: 2,
  regions: [
    {
      id: 'header-0',
      type: ContentRegionType.HEADER,
      position: { row: 0, column: 0 },
      size: { width: 120, height: 3 },
      padding: { top: 1, right: 2, bottom: 1, left: 2 },
      showBorder: false
    },
    {
      id: 'status-0',
      type: ContentRegionType.STATUS,
      position: { row: 3, column: 0 },
      size: { width: 58, height: 10 },
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      showBorder: true
    },
    {
      id: 'status-1',
      type: ContentRegionType.STATUS,
      position: { row: 3, column: 60 },
      size: { width: 58, height: 10 },
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      showBorder: true
    }
  ],
  timestamp: Date.now()
};
```

---

## Relationships

### Entity Relationship Diagram

```
┌─────────────────┐
│  TerminalLayout │
│─────────────────│
│ width: number   │
│ height: number  │
│ mode: LayoutMode│◄──── uses enum
│ columns: number │
│ timestamp: num  │
└────────┬────────┘
         │
         │ 1
         │
         │ contains
         │
         │ 0..*
         │
         ▼
┌──────────────────────┐
│   ContentRegion      │
│──────────────────────│
│ id: string           │
│ type: ContentRegion  │◄──── uses enum
│      Type            │
│ position: {r, c}     │
│ size: {w, h}         │
│ padding: {t,r,b,l}   │
│ showBorder: boolean  │
│ content?: unknown    │
└──────────────────────┘
```

### Relationship Rules

1. **TerminalLayout → ContentRegion** (1:N)
   - 一个 `TerminalLayout` 包含 0 到多个 `ContentRegion`
   - `ContentRegion` 的边界不能超出 `TerminalLayout` 的尺寸
   - `ContentRegion` 之间可以重叠（用于叠加效果，如边框和内容）

2. **ContentRegionType Ordering**
   - 同一 `TerminalLayout` 中，建议按类型顺序排列区域：
     `HEADER` → `STATUS` → `MENU` → `CONTENT` → `FOOTER`
   - 这是推荐而非强制规则，允许灵活布局

3. **LayoutMode → columns Constraint**
   - `LayoutMode.WIDE` 模式下，`columns` 值决定多列布局
   - 每列宽度 = `(width - (columns - 1) * gap) / columns`
   - 默认 `gap = 2` 字符（列间距）

---

## State Transitions

### LayoutMode Transitions

终端窗口大小变化时，布局模式可能发生转换：

```
           resize to < 80 cols
    ┌─────────────────────────────┐
    │                             │
    │                             ▼
┌───┴───┐   80-120 cols    ┌───────────┐
│  WIDE │ ◄────────────────┤  COMPACT  │
└───┬───┘                  └───────────┘
    │                             ▲
    │                             │
    └─────────────────────────────┘
          resize to 80-120 cols


           resize to > 120 cols
    ┌─────────────────────────────┐
    │                             │
    │                             ▼
┌───┴────┐   80-120 cols   ┌────────────┐
│COMPACT │ ────────────────►  STANDARD  │
└────────┘                 └──────┬─────┘
                                  │
                                  │
                           ┌──────▼──────┐
                           │    WIDE     │
                           └─────────────┘
```

**Transition Effects**:
- `COMPACT → STANDARD`: 扩展内边距，显示更多次要信息
- `STANDARD → WIDE`: 启用多列布局，columns 从 1 变为 2
- `WIDE → STANDARD`: 折叠为单列布局
- `STANDARD → COMPACT`: 隐藏次要信息，减少内边距

---

## Validation Functions

### Layout Validation

```typescript
/**
 * 验证 TerminalLayout 配置是否有效
 */
export function validateLayout(layout: TerminalLayout): boolean {
  // 1. 检查最小尺寸
  if (layout.width < 60 || layout.height < 20) {
    throw new Error(`Terminal too small: ${layout.width}x${layout.height} (min: 60x20)`);
  }

  // 2. 检查 mode 与 width 的一致性
  const expectedMode =
    layout.width < 80 ? LayoutMode.COMPACT :
    layout.width > 120 ? LayoutMode.WIDE :
    LayoutMode.STANDARD;

  if (layout.mode !== expectedMode) {
    throw new Error(`LayoutMode mismatch: expected ${expectedMode}, got ${layout.mode}`);
  }

  // 3. 检查 columns 约束
  if (layout.mode === LayoutMode.WIDE && layout.columns < 2) {
    throw new Error(`WIDE mode requires columns >= 2, got ${layout.columns}`);
  }
  if (layout.mode !== LayoutMode.WIDE && layout.columns !== 1) {
    throw new Error(`Non-WIDE mode requires columns = 1, got ${layout.columns}`);
  }

  // 4. 验证所有 ContentRegion
  for (const region of layout.regions) {
    validateRegion(region, layout);
  }

  return true;
}

/**
 * 验证 ContentRegion 配置是否有效
 */
export function validateRegion(
  region: ContentRegion,
  layout: TerminalLayout
): boolean {
  // 1. 检查位置边界
  if (region.position.row < 0 || region.position.row >= layout.height) {
    throw new Error(`Region ${region.id}: row out of bounds`);
  }
  if (region.position.column < 0 || region.position.column >= layout.width) {
    throw new Error(`Region ${region.id}: column out of bounds`);
  }

  // 2. 检查尺寸边界
  const maxWidth = layout.width - region.position.column;
  const maxHeight = layout.height - region.position.row;

  if (region.size.width <= 0 || region.size.width > maxWidth) {
    throw new Error(`Region ${region.id}: width out of bounds`);
  }
  if (region.size.height <= 0 || region.size.height > maxHeight) {
    throw new Error(`Region ${region.id}: height out of bounds`);
  }

  // 3. 检查 padding 有效性
  const totalHorizontalPadding = region.padding.left + region.padding.right;
  const totalVerticalPadding = region.padding.top + region.padding.bottom;

  if (totalHorizontalPadding >= region.size.width) {
    throw new Error(`Region ${region.id}: horizontal padding too large`);
  }
  if (totalVerticalPadding >= region.size.height) {
    throw new Error(`Region ${region.id}: vertical padding too large`);
  }

  return true;
}
```

---

## Usage Examples

### Example 1: Creating a Compact Layout (< 80 cols)

```typescript
import { TerminalLayout, LayoutMode, ContentRegion, ContentRegionType } from '../types/layout';

const compactLayout: TerminalLayout = {
  width: 70,
  height: 24,
  mode: LayoutMode.COMPACT,
  columns: 1,
  regions: [
    {
      id: 'header-0',
      type: ContentRegionType.HEADER,
      position: { row: 0, column: 0 },
      size: { width: 70, height: 2 },
      padding: { top: 0, right: 1, bottom: 0, left: 1 },
      showBorder: false,
      content: { title: 'Xray VPN' }
    },
    {
      id: 'menu-0',
      type: ContentRegionType.MENU,
      position: { row: 2, column: 0 },
      size: { width: 70, height: 15 },
      padding: { top: 1, right: 1, bottom: 1, left: 1 },
      showBorder: false
    }
  ],
  timestamp: Date.now()
};
```

### Example 2: Creating a Wide Layout with Multi-Column (> 120 cols)

```typescript
const wideLayout: TerminalLayout = {
  width: 140,
  height: 35,
  mode: LayoutMode.WIDE,
  columns: 2,
  regions: [
    // 全宽 Header
    {
      id: 'header-0',
      type: ContentRegionType.HEADER,
      position: { row: 0, column: 0 },
      size: { width: 140, height: 3 },
      padding: { top: 1, right: 2, bottom: 1, left: 2 },
      showBorder: false
    },
    // 左列 - 服务状态
    {
      id: 'status-left',
      type: ContentRegionType.STATUS,
      position: { row: 3, column: 0 },
      size: { width: 68, height: 12 },
      padding: { top: 1, right: 1, bottom: 1, left: 2 },
      showBorder: true,
      content: { title: 'Service Status' }
    },
    // 右列 - 用户统计
    {
      id: 'status-right',
      type: ContentRegionType.STATUS,
      position: { row: 3, column: 70 },
      size: { width: 68, height: 12 },
      padding: { top: 1, right: 2, bottom: 1, left: 1 },
      showBorder: true,
      content: { title: 'User Statistics' }
    },
    // 全宽 Menu
    {
      id: 'menu-0',
      type: ContentRegionType.MENU,
      position: { row: 15, column: 0 },
      size: { width: 140, height: 18 },
      padding: { top: 1, right: 2, bottom: 1, left: 2 },
      showBorder: false
    }
  ],
  timestamp: Date.now()
};
```

---

## Migration Notes

### Backward Compatibility

现有代码不需要立即迁移到新的布局系统。布局系统应作为可选增强功能：

```typescript
// Old way (still supported)
logger.info('Service status: running');

// New way (enhanced layout)
const layout = layoutManager.getCurrentLayout();
const statusRegion = layout.regions.find(r => r.type === ContentRegionType.STATUS);
renderRegion(statusRegion, { status: 'running' });
```

### Fallback Strategy

当终端不支持尺寸检测时，使用默认布局：

```typescript
const layout = detectTerminalSize() || DEFAULT_LAYOUT;
```

---

## Summary

本数据模型定义了三个核心实体：

1. **LayoutMode** - 布局模式枚举（紧凑/标准/宽屏）
2. **ContentRegion** - 内容区域定义（类型、位置、尺寸、填充）
3. **TerminalLayout** - 终端布局配置（包含多个区域）

关键约束：
- 最小终端尺寸：60x20
- 宽屏模式（> 120 列）才启用多列布局
- 所有区域必须在终端边界内
- 布局模式与终端宽度自动匹配

下一步：在 `src/types/layout.ts` 中实现这些类型定义，并在 `src/services/layout-manager.ts` 中实现布局管理逻辑。
