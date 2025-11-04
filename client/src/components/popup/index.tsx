import './index.scss';

type Props = {
  children?: JSX.Element;
  show?: boolean;
  showMask?: boolean;
  forceAppear?: boolean;
  maskClosable?: boolean;
  closeOnESC?: boolean;
  transformOrigin?: string;
  class?: string;
  draggable?: boolean;
  onBeforeClose?: () => void;
  onClose?: () => void;
  onAfterClose?: () => void;
};

const defaultProps = () =>
({
  show: false,
  showMask: true,
  forceAppear: true,
  maskClosable: true,
  closeOnESC: true,
  draggable: false
} as Props);

export function OPopup(p: Props) {
  const d = mergeProps(defaultProps(), p);
  const [show, setShow] = createSignal(d.show);
  const [mounted, setMounted] = createSignal(d.show);
  const [appear, setAppear] = createSignal(d.forceAppear);
  const [isEntering, setIsEntering] = createSignal(false);
  const [pendingClose, setPendingClose] = createSignal(false);
  const pos = useLastPointerDown();
  let modelContentRef: HTMLDivElement;
  const combineClass = createMemo(() => p.class ? `o_popup ${p.class}` : 'o_popup');
  
  // 首帧后才启用 appear（避免首帧无过渡）
  createEffect(() => setAppear(true));
  createEffect(
    on(
      () => p.show,
      (v) => {
        if (v) {
          setPendingClose(false);
          setMounted(true);
          setShow(true);
          // requestAnimationFrame(() => {
          //   const rect = modelContentRef.getBoundingClientRect();
          //   const x = pos.x - rect.x + rect.width / 2 | 0;
          //   const y = pos.y - rect.y + rect.height / 2 | 0;
          //   modelContentRef.style.transformOrigin = d.transformOrigin || `${x}px ${y}px`;
          // });
        }
        else {
          // 关闭：如果正处于进入动画，先挂起关闭；否则直接开始退出动画
          if (isEntering()) {
            setPendingClose(true);
          }
          else {
            setShow(false);
          }
        }
      },
      { defer: true }
    )
  );
  createEffect(() => {
    if (!show() || !d.closeOnESC) {
      return;
    }

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'Escape') {
        if (isEntering()) {
          return;
        }
        else {
          d.onBeforeClose?.();
          d.onClose?.();
        }
      }
    };

    window.addEventListener('keydown', onKeyDown);
    onCleanup(() => window.removeEventListener('keydown', onKeyDown));
  });

  /** Methods */
  const maskClose = () => {
    d.onBeforeClose?.();
    d.onClose?.();
  };

  return (
    <Teleport when={mounted()}>
      <div class={combineClass()}>
        <Transition name="fade-in" appear={appear()}>
          {show() && d.showMask && <div class="o_popup_mask" onClick={() => d.maskClosable && maskClose()} />}
        </Transition>

        <Transition
          name="slide-left"
          appear={appear()}
          onEnter={() => setIsEntering(true)}
          onAfterEnter={() => {
            setIsEntering(false);
            if (pendingClose()) {
              setPendingClose(false);
              setShow(false);
            }
          }}
          onAfterExit={() => {
            if (!show()) {
              setMounted(false);
              d.onAfterClose?.();
            }
          }}
        >
          {show() && <div ref={modelContentRef} class="o_popup_content" use:draggable={d.draggable}>{d.children}</div>}
        </Transition>
      </div>
    </Teleport>
  );
}
