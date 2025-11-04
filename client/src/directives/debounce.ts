import { debounce as debounceWrap } from 'lodash-es';

declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      debounce: ({
        /** 事件处理函数 */
        handler: (e: Event) => any;
        /** 防抖时间 */
        ts?: number;
        /** 阻止事件冒泡 */
        stop?: boolean;
      }) | ((e?: any) => any);
    }
  }
}

// args: 500ms, stop: stopPropagation, value: fn
export const debounce = (el: HTMLElement, accessor: () => any) => {
  const args = accessor();
  let callback: (e: Event) => any;
  let timeout = 500;
  const options = { leading: true, trailing: false };
  
  if (typeof args === 'function') {
    callback = args;
  }
  else {
    const { handler, ts, stop } = args;
    callback = handler;
    timeout = (+ts) || 500;
  
    if (stop) {
      callback = (e: Event) => {
        e?.stopPropagation?.();
        handler(e);
      };
    }
  }

  callback = debounceWrap(callback, timeout, options);
  el.addEventListener('click', callback);

  onCleanup(() => {
    el.removeEventListener('click', callback);
  });
}
