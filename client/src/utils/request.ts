
import { ResultEnum } from '@/configs/enum';
import {
  checkType,
  wraperTimeout,
  serializeUrl,
  makePromise
} from './common';

const isDev = import.meta.env.DEV;
const host = isDev ? location.origin : import.meta.env.VITE_API_HOST;
const upload_host = isDev ? location.origin : import.meta.env.VITE_UPLOAD_HOST;
const prefix = import.meta.env.VITE_HOST_PREFIX || '';
const headers = { 'Content-Type': 'application/json' };

export function jsonp(url: string, options?: JsonpOpts) {
  const option = Object.assign({}, options);
  const script = document.createElement('script');
  const randomTime = Math.trunc(Date.now() / 100);
  const randomNum = Math.trunc(Math.random() * 10000);
  const cb = `jsonp_${randomTime}${randomNum}`;

  script.src = `${url}${url.includes('?') ? '&' : '?'}cb=${cb}`;
  const jsonpPromise = new Promise((resolve, reject) => {
    // @ts-ignore 接口加载成功
    window[cb] = function (data: Record<string, any>) {
      resolve(data);
      // @ts-ignore
      delete window[cb];
      document.body.removeChild(script);
    };

    // 接口不存在直接抛出错误
    script.onerror = (err) => {
      // @ts-ignore
      delete window[cb];
      document.body.removeChild(script);
      reject(err);
    };
    document.body.appendChild(script);
  });
  const resPromise = wraperTimeout(jsonpPromise, option.timeout);

  if (!option.retry) {
    return resPromise;
  }

  return resPromise.catch(err => {
    if (option.retry) {
      return jsonp(url, Object.assign(options, { retry: options.retry - 1 }));
    }

    throw err;
  });
}

export function fetch(url: string, options?: FetchOpts) {
  const option = Object.assign({
    method: 'GET',
    responseType: 'json',
    withCredentials: false,
  }, options);

  // 请求方式处理
  const method = option.method.toUpperCase();
  const config: RequestInit = {
    method,
    headers: method === 'POST' ? { ...headers, ...option.headers } : option.headers,
    credentials: option.withCredentials ? 'same-origin' : 'omit',
    mode: 'cors'
  };

  // 请求加入信号控制器, 允许客户端主动断掉请求链接
  if (option.signal) {
    config.signal = option.signal;
  }

  // 请求数据处理
  const { data } = option;
  if (method === 'GET') {
    url = serializeUrl(url, data as Record<string, any>);
  }
  if (method === 'POST' && checkType(data, 'object')) {
    config.body = JSON.stringify(data);
  }
  const fetchPromise = window.fetch(url, config).then(res => {
    const { status } = res;

    if (status >= 200 && status < 300 || status === 304) {
      let result: Promise<any>;

      // 后面可能加utf-8等参数
      if (res.headers.get('content-type').startsWith('text/event-stream')) {
        return res.body!;
      }

      switch (option.responseType) {
        case 'json':
          result = res.json();
          break;
        case 'text':
          result = res.text();
          break;
        case 'blob':
          // 注意不要随意打印res, 否则res.blob会被提前解包 ！important
          result = res.blob();
          break;
        case 'arrayBuffer':
          result = res.arrayBuffer();
          break;
      }

      return result;
    }

    return Promise.reject(new Error('fetch error'));
  });
  const resPromise = wraperTimeout(fetchPromise, option.timeout);

  if (!option.retry) {
    return resPromise;
  }

  return resPromise.catch(err => {
    if (option.retry) {
      return fetch(url, Object.assign(options, { retry: options.retry - 1 }));
    }

    throw err;
  });
}

async function* __processStream(stream) {
  const reader = stream.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();

      if (done) {
        if (buffer) {
          const lines = buffer.split('\n').filter(v  => v.trim());

          for (const line of lines) {
            yield __parseStreamLine(line);
          }
        }

        yield { done: true };
        return;
      }

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop()  || ''; // 保存最后可能不完整的行
      // const lines = buffer
      //   .split('data:')
      //   .map(v => v.trim())
      //   .filter(v => v.trim());

      for (const line of lines) {
        if (line.trim()) {
          yield __parseStreamLine(line);
        }
      }
    }
  }
  catch (_) {/** None */}

  reader.releaseLock();
}

function __parseStreamLine(line: string) {
  if (line.startsWith('data:')) {
    const data = line.substring(5).trimStart();

    if (data === '[DONE]') {
      return { done: true };
    }
    else {
      return JSON.parse(data);
    }
  }

  return { raw: line };
}

function __handleApi(
  promise: Promise<any>,
  apiResolve: any,
  handler?: any,
  successMsg?: string,
  errorMsg?: string,
  noErr?: boolean,
) {
  promise.then((res: any) => {
    if (res instanceof ReadableStream) {
      successMsg && $toast?.show?.(successMsg);

      apiResolve({
        code: ResultEnum.SUCCESS,
        data: __processStream(res)
      });

      return;
    }
    if (res.code === ResultEnum.SUCCESS) {
      successMsg && $toast?.show?.(successMsg);

      if (checkType(handler, 'function')) {
        res.data = handler(res.data) || res.data;
      }
    }
    else if (res.code === ResultEnum.NOAUTH) {
      res.data = { code: ResultEnum.NOAUTH, data: null };
    }
    else if (res.message || errorMsg) {
      !noErr && $toast?.show?.(res.message || errorMsg);
    }

    apiResolve(res);
  }).catch(err => {
    if (err.message.includes('aborted')) {
      apiResolve({ netError: true, message: '请求已取消' });
      return;
    }
    else if (err.message !== 'fetch error') {
      !noErr && $toast?.show?.('请求超时, 请稍后重试');
    }
    else {
      !noErr && errorMsg && $toast?.show?.(errorMsg);
    }

    apiResolve({
      netError: err.message.startsWith('network timeout'),
      message: err.message
    });
  });
}

/**
* 调用API拉取数据
*/
export function API<T = any>(
  {
    url,
    method = 'GET',
    data,
    handler,
    timeout = 10000,
    headers,
    withToken = true,
    successMsg = '',
    errorMsg = '',
    noErr = false,
    retry = 0,
    responseType = 'json',
    signal = undefined
  }: ApiInitOpts
) {
  const { resolve, promise } = makePromise<ApiReturnVal<T>>();

  if (withToken) {
    const userInfo = window.userInfo || { token: '' };
    const { token } = userInfo;

    if (!token) {
      const resp = { code: ResultEnum.NOAUTH, data: null };
      resolve(resp);
      return promise;
    }

    headers = Object.assign({}, headers, { authorization: token });
  }

  if (!url.startsWith('http')) {
    url = url[0] === '/' ? `${host}${prefix}${url}` : `${host}${prefix}/${url}`;
  }

  if (method.toUpperCase() === 'JSONP') {
    __handleApi(
      jsonp(serializeUrl(url, data), { timeout, retry }),
      resolve,
      handler,
      successMsg,
      errorMsg,
      noErr
    );
  }
  else {
    __handleApi(
      fetch(url, { method, data, headers, timeout, retry, signal, responseType }),
      resolve,
      handler,
      successMsg,
      errorMsg,
      noErr
    );
  }

  return promise;
}

/**
 * 上传图片
 */
export function Upload<T = any>({
  url,
  data,
  handler,
  timeout = 10000,
  headers,
  withToken = true,
  successMsg = '',
  errorMsg = ''
}: ApiInitOpts) {
  const { resolve, promise } = makePromise<ApiReturnVal<T>>();

  if (!url.startsWith('http')) {
    url = url[0] === '/' ? `${upload_host}${prefix}${url}` : `${upload_host}${prefix}/${url}`;
  }

  if (withToken) {
    const userInfo = window.userInfo || { token: '' };
    const { token } = userInfo;

    if (!token) {
      const resp = { code: ResultEnum.NOAUTH, data: null };
      resolve(resp);
      return promise;
    }

    headers = Object.assign({}, headers, { authorization: token });
  }

  const config: RequestInit = {
    method: 'POST',
    headers,
    credentials: 'same-origin',
    mode: 'cors',
    body: data
  };

  const fetchPromise = window.fetch(url, config).then(res => {
    const { status } = res;

    if (status >= 200 && status < 300 || status === 304) {
      return res.json();
    }

    return Promise.reject(new Error('fetch error'));
  });

  __handleApi(
    wraperTimeout(fetchPromise, timeout),
    resolve,
    handler,
    successMsg,
    errorMsg
  );

  return promise;
}
