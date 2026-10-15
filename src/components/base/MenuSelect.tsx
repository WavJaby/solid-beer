import { createSignal, For, type JSX, Show } from 'solid-js';
import './MenuSelect.css';

export interface MenuOption<T = string> {
  value: T;
  label: string;
}

export interface MenuSelectProps<T = string> {
  options: MenuOption<T>[];
  value?: T;
  onSelect: (value: T | undefined) => void;
  /** Adds a first entry that selects `undefined`; also used as placeholder when nothing is selected. */
  emptyOptionLabel?: string;
  /** Accessible trigger label; selected option remains the visible text. */
  label?: string;
  /** Form field name: a hidden input carries `String(value)` so native `<form>` submit / FormData sees the selection. Nothing is submitted while unselected. */
  name?: string;
  /** Native BeerCSS button classes. */
  class?: string;
  disabled?: boolean;
  /** Native form validation through a transparent text input below the trigger. */
  required?: boolean;
}

/** BeerCSS button/menu selection + hidden native form value. */
const MenuSelect = <T,>(props: MenuSelectProps<T>) => {
  const [open, setOpen] = createSignal(false);
  const selected = () => props.options.find(option => option.value === props.value);
  const text = () =>
    selected()?.label ?? (props.value === undefined ? props.emptyOptionLabel ?? 'Select...' : 'Unknown option');

  const choose = (value: T | undefined) => {
    setOpen(false);
    props.onSelect(value);
  };
  const onKeyDown: JSX.EventHandler<HTMLButtonElement, KeyboardEvent> = event => {
    if (event.key === 'Escape') event.currentTarget.blur();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
    }
  };

  return (
    <div class="solid-beer-menu-select">
      <div>
        <button
          type="button"
          class={props.class}
          disabled={props.disabled}
          aria-label={props.label}
          aria-expanded={open()}
          onBlur={() => setOpen(false)}
          onClick={event => {
            event.preventDefault();
            if (open()) event.currentTarget.blur();
            else setOpen(true);
          }}
          onKeyDown={onKeyDown}
        >
          <span>{text()}</span>
          <i>arrow_drop_down</i>
        </button>
        <Show when={props.name && props.value !== undefined}>
          <input type="hidden" name={props.name} value={String(props.value)} disabled={props.disabled} />
        </Show>
        <menu class="no-wrap" classList={{ active: open() }}>
          <Show when={props.emptyOptionLabel}>
            <li classList={{ active: props.value === undefined }} onClick={() => choose(undefined)}>
              <span>{props.emptyOptionLabel}</span>
            </li>
          </Show>
          <For each={props.options}>
            {option => (
              <li classList={{ active: option.value === props.value }} onClick={() => choose(option.value)}>
                <span>{option.label}</span>
              </li>
            )}
          </For>
        </menu>
      </div>
      <Show when={props.required}>
        {/* Outside menu parent: validation focus must not trigger BeerCSS focus-within opening. No name: validation only. */}
        <input
          type="text"
          class="solid-beer-menu-validation"
          tabIndex={-1}
          aria-label={props.label ?? 'Selection'}
          required
          disabled={props.disabled}
          value={props.value === undefined ? '' : 'selected'}
          onBeforeInput={event => event.preventDefault()}
          onInput={event => {
            event.currentTarget.value = props.value === undefined ? '' : 'selected';
          }}
        />
      </Show>
    </div>
  );
};

export default MenuSelect;
