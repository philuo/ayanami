import { toastActions } from './index';

type ToastType = 'normal' | 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  /** Toast类型，默认为info */
  type?: ToastType;
  /** 显示时长(ms)，默认为2000ms */
  duration?: number;
  /** 显示内容，支持字符串或JSX元素 */
  content: string | JSX.Element;
}

/**
 * 显示Toast消息
 * @param options Toast选项
 * @returns Toast的唯一ID
 */
function showToast(options: ToastOptions | string): string {
  toastActions.clear();

  if (typeof options === 'string') {
    return toastActions.add({
      type: 'normal',
      duration: 2000,
      content: options
    });
  }

  return toastActions.add({
    type: options.type || 'normal',
    duration: options.duration || 2000,
    content: options.content
  });
}

/**
 * 显示成功Toast
 * @param content 显示内容
 * @param duration 显示时长(ms)，默认2000ms
 */
function showSuccessToast(
  content: string | JSX.Element, 
  duration: number = 2000
): string {
  return showToast({ type: 'success', content, duration });
}

/**
 * 显示错误Toast
 * @param content 显示内容
 * @param duration 显示时长(ms)，默认2000ms
 */
function showErrorToast(
  content: string | JSX.Element, 
  duration: number = 2000
): string {
  return showToast({ type: 'error', content, duration });
}

/**
 * 显示信息Toast
 * @param content 显示内容
 * @param duration 显示时长(ms)，默认2000ms
 */
function showInfoToast(
  content: string | JSX.Element, 
  duration: number = 2000
): string {
  return showToast({ type: 'info', content, duration });
}

/**
 * 显示警告Toast
 * @param content 显示内容
 * @param duration 显示时长(ms)，默认2000ms
 */
function showWarningToast(
  content: string | JSX.Element, 
  duration: number = 2000
): string {
  return showToast({ type: 'warning', content, duration });
}

/**
 * 移除指定的Toast
 * @param id Toast的唯一ID
 */
function hideToast(id: string): void {
  toastActions.remove(id);
}

/**
 * 清空所有Toast
 */
function clearAllToasts(): void {
  toastActions.clear();
}

// 导出Toast API集合
export const toast = {
  show: showToast,
  success: showSuccessToast,
  error: showErrorToast,
  info: showInfoToast,
  warning: showWarningToast,
  hide: hideToast,
  clear: clearAllToasts
};
