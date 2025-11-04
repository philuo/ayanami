type DateFormat = 'hh:mm' | 'yyyy-mm-dd hh:mm' | 'mm-dd hh:mm';

interface CommonUtil {
  /**
   * 解析时间戳到日期字符串
   * @param num 毫秒级时间戳
   * @param format 日期输出格式
   */
  formatDate(num: number, format?: DateFormat): string;
  isIOS: () => boolean;
  isAndroid: () => boolean;
  isMobile: () => boolean;
}

interface UniJumpParams {
  url: string;
}

interface UniUtil {
  /** WebView返回App */
  navigateBack(): void;
  /** 跳转至App指定落地页面 */
  navigateTo(data: UniJumpParams): void;
  /** 跳转至App指定Tab页 */
  switchTab(data: UniJumpParams): void;
  /** 消息通信 */
  postMessage(data: any): void;
}

interface UserInfo {
  /** 用户身份令牌 */
  token: string;
  /** 会话id */
  chat_id?: string;
  /** 其他字段 */
  [key: string]: any;
}

declare interface Window {
  Util: CommonUtil;
  statusHeight: number;
  userInfo: UserInfo;
  uni: UniUtil;
  isWX: boolean;
  wx: any;
  hljs: any;
}

declare const Util: CommonUtil;
declare const uni: UniUtil;
declare const userInfo: UserInfo;
declare const wx: any;
