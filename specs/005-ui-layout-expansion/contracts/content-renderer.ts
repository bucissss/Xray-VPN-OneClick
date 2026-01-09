/**
 * Content Renderer API Contract
 *
 * 定义内容渲染服务的公共接口。
 * 实现位置: src/utils/layout.ts (渲染工具函数)
 *
 * Feature: 005-ui-layout-expansion
 * Created: 2026-01-09
 */

import type { TerminalLayout, ContentRegion, ContentRegionType } from '../../../src/types/layout';

/**
 * 菜单项定义
 */
export interface MenuItem {
  /**
   * 菜单选项名称
   */
  name: string;

  /**
   * 菜单选项值（用于 @inquirer/prompts）
   */
  value: string;

  /**
   * 是否禁用
   */
  disabled?: boolean;

  /**
   * 描述信息（可选）
   */
  description?: string;
}

/**
 * 表格列定义
 */
export interface TableColumn {
  /**
   * 列标题
   */
  header: string;

  /**
   * 数据键名
   */
  key: string;

  /**
   * 列宽（可选，不指定则自动计算）
   */
  width?: number;

  /**
   * 对齐方式
   */
  align?: 'left' | 'center' | 'right';
}

/**
 * 渲染选项
 */
export interface RenderOptions {
  /**
   * 是否显示边框
   */
  showBorder?: boolean;

  /**
   * 边框样式（使用 cli-table3）
   */
  borderStyle?: 'single' | 'double' | 'compact';

  /**
   * 文本颜色（chalk 颜色名）
   */
  color?: string;

  /**
   * 是否启用缓存渲染结果
   */
  enableCache?: boolean;
}

/**
 * Section 内容定义
 */
export interface SectionContent {
  /**
   * 标题
   */
  title: string;

  /**
   * 内容（字符串或多行数组）
   */
  content: string | string[];

  /**
   * 是否折叠显示（仅在空间不足时）
   */
  collapsible?: boolean;
}

/**
 * 内容渲染器接口
 *
 * 职责：
 * - 渲染菜单、表格、文本区域
 * - 处理字符宽度计算和对齐
 * - 应用布局约束（padding、边框）
 */
export interface IContentRenderer {
  /**
   * 渲染菜单列表
   *
   * @param items - 菜单项列表
   * @param layout - 当前布局配置
   * @param options - 渲染选项
   * @returns 渲染后的字符串（可直接输出到终端）
   *
   * @example
   * ```typescript
   * const menuItems: MenuItem[] = [
   *   { name: '查看状态', value: 'status' },
   *   { name: '启动服务', value: 'start' }
   * ];
   * const output = renderer.renderMenu(menuItems, layout);
   * console.log(output);
   * ```
   */
  renderMenu(
    items: MenuItem[],
    layout: TerminalLayout,
    options?: RenderOptions
  ): string;

  /**
   * 渲染多列布局
   *
   * @param data - 二维数组，每个子数组代表一列的数据
   * @param layout - 当前布局配置
   * @param options - 渲染选项
   * @returns 渲染后的字符串
   *
   * @example
   * ```typescript
   * const columns = [
   *   ['Service Status', 'Running', '2 users'],
   *   ['System Info', 'Ubuntu 22.04', '8GB RAM']
   * ];
   * const output = renderer.renderColumns(columns, layout);
   * ```
   */
  renderColumns(
    data: string[][],
    layout: TerminalLayout,
    options?: RenderOptions
  ): string;

  /**
   * 渲染表格（使用 cli-table3）
   *
   * @param columns - 列定义
   * @param rows - 行数据（对象数组）
   * @param layout - 当前布局配置
   * @param options - 渲染选项
   * @returns 渲染后的字符串
   *
   * @example
   * ```typescript
   * const columns: TableColumn[] = [
   *   { header: 'Name', key: 'name', align: 'left' },
   *   { header: 'Status', key: 'status', align: 'center' }
   * ];
   * const rows = [
   *   { name: 'user1', status: 'Active' },
   *   { name: 'user2', status: 'Inactive' }
   * ];
   * const output = renderer.renderTable(columns, rows, layout);
   * ```
   */
  renderTable(
    columns: TableColumn[],
    rows: Record<string, unknown>[],
    layout: TerminalLayout,
    options?: RenderOptions
  ): string;

  /**
   * 渲染单个内容区域
   *
   * @param region - 内容区域定义
   * @param content - 区域内容
   * @param options - 渲染选项
   * @returns 渲染后的字符串
   *
   * @example
   * ```typescript
   * const headerRegion: ContentRegion = {
   *   id: 'header-0',
   *   type: ContentRegionType.HEADER,
   *   position: { row: 0, column: 0 },
   *   size: { width: 80, height: 3 },
   *   padding: { top: 1, right: 2, bottom: 1, left: 2 },
   *   showBorder: false
   * };
   * const output = renderer.renderRegion(
   *   headerRegion,
   *   { title: 'Xray VPN Manager' }
   * );
   * ```
   */
  renderRegion(
    region: ContentRegion,
    content: SectionContent | string,
    options?: RenderOptions
  ): string;

  /**
   * 渲染分隔符
   *
   * @param width - 分隔符宽度
   * @param char - 分隔符字符（默认 '─'）
   * @param color - 颜色（可选）
   * @returns 渲染后的分隔符字符串
   *
   * @example
   * ```typescript
   * const separator = renderer.renderSeparator(80, '═', 'gray');
   * console.log(separator);
   * ```
   */
  renderSeparator(
    width: number,
    char?: string,
    color?: string
  ): string;

  /**
   * 渲染标题行（带可选边框）
   *
   * @param title - 标题文本
   * @param width - 总宽度
   * @param align - 对齐方式
   * @param options - 渲染选项
   * @returns 渲染后的标题字符串
   *
   * @example
   * ```typescript
   * const header = renderer.renderHeader(
   *   'Service Status',
   *   80,
   *   'center',
   *   { showBorder: true }
   * );
   * ```
   */
  renderHeader(
    title: string,
    width: number,
    align?: 'left' | 'center' | 'right',
    options?: RenderOptions
  ): string;

  /**
   * 应用 padding 到文本块
   *
   * @param text - 原始文本（可以是多行）
   * @param padding - padding 配置
   * @param width - 目标宽度
   * @returns 应用 padding 后的文本
   *
   * @example
   * ```typescript
   * const paddedText = renderer.applyPadding(
   *   'Hello',
   *   { top: 1, right: 2, bottom: 1, left: 2 },
   *   20
   * );
   * ```
   */
  applyPadding(
    text: string,
    padding: ContentRegion['padding'],
    width: number
  ): string;

  /**
   * 截断或填充文本以适应指定宽度
   *
   * @param text - 原始文本
   * @param width - 目标宽度
   * @param align - 对齐方式
   * @param ellipsis - 截断时使用的省略符（默认 '...'）
   * @returns 调整后的文本
   *
   * @example
   * ```typescript
   * const fitted = renderer.fitText('Very long text here', 10, 'left');
   * // Returns: 'Very lo...'
   * ```
   */
  fitText(
    text: string,
    width: number,
    align?: 'left' | 'center' | 'right',
    ellipsis?: string
  ): string;

  /**
   * 计算文本的显示宽度（处理中文字符）
   *
   * @param text - 输入文本
   * @returns 显示宽度
   *
   * @example
   * ```typescript
   * const width = renderer.getDisplayWidth('Hello 世界');
   * // Returns: 9 (5 English + 2*2 Chinese)
   * ```
   */
  getDisplayWidth(text: string): number;
}

/**
 * 布局辅助渲染器接口
 *
 * 提供更高级的布局组合功能
 */
export interface ILayoutRenderer {
  /**
   * 渲染完整的布局（所有区域）
   *
   * @param layout - 布局配置
   * @param regionContents - 区域内容映射（region.id → content）
   * @param options - 渲染选项
   * @returns 完整的渲染结果
   *
   * @example
   * ```typescript
   * const contents = new Map([
   *   ['header-0', { title: 'Xray VPN Manager' }],
   *   ['menu-0', menuItems]
   * ]);
   * const output = layoutRenderer.renderLayout(layout, contents);
   * console.log(output);
   * ```
   */
  renderLayout(
    layout: TerminalLayout,
    regionContents: Map<string, unknown>,
    options?: RenderOptions
  ): string;

  /**
   * 差异化渲染（仅渲染变化的部分）
   *
   * @param oldLayout - 旧布局
   * @param newLayout - 新布局
   * @param regionContents - 区域内容映射
   * @returns 差异渲染结果（仅包含变化的行）
   *
   * @example
   * ```typescript
   * const diff = layoutRenderer.renderDiff(
   *   previousLayout,
   *   currentLayout,
   *   contents
   * );
   * if (diff.hasChanges) {
   *   console.log(diff.output);
   * }
   * ```
   */
  renderDiff(
    oldLayout: TerminalLayout,
    newLayout: TerminalLayout,
    regionContents: Map<string, unknown>
  ): {
    hasChanges: boolean;
    output: string;
    changedRegions: string[];
  };

  /**
   * 清除终端并重新渲染
   *
   * @param layout - 布局配置
   * @param regionContents - 区域内容映射
   *
   * @example
   * ```typescript
   * layoutRenderer.clearAndRender(layout, contents);
   * ```
   */
  clearAndRender(
    layout: TerminalLayout,
    regionContents: Map<string, unknown>
  ): void;
}

/**
 * 默认渲染选项
 */
export const DEFAULT_RENDER_OPTIONS: Required<RenderOptions> = {
  showBorder: false,
  borderStyle: 'single',
  color: 'white',
  enableCache: true
};

/**
 * 边框字符集（用于手绘边框）
 */
export const BORDER_CHARS = {
  single: {
    topLeft: '┌',
    topRight: '┐',
    bottomLeft: '└',
    bottomRight: '┘',
    horizontal: '─',
    vertical: '│',
    cross: '┼'
  },
  double: {
    topLeft: '╔',
    topRight: '╗',
    bottomLeft: '╚',
    bottomRight: '╝',
    horizontal: '═',
    vertical: '║',
    cross: '╬'
  },
  compact: {
    topLeft: '+',
    topRight: '+',
    bottomLeft: '+',
    bottomRight: '+',
    horizontal: '-',
    vertical: '|',
    cross: '+'
  }
} as const;

/**
 * 对齐辅助常量
 */
export const TEXT_ALIGN = {
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right'
} as const;

/**
 * 默认截断省略符
 */
export const DEFAULT_ELLIPSIS = '...';
