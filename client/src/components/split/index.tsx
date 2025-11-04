import './index.scss';

type Direction = 'horizontal' | 'vertical';

type Props = {
  /** 方向，水平/垂直 */
  direction?: Direction;
  /** 初始比例，长度应等于子项数量，和为 1；缺省则等分 */
  ratios?: number[];
  /** 拖拽时回调，返回最新比例（归一化） */
  onChange?: (ratios: number[]) => void;
  /** 最小像素尺寸，防止被拖没 */
  minSize?: number;
  /** 最大像素尺寸，不填则不限制 */
  maxSize?: number;
  /** 间隙大小（px） */
  gapSize?: number;
  /** 容器类名 */
  class?: string;
  /** 子元素（OSplitItem 列表） */
  children?: JSX.Element;
};

type ItemProps = {
  children?: JSX.Element;
  minSize?: number;
  maxSize?: number;
  class?: string;
};

const defaultProps = () => ({
  direction: 'horizontal' as Direction,
  minSize: 60,
  gapSize: 6
} as Props);

function clamp(val: number, min: number, max: number) {
  return Math.max(min, Math.min(max, val));
}

/**
 * OSplit: 多栏分割容器，支持水平/垂直，相邻手柄拖拽只影响相邻两栏比例
 */
export function OSplit(p: Props) {
  const d = mergeProps(defaultProps(), p);
  let rootRef: HTMLDivElement;
  const paneRefs: HTMLDivElement[] = [];
  const resolved = children(() => d.children);
  const panes = createMemo(() => {
    const c = resolved() as unknown as JSX.Element[] | JSX.Element | null | undefined;
    const arr = Array.isArray(c) ? c : (c ? [c] : []);
    const list = (arr as any[]).flat().filter(Boolean) as JSX.Element[];
    return list;
  });
  const count = createMemo(() => Math.max(2, panes().length));

  const getInitialRatios = () => {
    const n = count();
    if (d.ratios && d.ratios.length === n) {
      const sum = d.ratios.reduce((a, b) => a + b, 0) || 1;
      return d.ratios.map(v => v / sum);
    }
    return Array.from({ length: n }, () => 1 / n);
  };

  const [ratios, setRatios] = createSignal<number[]>(getInitialRatios());

  createEffect(on(() => d.ratios, (r) => {
    if (r && r.length === count()) {
      const sum = r.reduce((a, b) => a + b, 0) || 1;
      setRatios(r.map(v => v / sum));
    }
  }));

  createEffect(on(count, (n) => {
    if (n !== ratios().length) {
      setRatios(Array.from({ length: n }, () => 1 / n));
    }
  }));

  /** 拖拽状态 */
  const [dragIndex, setDragIndex] = createSignal<number | null>(null);
  const [startPos, setStartPos] = createSignal(0);
  const [startRatios, setStartRatios] = createSignal<number[]>(ratios());

  const isHorizontal = () => d.direction === 'horizontal';

  const onPointerDown = (idx: number, e: PointerEvent) => {
    if (!rootRef) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    setDragIndex(idx);
    setStartPos(isHorizontal() ? e.clientX : e.clientY);
    setStartRatios(ratios());
  };

  const onPointerMove = (e: PointerEvent) => {
    if (dragIndex() == null || !rootRef) return;
    const rect = rootRef.getBoundingClientRect();
    const totalSize = isHorizontal() ? rect.width : rect.height;
    const idx = dragIndex()!;

    const deltaPx = (isHorizontal() ? e.clientX : e.clientY) - startPos();
    const deltaRatio = deltaPx / totalSize;

    const curr = startRatios().slice();
    // 读取 per-pane min/max，缺省回退到 OSplit
    const leftItem = paneRefs[idx]?.firstElementChild as HTMLElement | null;
    const rightItem = paneRefs[idx + 1]?.firstElementChild as HTMLElement | null;
    const lminAttr = leftItem?.dataset.min;
    const rminAttr = rightItem?.dataset.min;
    const lmaxAttr = leftItem?.dataset.max;
    const rmaxAttr = rightItem?.dataset.max;
    const leftMinPx = lminAttr !== undefined && lminAttr !== '' ? Number(lminAttr) : d.minSize!;
    const rightMinPx = rminAttr !== undefined && rminAttr !== '' ? Number(rminAttr) : d.minSize!;
    const leftMaxPx = lmaxAttr !== undefined && lmaxAttr !== '' ? Number(lmaxAttr) : (d.maxSize ?? Infinity);
    const rightMaxPx = rmaxAttr !== undefined && rmaxAttr !== '' ? Number(rmaxAttr) : (d.maxSize ?? Infinity);
    // 将像素限制换算为比例（gap 不占空间，无需分摊）
    const minL = leftMinPx / totalSize;
    const minR = rightMinPx / totalSize;
    const maxL = leftMaxPx / totalSize;
    const maxR = rightMaxPx / totalSize;

    let left = curr[idx] + deltaRatio;
    let right = curr[idx + 1] - deltaRatio;
    const others = curr.reduce((s, v, i) => i !== idx && i !== idx + 1 ? s + v : s, 0);
    const available = 1 - others;
    // 先按 min 保证可用范围内，再按 max 约束，保持总和为 available
    left = clamp(left, minL, available - minR);
    right = available - left;
    right = clamp(right, minR, Math.min(maxR, available - minL));
    left = available - right;
    left = clamp(left, minL, Math.min(maxL, available - minR));
    right = available - left;
    curr[idx] = left;
    curr[idx + 1] = right;
    setRatios(curr);
    d.onChange?.(curr);
  };

  const onPointerUp = (e: PointerEvent) => {
    if (dragIndex() == null) return;
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
    setDragIndex(null);
  };

  const gapSize = () => d.gapSize!;

  const itemIndices = createMemo(() => Array.from({ length: count() }, (_, i) => i));

  return (
    <div
      ref={rootRef}
      class={d.class ? `o_split ${d.class}` : 'o_split'}
      classList={{ 'is-horizontal': isHorizontal(), 'is-vertical': !isHorizontal() }}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <Index each={itemIndices()}>
        {(idx) => (
          <>
            <div
              class="o_split_pane"
              ref={el => paneRefs[idx()] = el}
              style={
                isHorizontal()
                  ? { width: `${(ratios()[idx()] * 100).toFixed(4)}%` }
                  : { height: `${(ratios()[idx()] * 100).toFixed(4)}%` }
              }
            >
              {/* 渲染对应的子项 */}
              {panes()[idx()]}
            </div>
            {/* gutter 改为覆盖层渲染，不占据布局空间 */}
          </>
        )}
      </Index>
      {/* 覆盖层 gutters */}
      <div class="o_split_gutters">
        <Index each={createMemo(() => {
          const rs = ratios();
          const arr: number[] = [];
          let acc = 0;
          for (let i = 0; i < rs.length - 1; i++) { acc += rs[i]; arr.push(acc * 100); }
          return arr;
        })()}>
          {(pct, i) => (
            <div
              role="separator"
              aria-orientation={isHorizontal() ? 'vertical' : 'horizontal'}
              class="o_split_gutter"
              style={
                isHorizontal()
                  ? { left: `calc(${(pct() as number).toFixed(4)}% - ${gapSize() / 2}px)`, width: `${gapSize()}px`, top: '0', bottom: '0' }
                  : { top: `calc(${(pct() as number).toFixed(4)}% - ${gapSize() / 2}px)`, height: `${gapSize()}px`, left: '0', right: '0' }
              }
              onPointerDown={[onPointerDown, i as unknown as number]}
            />
          )}
        </Index>
      </div>
    </div>
  );
}

/** 子项容器：语义化包装，便于未来扩展（如固定最小宽度等） */
export function OSplitItem(p: ItemProps) {
  const min = p.minSize;
  const max = p.maxSize;
  const customClass = p.class ? `${p.class} o_split_item` : 'o_split_item';

  return (
    <div data-min={min ?? ''} data-max={max ?? ''} class={`${customClass} o-w10 o-h10`}>
      {p.children as unknown as JSX.Element}
    </div>
  ) as unknown as JSX.Element;
}


