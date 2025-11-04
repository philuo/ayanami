interface WebStorage {
  /**
   * 依据键名取缓存
   * @param key 键名
   * @param def 缓存不存在时, 默认值
   */
  get(key: string, def?: any): any;
  /**
   * 设置缓存, 默认存储不主动失效
   * @param key 键名
   * @param value 键值
   * @param expire 失效时间
   */
  set(key: string, value: any, expire?: number | null): void;
  /**
   * 依据键名删除缓存
   * @param key 键名
   */
  remove(key: string): void;
  /**
   * 清空缓存, 重置
   */
  clear(): void;
}

declare interface Window {
  storage: WebStorage;
}

declare const storage: WebStorage;
