/**
 * HTTP响应code枚举
 */
export enum ResultEnum {
  /** 成功 */
  SUCCESS = '0000',
  /** 身份过期, 鉴权失败 401 */
  NOAUTH = '401'
}
