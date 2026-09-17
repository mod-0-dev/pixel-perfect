import type { Ref, RefCallback } from 'react';

/**
 * One ref callback that feeds several refs. Used by `Slot` so that both the
 * consumer's ref and the child element's own ref receive the node.
 */
export function mergeRefs<T>(...refs: Array<Ref<T> | undefined | null>): RefCallback<T> {
  return (node) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as { current: T | null }).current = node;
      }
    }
  };
}
