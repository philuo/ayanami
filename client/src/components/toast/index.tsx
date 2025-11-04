import './index.scss';

interface ToastItem {
  /** 唯一标识 */
  id: string;
  /** Toast类型 */
  type: 'normal' | 'success' | 'error' | 'info' | 'warning';
  /** 显示时长(ms) */
  duration: number;
  /** 显示内容 */
  content: string | JSX.Element;
  /** 创建时间戳 */
  timestamp: number;
  /** z-index层级 */
  zIndex: number;
  /** 是否显示 */
  visible: boolean;
}

interface ToastState {
  /** Toast列表 */
  toasts: ToastItem[];
  /** 当前最大z-index */
  maxZIndex: number;
}

const initState = (): ToastState => ({
  toasts: [],
  maxZIndex: 1000
});

const toastStore = createSignal(initState());

/** Toast Store 操作方法 */
export const toastActions = {
  /** 添加Toast */
  add: (toast: Omit<ToastItem, 'id' | 'timestamp' | 'zIndex' | 'visible'>) => {
    const [state, setState] = toastStore;
    const newToast: ToastItem = {
      ...toast,
      id: `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      zIndex: state().maxZIndex + 1,
      visible: true
    };

    setState({
      toasts: [...state().toasts, newToast],
      maxZIndex: newToast.zIndex
    });

    return newToast.id;
  },

  /** 移除Toast */
  remove: (id: string) => {
    const [state, setState] = toastStore;
    setState({
      ...state(),
      toasts: state().toasts.filter(toast => toast.id !== id)
    });
  },

  /** 清空所有Toast */
  clear: () => {
    const [state, setState] = toastStore;
    setState(initState());
  }
};

interface ToastItemProps {
  item: ToastItem;
  onRemove: (id: string) => void;
}

// 单个Toast项组件
function ToastItemComponent(props: ToastItemProps) {
  const [show, setShow] = createSignal(true);

  const handleRemove = () => {
    setShow(false);
    // 等待transition动画完成后再移除
    setTimeout(() => props.onRemove(props.item.id), 220);
  };

  // 自动移除Toast
  setTimeout(handleRemove, props.item.duration);

  return (
    <div
      class="toast-item-wrapper"
      style={{ 
        'z-index': props.item.zIndex,
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        'pointer-events': 'none'
      }}
    >
      <Transition name="fade-in-scale-up" appear>
        <Show when={show()}>
          <div
            class={`toast-item toast-${props.item.type}`}
            style={{ 'pointer-events': 'auto' }}
          >
            <Show 
              when={typeof props.item.content === 'string'}
              fallback={props.item.content}
            >
              {props.item.content as string}
            </Show>
          </div>
        </Show>
      </Transition>
    </div>
  );
}

// Toast容器组件
export function OToast() {
  const [toasts] = toastStore;

  const onRemove = (id: string) => {
    const [, setState] = toastStore;
    setState(prev => ({
      ...prev,
      toasts: prev.toasts.filter(toast => toast.id !== id)
    }));
  };

  return (
    <Teleport when={toasts().toasts.length > 0}>
      <div class="o_toast">
        <For each={toasts().toasts}>
          {v => <ToastItemComponent item={v} onRemove={onRemove} />}
        </For>
      </div>
    </Teleport>
  );
}
