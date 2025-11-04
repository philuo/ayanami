/**
 * @file 环境判断
 * @author Perfumere
 */

const ua = navigator?.userAgent || '';

export default {
  /**
   * 是否为IOS系统
   */
  isIOS() {
    return !!ua.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
  },

  /**
   * 是否为Android系统
   */
  isAndroid() {
    return ua.indexOf('Android') > -1 || ua.indexOf('Adr') > -1;
  },

  /**
   * 是否为移动端
   */
  isMobile() {
    return /Mobi|Android|iPhone/i.test(ua);
  }
};
