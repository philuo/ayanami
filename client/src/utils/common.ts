const { toString } = Object.prototype;

/**
 * @function 检测类型
 * @param {*} target 待检测的数据
 * @param {string} type 期望的类型
 * null、undefined、boolean、string、number、set、map、
 * object、symbol、array、function、bigint、weakmap、weakset
 */
export function checkType(target: any, type: string) {
  if (type !== 'object' && typeof target === type) {
    return true;
  }

  return `[object ${type}]` === toString.call(target).toLowerCase();
}

/**
* 设置Promise的超时时间
* @param promise Promise
* @param timeout 超时时间 默认1500ms
* @param resonse 超时原因
*/
export function wraperTimeout(promise: Promise<any>, timeout = 1500, resonse?: string) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(
      new Error(resonse || `network timeout ${timeout} ms`)
    ), timeout);

    promise.then(res => {
      clearTimeout(timer);
      resolve(res);
    }).catch(err => {
      clearTimeout(timer);
      reject(err);
    });
  });
}

/**
 * unwrap promise
 */
export function makePromise<T>() {
  let resolve: (res: T) => void;
  let reject: (err: any) => void;
  const promise = new Promise<T>((success, error) => {
    resolve = success;
    reject = error;
  });

  // @ts-ignore
  promise.abort = (err = false) => err ? reject() : resolve();

  return {
    // @ts-ignore
    resolve,
    // @ts-ignore
    reject,
    promise
  };
}

/**
 * 参数序列化
 */
export function serialize(query: string, params: Record<string, any>) {
  const searchParams = new URLSearchParams(query);

  for (const key in params) {
    const value = params[key];
    if (value !== undefined && value !== null) {
      if (checkType(value, 'object')) {
        searchParams.set(key, JSON.stringify(value));
      }
      else {
        searchParams.set(key, value);
      }
    }
  }

  return searchParams.toString();
}

/**
* 合并get请求参数
*/
export function serializeUrl(url: string, data: any) {
  if (checkType(data, 'object')) {
    const [path, query] = url.split('?');
    const queryParams = serialize(query, data);

    return queryParams ? `${path}?${queryParams}` : path;
  }

  return url;
}


export function getAckId() {
  const head = Date.now();
  const tail = getRandomNumber();

  return __btoaNumeric(head + tail);
}

function __btoaNumeric(input: string) {
  const base64Charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let result = '';
  let padding = '';
  let position = 0;

  while (position < input.length) {
    const charCode = input.charCodeAt(position++);
    const nextCharCode = input.charCodeAt(position++);
    const lastCharCode = input.charCodeAt(position++);

    const encoded1 = charCode >> 2;
    const encoded2 = ((charCode & 3) << 4) | (nextCharCode >> 4);
    const encoded3 = ((nextCharCode & 15) << 2) | (lastCharCode >> 6);
    const encoded4 = lastCharCode & 63;

    result += base64Charset[encoded1] + base64Charset[encoded2] + base64Charset[encoded3] + base64Charset[encoded4];
  }

  // Check if the input length is not a multiple of 3, then add padding characters.
  const remaining = input.length % 3;
  if (remaining === 1) {
    padding = '==';
  }
  else if (remaining === 2) {
    padding = '=';
  }

  return result.slice(0, result.length - padding.length) + padding;
}

/**
 * 获取指定长度随机数
 * @returns 随机数字符串, **禁止长度超过20000**
 */
export function getRandomNumber(len = 12) {
  let result = '';
  let remainLen = len;
  const numberList = new Uint32Array(Math.round(len / 10));

  if (window.crypto && typeof window.crypto.getRandomValues === 'function') {
    crypto.getRandomValues(numberList);

    for (let i = 0; i < numberList.length; i += 1) {
      result += numberList[i];
      remainLen = len - result.length;
    }
  }

  if (remainLen <= 0) {
    return result.substring(0, len);
  }

  while (remainLen--) {
    result += Math.floor(Math.random() * 10);
  }

  return result;
}

/**
 * @param {Number} len uuid的长度
 * @param {Boolean} firstU 将返回的首字母置为"u"
 * @param {Nubmer} radix 生成uuid的基数(意味着返回的字符串都是这个基数),2-二进制,8-八进制,10-十进制,16-十六进制
 */
export function guid(len = 32, firstU = true, radix = null) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
  const uuid = [];
  radix = radix || chars.length;

  if (len) {
    // 如果指定uuid长度,只是取随机的字符,0|x为位运算,能去掉x的小数位,返回整数位
    for (let i = 0; i < len; i++) uuid[i] = chars[0 | Math.random() * radix];
  }
  else {
    let r;
    // rfc4122标准要求返回的uuid中,某些位为固定的字符
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-';
    uuid[14] = '4';

    for (let i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | Math.random() * 16;
        uuid[i] = chars[(i == 19) ? (r & 0x3) | 0x8 : r];
      }
    }
  }

  // 移除第一个字符,并用u替代,因为第一个字符为数值时,该guuid不能用作id或者class
  if (firstU) {
    uuid.shift();
    return `u${uuid.join('')}`;
  }

  return uuid.join('');
}

/**
 * 深拷贝数组/对象
 */
export function dpClone<T = any>(data: T, errBack?: T): T {
  try {
    return JSON.parse(JSON.stringify(data)) as T;
  }
  catch (e) {
    return (errBack || {}) as T;
  }
}

/**
 * 安全解析json
 */
export function safeParse<T = any>(data: any, errBack?: T): T {
  try {
    if (typeof data === 'string') {
      return JSON.parse(data) as T;
    }

    return (errBack || {}) as T;
  }
  catch (e) {
    return (errBack || {}) as T;
  }
}

/**
 * 当前应用是否以iframe的方式被嵌入到其他域
 */
export function isInIframe() {
  try {
    return window.self !== window.top;
  }
  catch (e) {
    // 跨域情况下可能抛出异常，默认认为被嵌入
    return true;
  }
}

/**
 * 毫秒转时间字符串 
 * @param ms 毫秒
 * @returns 时间字符串00:00:00格式
 */
export function transMs2Time(ms: number) {
  if (!ms) {
    return '00:00:00';
  }

  let h, m, s;

  const duration = ms / 1000;
  h = Math.floor(duration / 60 / 60).toString().padStart(2, '0');
  m = Math.floor(duration / 60 % 60).toString().padStart(2, '0');
  s = Math.floor(duration % 60).toString().padStart(2, '0');

  return `${h}:${m}:${s}`;
}

/**
 * 时间字符串转毫秒数
 * @param time 时间字符串00:00~00:00:00格式
 * @returns 毫秒数
 */
export function transTime2Ms(time: string) {  
  if (!time) {
    return 0;
  }

  if (time === '00:00:00' || time === '00:00') {
    return 0;
  }

  let [h, m, s] = time.split(':');
  let ms = 0;

  if (!s) {
    s = m;
    m = h;
    h = null;
  }

  if (h) {
    ms += Number(h) * 3600_000;
  }

  if (m) {
    ms += Number(m) * 60_000;
  }

  if (s) {
    ms += Number(s) * 1000;
  }

  return ms;
}


/**
 * 计算字节转换 K / M / G
 */
export function transBytes2Size(bytes: number, fixed = 2) {
  if (bytes < 1024) {
    return `${bytes}B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(fixed)}K`;
  }
  

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / 1024 / 1024).toFixed(fixed)}M`;
  }

  return `${(bytes / 1024 / 1024 / 1024).toFixed(fixed)}G`;
}

/**
 * 睡眠时间
 * @param ms 睡眠时间
 */
export function sleep(ms: number = 1000) {
  return new Promise(r => setTimeout(r, ms));
}

/**
 * 根据不同环境拼接图片链接
 */
export function fsfUrl(url: string) {
  const prefix = import.meta.env.VITE_IMG_URL;

  if (!url || typeof url !== 'string') {
    return '';
  }

  return prefix + (url[0] === '/' ? url : `/${url}`);
}
