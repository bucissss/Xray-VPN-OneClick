/**
 * Layout Manager API Contract
 *
 * 定义布局管理服务的公共接口。
 * 实现位置: src/services/layout-manager.ts
 *
 * Feature: 005-ui-layout-expansion
 * Created: 2026-01-09
 */

import type { TerminalLayout, LayoutMode, ContentRegion } from '../../../src/types/layout';

/**
 * 终端尺寸信息
 */
export interface TerminalSize {
  /**
   * 终端宽度（列数）
   */
  width: number;

  /**
   * 终端高度（行数）
   */
  height: number;

  /**
   * 是否为 TTY 终端
   */
  isTTY: boolean;
}

/**
 * 布局选项配置
 */
export interface LayoutOptions {
  /**
   * 是否强制特定布局模式（覆盖自动检测）
   */
  forceMode?: LayoutMode;

  /**
   * 最小列间距（仅在多列布局时生效）
   * @default 2
   */
  columnGap?: number;

  /**
   * 是否启用布局缓存
   * @default true
   */
  enableCache?: boolean;

  /**
   * 缓存过期时间（毫秒）
   * @default 5000
   */
  cacheTTL?: number;
}

/**
 * Resize 事件回调函数类型
 */
export type ResizeCallback = (layout: TerminalLayout) => void;

/**
 * 布局管理器接口
 *
 * 职责：
 * - 检测和监听终端尺寸变化
 * - 计算和缓存布局配置
 * - 管理布局模式切换
 */
export interface ILayoutManager {
  /**
   * 检测当前终端尺寸
   *
   * @returns 终端尺寸信息（宽度、高度、TTY 状态）
   * @throws 如果无法检测尺寸（非 TTY 环境返回默认值）
   *
   * @example
   * ```typescript
   * const size = layoutManager.detectTerminalSize();
   * console.log(`Terminal: ${size.width}x${size.height}`);
   * ```
   */
  detectTerminalSize(): TerminalSize;

  /**
   * 根据终端宽度计算布局模式
   *
   * @param width - 终端宽度（列数）
   * @returns 对应的布局模式
   *
   * 映射规则（from research.md）:
   * - width < 80 → LayoutMode.COMPACT
   * - 80 ≤ width ≤ 120 → LayoutMode.STANDARD
   * - width > 120 → LayoutMode.WIDE
   *
   * @example
   * ```typescript
   * const mode = layoutManager.calculateLayoutMode(140);
   * // Returns: LayoutMode.WIDE
   * ```
   */
  calculateLayoutMode(width: number): LayoutMode;

  /**
   * 创建布局配置
   *
   * @param mode - 布局模式
   * @param regions - 内容区域列表
   * @param options - 布局选项（可选）
   * @returns 完整的 TerminalLayout 对象
   *
   * @example
   * ```typescript
   * const layout = layoutManager.createLayout(
   *   LayoutMode.WIDE,
   *   [headerRegion, statusRegion, menuRegion],
   *   { columnGap: 4 }
   * );
   * ```
   */
  createLayout(
    mode: LayoutMode,
    regions: ContentRegion[],
    options?: LayoutOptions
  ): TerminalLayout;

  /**
   * 获取当前缓存的布局配置
   *
   * @returns 当前布局配置，如果未初始化返回 null
   *
   * @example
   * ```typescript
   * const currentLayout = layoutManager.getCurrentLayout();
   * if (currentLayout) {
   *   console.log(`Current mode: ${currentLayout.mode}`);
   * }
   * ```
   */
  getCurrentLayout(): TerminalLayout | null;

  /**
   * 刷新布局配置（重新检测终端尺寸并重新计算）
   *
   * @param regions - 新的内容区域列表（可选，不提供则使用现有区域）
   * @param options - 布局选项（可选）
   * @returns 新的布局配置
   *
   * @example
   * ```typescript
   * const newLayout = layoutManager.refreshLayout();
   * renderUI(newLayout);
   * ```
   */
  refreshLayout(
    regions?: ContentRegion[],
    options?: LayoutOptions
  ): TerminalLayout;

  /**
   * 注册终端窗口调整大小的回调函数
   *
   * 监听 process.stdout.on('resize') 事件，应用防抖优化（300ms）
   *
   * @param callback - 回调函数，接收新的布局配置
   * @returns 取消监听的函数
   *
   * @example
   * ```typescript
   * const unsubscribe = layoutManager.onResize((layout) => {
   *   console.log(`Window resized to ${layout.width}x${layout.height}`);
   *   renderUI(layout);
   * });
   *
   * // Later: unsubscribe to stop listening
   * unsubscribe();
   * ```
   */
  onResize(callback: ResizeCallback): () => void;

  /**
   * 清除布局缓存
   *
   * 用于强制重新计算布局（例如，内容变化时）
   *
   * @example
   * ```typescript
   * layoutManager.clearCache();
   * const freshLayout = layoutManager.refreshLayout();
   * ```
   */
  clearCache(): void;

  /**
   * 验证终端尺寸是否满足最小要求
   *
   * @param size - 终端尺寸
   * @returns 验证结果对象
   *
   * @example
   * ```typescript
   * const size = layoutManager.detectTerminalSize();
   * const validation = layoutManager.validateTerminalSize(size);
   * if (!validation.isValid) {
   *   console.warn(validation.message);
   * }
   * ```
   */
  validateTerminalSize(size: TerminalSize): {
    isValid: boolean;
    message?: string;
    suggestion?: string;
  };
}

/**
 * 布局计算辅助函数接口
 *
 * 这些是纯函数，不依赖状态，可以在 utils/layout.ts 中实现
 */
export interface ILayoutCalculator {
  /**
   * 计算多列布局的列宽
   *
   * @param totalWidth - 总可用宽度
   * @param columns - 列数
   * @param gap - 列间距
   * @returns 每列的宽度
   *
   * 算法: (totalWidth - (columns - 1) * gap) / columns
   *
   * @example
   * ```typescript
   * const columnWidth = calculateColumnWidth(120, 2, 2);
   * // Returns: 59
   * ```
   */
  calculateColumnWidth(
    totalWidth: number,
    columns: number,
    gap: number
  ): number;

  /**
   * 计算字符串的显示宽度（考虑中文字符）
   *
   * @param text - 输入文本
   * @returns 显示宽度（中文字符计为 2，英文计为 1）
   *
   * @example
   * ```typescript
   * const width = calculateDisplayWidth('Hello 世界');
   * // Returns: 9 (5 + 4)
   * ```
   */
  calculateDisplayWidth(text: string): number;

  /**
   * 将内容区域分配到多列布局中
   *
   * @param regions - 待分配的区域列表
   * @param columns - 目标列数
   * @param totalWidth - 总宽度
   * @param gap - 列间距
   * @returns 分配后的区域列表（位置已更新）
   *
   * @example
   * ```typescript
   * const distributedRegions = distributeToColumns(
   *   [region1, region2, region3],
   *   2,
   *   120,
   *   2
   * );
   * ```
   */
  distributeToColumns(
    regions: ContentRegion[],
    columns: number,
    totalWidth: number,
    gap: number
  ): ContentRegion[];

  /**
   * 调整区域尺寸以适应新的布局模式
   *
   * @param region - 原始区域
   * @param oldMode - 旧布局模式
   * @param newMode - 新布局模式
   * @param newSize - 新终端尺寸
   * @returns 调整后的区域
   *
   * @example
   * ```typescript
   * const resizedRegion = adaptRegionToMode(
   *   headerRegion,
   *   LayoutMode.STANDARD,
   *   LayoutMode.WIDE,
   *   { width: 140, height: 35 }
   * );
   * ```
   */
  adaptRegionToMode(
    region: ContentRegion,
    oldMode: LayoutMode,
    newMode: LayoutMode,
    newSize: TerminalSize
  ): ContentRegion;
}

/**
 * 默认布局选项
 */
export const DEFAULT_LAYOUT_OPTIONS: Required<LayoutOptions> = {
  forceMode: undefined as unknown as LayoutMode,
  columnGap: 2,
  enableCache: true,
  cacheTTL: 5000
};

/**
 * 最小终端尺寸常量（from FR-009）
 */
export const MIN_TERMINAL_SIZE = {
  width: 60,
  height: 20
} as const;

/**
 * 布局模式阈值常量
 */
export const LAYOUT_MODE_THRESHOLDS = {
  COMPACT_MAX: 79,
  STANDARD_MIN: 80,
  STANDARD_MAX: 120,
  WIDE_MIN: 121
} as const;

/**
 * 防抖延迟常量（from research.md - 300ms）
 */
export const RESIZE_DEBOUNCE_MS = 300;
