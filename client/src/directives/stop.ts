declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      stop: (() => any) | any;
    }
  }
}

/**
 * stop 指令
 * 按钮点击禁用冒泡时间
 * @param el - 指令应用的 HTML 元素, 框架默认传递的
 * @param accessor - 布尔值或返回布尔值的函数，为 false 时禁用效果。
 */
export const stop = (el: HTMLElement, accessor: () => any) => {
  const handleClick = (e: TouchEvent | MouseEvent) => {
    const passed = accessor();

    // 检查禁用条件
    if (!passed || (typeof passed === 'function' && !passed())) {
      return;
    }

    e.stopImmediatePropagation();
  };

  // el.addEventListener('click', handleClick, { passive: true });
  el.addEventListener('click', handleClick);

  // onCleanup 会在元素被销毁时执行，用于清理事件监听器
  onCleanup(() => {
    el.removeEventListener('click', handleClick);
  });
};
