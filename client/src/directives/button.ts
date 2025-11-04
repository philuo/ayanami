declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      button: (() => any) | any;
    }
  }
}

/**
 * button 指令
 * 按钮点击时提供一个简单的缩放动画，并可选择性地禁用。
 * @param el - 指令应用的 HTML 元素, 框架默认传递的
 * @param accessor - 布尔值或返回布尔值的函数，为 false 时禁用点击效果。
 */
export const button = (el: HTMLElement, accessor: () => any) => {
  const handleClick = () => {
    const passed = accessor();

    // 检查禁用条件
    if (!passed || (typeof passed === 'function' && !passed())) {
      return;
    }

    // 应用动画效果
    const oriStyleTransition = el.style.transition;
    el.style.transition = 'transform .15s ease-out';
    el.style.transform = 'scale(.95)';

    setTimeout(() => {
      el.style.transform = '';
      setTimeout(() => el.style.transition = oriStyleTransition, 140);
    }, 140);
  };

  // el.addEventListener('click', handleClick, { passive: true });
  el.addEventListener('click', handleClick);

  // onCleanup 会在元素被销毁时执行，用于清理事件监听器
  onCleanup(() => {
    el.removeEventListener('click', handleClick);
  });
};
