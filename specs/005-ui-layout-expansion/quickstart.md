# Quickstart Guide: 布局系统使用指南

**Feature**: 005-ui-layout-expansion | **阅读时间**: 5 分钟

## 概述

本指南帮助开发者快速上手使用新的响应式布局系统，包括终端尺寸检测、自适应布局计算和内容渲染。

---

## 快速开始

### 1. 基础用法 - 检测终端并创建布局

最简单的使用场景：检测终端尺寸并创建自适应布局。

```typescript
import { LayoutManager } from '../services/layout-manager';
import { ContentRegionType, LayoutMode } from '../types/layout';

// 1. 创建布局管理器实例
const layoutManager = new LayoutManager();

// 2. 检测终端尺寸
const size = layoutManager.detectTerminalSize();
console.log(`Terminal: ${size.width}x${size.height}`);

// 3. 计算布局模式
const mode = layoutManager.calculateLayoutMode(size.width);
console.log(`Layout mode: ${mode}`); // compact / standard / wide

// 4. 创建布局（带默认区域）
const layout = layoutManager.createLayout(mode, []);
console.log(`Columns: ${layout.columns}`);
```

**输出示例** (80x24 终端):
```
Terminal: 80x24
Layout mode: standard
Columns: 1
```

---

### 2. 定义内容区域

使用 `ContentRegion` 定义界面的不同区域（标题、菜单、状态等）。

```typescript
import type { ContentRegion } from '../types/layout';
import { ContentRegionType } from '../types/layout';

// 定义页面标题区域
const headerRegion: ContentRegion = {
  id: 'header-main',
  type: ContentRegionType.HEADER,
  position: { row: 0, column: 0 },
  size: { width: 80, height: 3 },
  padding: { top: 1, right: 2, bottom: 1, left: 2 },
  showBorder: false,
  content: {
    title: 'Xray VPN Manager',
    subtitle: 'v1.1.1'
  }
};

// 定义菜单区域
const menuRegion: ContentRegion = {
  id: 'menu-main',
  type: ContentRegionType.MENU,
  position: { row: 3, column: 0 },
  size: { width: 80, height: 15 },
  padding: { top: 1, right: 2, bottom: 1, left: 2 },
  showBorder: false
};

// 定义状态信息区域
const statusRegion: ContentRegion = {
  id: 'status-info',
  type: ContentRegionType.STATUS,
  position: { row: 18, column: 0 },
  size: { width: 80, height: 5 },
  padding: { top: 1, right: 2, bottom: 1, left: 2 },
  showBorder: true
};
```

---

### 3. 渲染内容到区域

使用 `ContentRenderer` 渲染菜单、表格和文本到定义的区域。

```typescript
import { ContentRenderer } from '../utils/layout';
import type { MenuItem } from '../contracts/content-renderer';

const renderer = new ContentRenderer();

// 渲染菜单
const menuItems: MenuItem[] = [
  { name: '[查看] 服务状态', value: 'status' },
  { name: '[启动] 启动服务', value: 'start' },
  { name: '[停止] 停止服务', value: 'stop' },
  { name: '[退出] 退出程序', value: 'exit' }
];

const menuOutput = renderer.renderMenu(menuItems, layout);
console.log(menuOutput);

// 渲染标题
const headerOutput = renderer.renderHeader(
  'Xray VPN Manager',
  80,
  'center',
  { showBorder: true }
);
console.log(headerOutput);

// 渲染分隔符
const separator = renderer.renderSeparator(80, '─', 'gray');
console.log(separator);
```

---

### 4. 响应式布局 - 监听窗口调整

监听终端窗口大小变化并自动重新渲染。

```typescript
import { LayoutManager } from '../services/layout-manager';

const layoutManager = new LayoutManager();

// 初始化布局
let currentLayout = layoutManager.createLayout(
  layoutManager.calculateLayoutMode(80),
  [headerRegion, menuRegion, statusRegion]
);

// 监听窗口调整（自动应用 300ms 防抖）
const unsubscribe = layoutManager.onResize((newLayout) => {
  console.log(`Window resized: ${newLayout.width}x${newLayout.height}`);
  console.log(`New mode: ${newLayout.mode}`);
  console.log(`New columns: ${newLayout.columns}`);

  // 重新渲染 UI
  currentLayout = newLayout;
  renderUI(currentLayout);
});

// 稍后取消监听
// unsubscribe();
```

---

### 5. 多列布局 - 宽屏优化

在宽屏终端（> 120 列）中使用多列布局。

```typescript
import { LayoutMode } from '../types/layout';

// 检测到宽屏终端时
if (layout.mode === LayoutMode.WIDE) {
  // 定义左右两列状态区域
  const leftStatusRegion: ContentRegion = {
    id: 'status-left',
    type: ContentRegionType.STATUS,
    position: { row: 3, column: 0 },
    size: { width: 58, height: 12 },
    padding: { top: 1, right: 1, bottom: 1, left: 2 },
    showBorder: true,
    content: { title: 'Service Status' }
  };

  const rightStatusRegion: ContentRegion = {
    id: 'status-right',
    type: ContentRegionType.STATUS,
    position: { row: 3, column: 60 },
    size: { width: 58, height: 12 },
    padding: { top: 1, right: 2, bottom: 1, left: 1 },
    showBorder: true,
    content: { title: 'User Statistics' }
  };

  // 使用渲染器渲染多列数据
  const columnsData = [
    ['Service: Running', 'Port: 443', 'Users: 2'],
    ['CPU: 5%', 'Memory: 120MB', 'Uptime: 2d']
  ];

  const columnsOutput = renderer.renderColumns(columnsData, layout);
  console.log(columnsOutput);
}
```

---

### 6. 使用表格渲染 (cli-table3)

渲染用户列表或服务状态详情表格。

```typescript
import type { TableColumn } from '../contracts/content-renderer';

const renderer = new ContentRenderer();

// 定义表格列
const columns: TableColumn[] = [
  { header: 'Username', key: 'username', align: 'left' },
  { header: 'UUID', key: 'uuid', align: 'left' },
  { header: 'Status', key: 'status', align: 'center' },
  { header: 'Traffic', key: 'traffic', align: 'right' }
];

// 准备数据
const rows = [
  {
    username: 'user1',
    uuid: 'a1b2c3d4-...',
    status: 'Active',
    traffic: '1.2GB'
  },
  {
    username: 'user2',
    uuid: 'e5f6g7h8-...',
    status: 'Inactive',
    traffic: '450MB'
  }
];

// 渲染表格
const tableOutput = renderer.renderTable(columns, rows, layout, {
  showBorder: true,
  borderStyle: 'single'
});

console.log(tableOutput);
```

**输出示例**:
```
┌──────────┬────────────────┬──────────┬─────────┐
│ Username │ UUID           │  Status  │ Traffic │
├──────────┼────────────────┼──────────┼─────────┤
│ user1    │ a1b2c3d4-...   │  Active  │   1.2GB │
│ user2    │ e5f6g7h8-...   │ Inactive │   450MB │
└──────────┴────────────────┴──────────┴─────────┘
```

---

### 7. 实战示例 - 集成到现有菜单

将布局系统集成到 `src/commands/interactive.ts` 交互式菜单。

```typescript
import { LayoutManager } from '../services/layout-manager';
import { ContentRenderer } from '../utils/layout';
import { select } from '@inquirer/prompts';
import { t } from '../config/i18n';

export async function showInteractiveMenu(): Promise<void> {
  // 1. 初始化布局管理器
  const layoutManager = new LayoutManager();
  const renderer = new ContentRenderer();

  // 2. 检测终端并创建布局
  const size = layoutManager.detectTerminalSize();

  // 验证终端尺寸
  const validation = layoutManager.validateTerminalSize(size);
  if (!validation.isValid) {
    logger.warn(validation.message!);
    logger.info(validation.suggestion!);
  }

  const layout = layoutManager.refreshLayout();

  // 3. 监听窗口调整
  layoutManager.onResize((newLayout) => {
    logger.info(`Terminal resized to ${newLayout.width}x${newLayout.height}`);
  });

  // 4. 渲染标题（根据布局模式调整）
  const title = layout.mode === 'compact'
    ? 'Xray VPN'
    : 'Xray VPN Manager - Interactive Menu';

  console.log(renderer.renderHeader(title, layout.width, 'center', {
    showBorder: true
  }));

  // 5. 显示菜单（使用现有 @inquirer/prompts）
  const trans = t();
  const action = await select({
    message: trans.actions.selectAction,
    choices: [
      {
        name: `[查看] ${trans.menu.viewStatus}`,
        value: 'status'
      },
      // ... 其他选项
    ]
  });

  // 处理用户选择
  await handleAction(action);
}
```

---

## 常见场景

### 场景 1: 窄终端降级处理

```typescript
const size = layoutManager.detectTerminalSize();

if (size.width < 80) {
  // 紧凑模式：隐藏次要信息
  logger.warn('Narrow terminal detected. Some features may be hidden.');

  // 仅显示核心菜单，不显示详细状态
  const compactMenuItems = [
    { name: 'Status', value: 'status' },
    { name: 'Start', value: 'start' },
    { name: 'Stop', value: 'stop' }
  ];

  const output = renderer.renderMenu(compactMenuItems, layout);
  console.log(output);
} else {
  // 标准或宽屏模式：显示完整信息
  showFullMenu();
}
```

### 场景 2: 缓存布局提升性能

```typescript
const layoutManager = new LayoutManager();

// 启用缓存（默认 5 秒 TTL）
const layout = layoutManager.createLayout(mode, regions, {
  enableCache: true,
  cacheTTL: 5000
});

// 多次调用将使用缓存（< 5 秒内）
const cachedLayout = layoutManager.getCurrentLayout();

// 强制刷新缓存
layoutManager.clearCache();
const freshLayout = layoutManager.refreshLayout();
```

### 场景 3: 手动设置布局模式

```typescript
// 忽略终端宽度，强制使用宽屏布局
const layout = layoutManager.createLayout(
  LayoutMode.WIDE,
  regions,
  {
    forceMode: LayoutMode.WIDE
  }
);
```

---

## 调试技巧

### 1. 模拟不同终端尺寸

在测试中模拟不同尺寸的终端：

```bash
# 设置环境变量模拟终端尺寸
export COLUMNS=60
export LINES=20
npm run dev

# 或在代码中手动设置
process.stdout.columns = 60;
process.stdout.rows = 20;
```

### 2. 打印布局调试信息

```typescript
import { validateLayout } from '../types/layout';

const layout = layoutManager.getCurrentLayout();

console.log('=== Layout Debug Info ===');
console.log(`Size: ${layout.width}x${layout.height}`);
console.log(`Mode: ${layout.mode}`);
console.log(`Columns: ${layout.columns}`);
console.log(`Regions: ${layout.regions.length}`);

layout.regions.forEach((region) => {
  console.log(`  - ${region.id} (${region.type})`);
  console.log(`    Position: row=${region.position.row}, col=${region.position.column}`);
  console.log(`    Size: ${region.size.width}x${region.size.height}`);
});

// 验证布局有效性
try {
  validateLayout(layout);
  console.log('✓ Layout is valid');
} catch (error) {
  console.error('✗ Layout validation failed:', error.message);
}
```

### 3. 测试字符宽度计算

```typescript
import { calculateDisplayWidth } from '../utils/layout';

const testStrings = [
  'Hello World',        // 纯英文
  '你好世界',           // 纯中文
  'Hello 世界',         // 混合
  '[查看] 服务状态'     // 符号 + 中文
];

testStrings.forEach((str) => {
  const width = calculateDisplayWidth(str);
  console.log(`"${str}" -> ${width} chars`);
});
```

**输出**:
```
"Hello World" -> 11 chars
"你好世界" -> 8 chars
"Hello 世界" -> 9 chars
"[查看] 服务状态" -> 13 chars
```

---

## 性能优化建议

### 1. 使用防抖避免频繁重新渲染

```typescript
// ✅ 推荐：使用布局管理器的内置防抖（300ms）
layoutManager.onResize((layout) => {
  renderUI(layout);
});

// ❌ 不推荐：手动监听 resize 事件（无防抖）
process.stdout.on('resize', () => {
  renderUI(layoutManager.refreshLayout());
});
```

### 2. 缓存渲染结果

```typescript
const renderCache = new Map<string, string>();

function renderWithCache(region: ContentRegion, content: unknown): string {
  const cacheKey = `${region.id}-${JSON.stringify(content)}`;

  if (renderCache.has(cacheKey)) {
    return renderCache.get(cacheKey)!;
  }

  const output = renderer.renderRegion(region, content);
  renderCache.set(cacheKey, output);
  return output;
}
```

### 3. 差异化渲染（仅重绘变化区域）

```typescript
import { ILayoutRenderer } from '../contracts/content-renderer';

const layoutRenderer: ILayoutRenderer = new LayoutRenderer();

// 仅渲染变化的部分
const diff = layoutRenderer.renderDiff(
  oldLayout,
  newLayout,
  regionContents
);

if (diff.hasChanges) {
  console.log(`Changed regions: ${diff.changedRegions.join(', ')}`);
  console.log(diff.output);
}
```

---

## 下一步

- 阅读 [data-model.md](./data-model.md) 了解详细的类型定义和验证规则
- 查看 [contracts/](./contracts/) 了解完整的 API 接口定义
- 参考 [research.md](./research.md) 了解技术决策背景
- 查看单元测试 `tests/unit/utils/layout.test.ts` 了解更多用法示例

---

## 常见问题

**Q: 如何判断当前终端是否支持尺寸检测？**

A: 使用 `detectTerminalSize()` 并检查 `isTTY` 字段：

```typescript
const size = layoutManager.detectTerminalSize();
if (!size.isTTY) {
  logger.warn('Non-TTY environment, using default layout (80x24)');
}
```

**Q: 为什么多列布局只在 > 120 列时启用？**

A: 根据 research.md 的分析，在中等宽度（80-120）启用多列会导致拥挤。仅在宽屏（> 120）时启用可以保证每列至少有 ~59 个字符的宽度。

**Q: 如何确保布局在不同语言（中英文）下正常工作？**

A: 使用 `calculateDisplayWidth()` 函数精确计算字符宽度，该函数正确处理中文字符（宽度 = 2）和英文字符（宽度 = 1）。

---

**完成时间**: < 5 分钟 ✓

现在你已经掌握了布局系统的基础用法！开始在你的命令中集成响应式布局吧。
