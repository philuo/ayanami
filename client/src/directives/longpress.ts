declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      longpress: ({
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

export const longpress = (el: HTMLElement, accessor: () => any) => {
  const args = accessor();
  let callback: (e: Event) => any;
  let pressTimer: any = null;
  let longPressDuration = 500;

  if (typeof args === 'function') {
    callback = args;
  }
  else {
    const { handler, ts, stop } = args;
    callback = handler;
    longPressDuration = (+ts) || 500;
  
    if (stop) {
      callback = (e: Event) => {
        e?.stopPropagation?.();
        handler(e);
      };
    }
  }

  // 创建一个触发事件的处理器
  const start = (e) => {
    if (e.type === 'click' && e.button !== 0) {
      return; // 如果不是左键点击，则忽略
    }

    // 开始计时
    if (pressTimer === null) {
      let target: any = null;
      target = e.currentTarget;
      pressTimer = setTimeout(() => {
        // 调用传递的函数
        callback(e);
      }, longPressDuration);
    }
  };

  // 取消计时器
  const cancel = () => {
    if (pressTimer !== null) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  };

  // 添加事件监听器
  el.addEventListener('mousedown', start);
  el.addEventListener('touchstart', start);
  el.addEventListener('click', cancel);
  el.addEventListener('mouseout', cancel);
  el.addEventListener('touchend', cancel);
  el.addEventListener('touchcancel', cancel);

  onCleanup(() => {
    el.removeEventListener('mousedown', start);
    el.removeEventListener('touchstart', start);
    el.removeEventListener('click', cancel);
    el.removeEventListener('mouseout', cancel);
    el.removeEventListener('touchend', cancel);
    el.removeEventListener('touchcancel', cancel);
  });
}
