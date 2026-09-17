import {
  cloneElement,
  forwardRef,
  isValidElement,
  type CSSProperties,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
  type Ref,
} from 'react';

import { cx } from './cx';
import { mergeRefs } from './refs';

/**
 * Render delegation for `asChild` (RULES §5.7, D-003).
 *
 * Instead of rendering its own element, `Slot` clones its single child and
 * merges the component's props into it. Merge rules follow Radix so nobody has
 * to learn a second set:
 *
 *   - event handlers: both run, the child's first
 *   - `style`: shallow-merged, the child's values winning
 *   - `className`: joined
 *   - everything else: the child's prop wins
 *   - refs: both receive the node
 *
 * Internal. Not exported from the package.
 */

export interface SlotProps extends HTMLAttributes<HTMLElement> {
  children?: ReactNode;
}

type AnyProps = Record<string, unknown>;

/**
 * Reads the child's ref in a way that is quiet on both React 18 (where `ref`
 * lives on the element and `props.ref` warns) and React 19 (the reverse).
 */
function getElementRef(element: ReactElement<AnyProps>): Ref<unknown> | undefined {
  const propsDescriptor = Object.getOwnPropertyDescriptor(element.props, 'ref');
  if (propsDescriptor && 'isReactWarning' in propsDescriptor && propsDescriptor.isReactWarning) {
    return (element as unknown as { ref?: Ref<unknown> }).ref;
  }
  const elementDescriptor = Object.getOwnPropertyDescriptor(element, 'ref');
  if (elementDescriptor && 'isReactWarning' in elementDescriptor && elementDescriptor.isReactWarning) {
    return element.props.ref as Ref<unknown> | undefined;
  }
  return (element.props.ref as Ref<unknown> | undefined) ?? (element as unknown as { ref?: Ref<unknown> }).ref;
}

function mergeProps(slotProps: AnyProps, childProps: AnyProps): AnyProps {
  const merged: AnyProps = { ...slotProps };

  for (const key of Object.keys(childProps)) {
    const slotValue = slotProps[key];
    const childValue = childProps[key];

    if (/^on[A-Z]/.test(key) && typeof slotValue === 'function' && typeof childValue === 'function') {
      merged[key] = (...args: unknown[]) => {
        childValue(...args);
        slotValue(...args);
      };
    } else if (key === 'style') {
      merged.style = { ...(slotValue as CSSProperties), ...(childValue as CSSProperties) };
    } else if (key === 'className') {
      merged.className = cx(slotValue as string | undefined, childValue as string | undefined);
    } else {
      merged[key] = childValue;
    }
  }

  return merged;
}

export const Slot = forwardRef<HTMLElement, SlotProps>(function Slot({ children, ...slotProps }, forwardedRef) {
  if (!isValidElement<AnyProps>(children)) {
    throw new Error('[pixel-perfect] `asChild` expects exactly one React element as its child.');
  }

  const childRef = getElementRef(children);
  const merged = mergeProps(slotProps as AnyProps, children.props);

  // Attach a ref ONLY when one exists. A Server Component throws on any
  // element that carries a ref, and `forwardRef` hands us `null` when the
  // consumer passed none — so unconditionally merging refs would make `asChild`
  // unusable in every server component. Found by the playground prerender.
  if (forwardedRef || childRef) {
    merged.ref = mergeRefs(forwardedRef, childRef);
  }

  return cloneElement(children, merged);
});
