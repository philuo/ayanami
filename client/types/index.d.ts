declare interface Fn<T = any, R = T> {
  (...arg: T[]): R;
}

declare interface PromiseFn<T = any, R = T> {
  (...arg: T[]): Promise<R>;
}

declare type EmitType = (event: string, ...args: any[]) => void;

declare type TimerId = ReturnType<typeof setTimeout> | undefined;


declare type EventType = string | symbol;
declare type Handler<T = unknown> = (event: T) => void;
declare interface EventUtil<Events> {
  $on<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;
  $once<Key extends keyof Events>(type: Key, handler: Handler<Events[Key]>): void;
  $off<Key extends keyof Events>(type: Key, handler?: Handler<Events[Key]>): void;
  $emit<Key extends keyof Events>(type: Key, event?: Events[Key]): void;
}

declare interface Window {
  Emiter: EventUtil<Record<EventType, any>>;
}

declare const Emiter: EventUtil<Record<EventType, any>>;


interface MessageUtil {
  success: (str: string) => void;
  error: (str: string) => void;
  info: (str: string) => void;
  warning: (str: string) => void;
}

interface ToastUtil {
  /** 显示Toast消息 */
  show: (options: import('../src/components/toast/hooks').ToastOptions | string) => string;
  /** 显示成功Toast */
  success: (content: string | import('solid-js').JSX.Element, duration?: number) => string;
  /** 显示错误Toast */
  error: (content: string | import('solid-js').JSX.Element, duration?: number) => string;
  /** 显示信息Toast */
  info: (content: string | import('solid-js').JSX.Element, duration?: number) => string;
  /** 显示警告Toast */
  warning: (content: string | import('solid-js').JSX.Element, duration?: number) => string;
  /** 隐藏指定Toast */
  hide: (id: string) => void;
  /** 清空所有Toast */
  clear: () => void;
}

interface PopupUtil {
  show: (options: import('../src/views/components/popup').Props) => void;
}

declare interface Window {
  $message: MessageUtil;
  $toast: ToastUtil;
  $popup: PopupUtil;
}

declare const $message: MessageUtil;
declare const $toast: ToastUtil;
declare const $popup: PopupUtil;


declare module '*.scss' {
  /**
   * 将像素值转换为vw单位，带最大值限制
   * @param px - 像素值
   * @param base - 基准宽度，默认375
   * @param max - 最大宽度，默认430
   * @returns vw值
   * @example px2vw(200) // 基于375px转换
   * @example px2vw(200, 414, 500) // 自定义基准和最大值
   */
  function px2vw(px: number, base?: number, max?: number): string;
}
