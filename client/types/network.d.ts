/**
 * @file 网络请求工具类
 * @author Perfumere
 */
declare interface FetchOpts {
  method?: 'GET' | 'POST' | 'JSONP';
  data?: any;
  timeout?: number;
  retry?: number;
  signal?: AbortSignal;
  headers?: Record<string, any>;
  withCredentials?: boolean;
  responseType?: 'json' | 'text' | 'blob' | 'arrayBuffer';
  withToken?: boolean;
}

declare interface JsonpOpts {
  timeout?: number;
  retry?: number;
}

declare interface ApiInitOpts extends FetchOpts {
  /** 请求url */
  url: string;
  /** 过滤响应的数据载体 */
  handler?: (data: any) => any;
  /** 请求成功tip */
  successMsg?: string;
  /** 请求失败tip */
  errorMsg?: string;
  /** 忽略错误信息 */
  noErr?: boolean;
  /** 异常重试 */
  retry?: number;
}

declare interface ApiReturnVal<U = any> {
  /** 状态码 */
  code: string;
  /** 响应数据 */
  data: U;
  /** 错误原因 */
  message?: string;
  /** 是否发生网络错误 */
  netError?: boolean;
}

interface MessageUtil {
  success: (str: string) => void;
  error: (str: string) => void;
  info: (str: string) => void;
  warning: (str: string) => void;
}

declare global {
  var $message: MessageUtil;
}

declare const $message: MessageUtil;
