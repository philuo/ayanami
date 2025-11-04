declare module 'solid-js' {
  namespace JSX {
    interface Directives {
      draggable: (() => any) | any;
    }
  }
}

interface ElType extends HTMLElement {
  parentNode: any;
}

function __registerTouch(el: ElType, accessor: () => any) {
  const passed = accessor();

  if (!passed || (typeof passed === 'function' && !passed())) {
    el.style.cursor = undefined;
    el.style.position = undefined;
    el.ontouchstart = undefined;
    document.ontouchmove = undefined;
    document.ontouchend = undefined;
    document.ontouchcancel = undefined;
    return;
  }

  el.style.cursor = 'move';
  el.style.position = 'fixed';
  el.ontouchstart = function (e: TouchEvent) {
    const rect = el.getBoundingClientRect();
    const disX = e.changedTouches[0].clientX - rect.left;
    const disY = e.changedTouches[0].clientY - rect.top;

    document.ontouchmove = function (e) {
      let x = e.changedTouches[0].clientX - disX;
      let y = e.changedTouches[0].clientY - disY;
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;

      if (x < 0) {
        x = 0;
      }
      else if (x > maxX) {
        x = maxX;
      }

      if (y < 0) {
        y = 0;
      }
      else if (y > maxY) {
        y = maxY;
      }

      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };

    document.ontouchend = document.ontouchcancel = function () {
      document.ontouchmove = document.ontouchend = document.ontouchcancel = null;
    };
  };

  onCleanup(() => {
    el.style.cursor = undefined;
    el.style.position = undefined;
    el.ontouchstart = undefined;
    document.ontouchmove = undefined;
    document.ontouchend = undefined;
    document.ontouchcancel = undefined;
  });
}

function __registerMouse(el: ElType, accessor: () => any) {
  const passed = accessor();

  if (!passed || (typeof passed === 'function' && !passed())) {
    el.style.cursor = undefined;
    el.style.position = undefined;
    el.onmousedown = undefined;
    document.onmousemove = undefined;
    document.onmouseup = undefined;
    return;
  }

  el.style.cursor = 'move';
  el.style.position = 'fixed';
  el.onmousedown = function (e: MouseEvent) {
    const rect = el.getBoundingClientRect();
    const disX = e.clientX - rect.left;
    const disY = e.clientY - rect.top;

    document.onmousemove = function (e: MouseEvent) {
      let x = e.clientX - disX;
      let y = e.clientY - disY;
      const maxX = window.innerWidth - el.offsetWidth;
      const maxY = window.innerHeight - el.offsetHeight;

      if (x < 0) {
        x = 0;
      }
      else if (x > maxX) {
        x = maxX;
      }

      if (y < 0) {
        y = 0;
      }
      else if (y > maxY) {
        y = maxY;
      }

      el.style.left = x + 'px';
      el.style.top = y + 'px';
    };

    document.onmouseup = function () {
      document.onmousemove = document.onmouseup = null;
    };
  };

  onCleanup(() => {
    el.style.cursor = undefined;
    el.style.position = undefined;
    el.onmousedown = undefined;
    document.onmousemove = undefined;
    document.onmouseup = undefined;
  });
}

export const draggable = (el: ElType, accessor: () => any) => {
  if (Util.isMobile()) {
    return __registerTouch(el, accessor);
  }

  __registerMouse(el, accessor);
};
