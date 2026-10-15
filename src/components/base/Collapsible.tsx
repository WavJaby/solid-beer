import { createSignal, type JSX, type ParentProps } from 'solid-js';
import './Collapsible.css';

export interface CollapsibleProps {
  defaultOpen?: boolean;
  title: JSX.Element;
  class?: string;
}

/** Animated expansion panel. Open state is Solid-owned (no BeerCSS `data-ui` toggle): a reactive `class` would otherwise wipe an externally toggled `active`. Header is a div, not a label: a label re-dispatches clicks to its inner button, toggling twice. */
export function Collapsible(props: ParentProps<CollapsibleProps>) {
  const [open, setOpen] = createSignal(props.defaultOpen ?? true);

  return (
    <article class={`collapsible round ${open() ? 'active' : ''} ${props.class ?? ''}`}>
      <div class="row padding tw:cursor-pointer" onClick={() => setOpen(value => !value)}>
        <div class="max">{props.title}</div>
        <button class="collapsible-toggle circle transparent" type="button" aria-expanded={open()}>
          <i>expand_more</i>
        </button>
      </div>
      <div class="collapsible-content no-round">
        <div>{props.children}</div>
      </div>
    </article>
  );
}
