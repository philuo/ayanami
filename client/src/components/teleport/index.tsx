import {
  createEffect,
  createRenderEffect,
  createRoot,
  getOwner,
  runWithOwner,
} from 'solid-js';
import { insert } from 'solid-js/web';
import type { JSX, Accessor } from 'solid-js';

type TeleportProps = {
  mount?: HTMLElement | null;
  when?: boolean | Accessor<boolean>;
  children: JSX.Element;
};

export function Teleport(props: TeleportProps) {
  const owner = getOwner();
  let parentEl: HTMLElement | null = null;
  let disposeCurrent: (() => void) | null = null;
  let baselineTail: ChildNode | null = null;
  let managedFirst: ChildNode | null = null;
  let managedLast: ChildNode | null = null;

  const disposeRoot = () => {
    if (disposeCurrent) {
      disposeCurrent();
      disposeCurrent = null;
    }
  };

  const updateManagedBounds = () => {
    if (!parentEl) return;
    const first = baselineTail ? baselineTail.nextSibling : parentEl.firstChild;
    const last = parentEl.lastChild;
    if (!first || !last || first === baselineTail) {
      managedFirst = null;
      managedLast = null;
      return;
    }
    managedFirst = first;
    managedLast = last;
  };

  const mountInto = (target: HTMLElement) => {
    parentEl = target;
    baselineTail = parentEl.lastChild;
    runWithOwner(owner, () => {
      createRoot(dispose => {
        disposeCurrent = dispose;
        createRenderEffect(() => {
          insert(parentEl as Node, () => props.children, null);
          updateManagedBounds();
        });
        return undefined as unknown as void;
      });
    });
  };

  const moveManagedTo = (nextParent: HTMLElement) => {
    if (!parentEl || parentEl === nextParent) return;
    const newBaseline = nextParent.lastChild;
    if (!managedFirst || !managedLast) {
      parentEl = nextParent;
      baselineTail = newBaseline;
      updateManagedBounds();
      return;
    }
    let node: ChildNode | null = managedFirst;
    const lastToMove: ChildNode = managedLast;
    while (node) {
      const next = node === lastToMove ? null : node.nextSibling;
      nextParent.appendChild(node);
      if (node === lastToMove) break;
      node = next;
    }
    parentEl = nextParent;
    baselineTail = newBaseline;
    // remark start & end
    managedFirst = newBaseline ? (newBaseline.nextSibling as ChildNode | null) : (nextParent.firstChild as ChildNode | null);
    managedLast = lastToMove;
  };

  const cleanupManaged = () => {
    if (parentEl && managedFirst && managedLast) {
      let node: ChildNode | null = managedFirst;
      const lastToRemove: ChildNode = managedLast;
      while (node) {
        const next = node === lastToRemove ? null : node.nextSibling;
        parentEl.removeChild(node);
        if (node === lastToRemove) break;
        node = next;
      }
    }
    managedFirst = null;
    managedLast = null;
    baselineTail = null;
    parentEl = null;
  };

  createEffect(() => {
    const shouldRender = props.when ?? true;
    const target = (props.mount || document.body) as HTMLElement;

    if (!shouldRender) {
      disposeRoot();
      cleanupManaged();
      return;
    }

    if (parentEl && parentEl !== target) {
      moveManagedTo(target);
    } else if (!parentEl) {
      mountInto(target);
    } else if (!disposeCurrent) {
      mountInto(target);
    }
  });

  onCleanup(() => {
    disposeRoot();
    cleanupManaged();
  });

  return null;
}
