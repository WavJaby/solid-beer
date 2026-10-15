import { type Accessor, type Component, createSignal, For, type JSX, type ParentProps } from 'solid-js';
import { openCodeDialog } from './CodeDialog';
import type { DemoEntry, DemoSource, ExampleModeControl } from './example';

/** Page section: anchor target for the left rail + `h4` title, spacing per beercss.com. */
export const DemoSection: Component<ParentProps<{ id: string; title: string }>> = props => (
  <section id={props.id}>
    <div class="large-space" />
    <h4>{props.title}</h4>
    {props.children}
  </section>
);

export interface DemoGroupProps {
  title: string;
  /** Compiler-generated render factories + reactive source getters. */
  entries?: readonly DemoEntry[];
  /** Compiler-generated group source; shared imports + declarations occur once. */
  source?: DemoSource;
  /** BeerCSS docs file name without `.md`; omit for library-only groups. */
  doc?: string;
  /** Option radios rendered between the title and the previews. */
  options?: JSX.Element;
  /** Classes on the default preview row. */
  class?: string;
  /** Direct example JSX; consumed by the demo compiler. */
  children?: JSX.Element;
}

/** Titled sample group with the `code` chip that opens the sample dialog. */
export const DemoGroup: Component<DemoGroupProps> = props => {
  const [mode, setMode] = createSignal<'native' | 'component'>('component');
  const control: ExampleModeControl = { mode, setMode };
  const paired = () => {
    const entries = props.entries!;
    return entries.length > 0 && entries.every(entry => entry.nativeCode);
  };
  return (
    <>
      <div class="medium-space" />
      <h3 class="h6">
        <span>{props.title}</span>
        <button
          class="chip circle"
          title="Show code"
          onClick={() =>
            openCodeDialog({
              title: props.title,
              entries: props.entries!,
              source: props.source!,
              doc: props.doc,
              syntax: paired() ? control : undefined,
            })
          }
        >
          <i>code</i>
        </button>
      </h3>
      {props.options}
      <div class={props.class ?? 'row wrap large-space'}>
        <For each={props.entries}>{entry => entry.render()}</For>
      </div>
    </>
  );
};

export interface Option<T extends string = string> {
  readonly options: readonly T[];
  readonly value: Accessor<T>;
  readonly set: (value: T) => void;
}

/** Radio-backed class option. `''` means "no helper class" and is labelled `defaultLabel` in the UI. */
export const createOption = <const T extends readonly string[]>(
  options: T,
  initial: T[number] = options[0]!,
): Option<T[number]> => {
  const [value, set] = createSignal(initial);
  return { options, value, set };
};

export const OptionGroup = <T extends string>(props: { name: string; option: Option<T>; defaultLabel?: string }) => (
  <For each={props.option.options}>
    {choice => (
      <label class="radio">
        <input
          type="radio"
          name={props.name}
          checked={props.option.value() === choice}
          onChange={() => props.option.set(choice)}
        />
        <span>{choice || props.defaultLabel || 'default'}</span>
      </label>
    )}
  </For>
);

/** Wrapping nav for one or more `OptionGroup`s. */
export const Options: Component<ParentProps> = props => <nav class="wrap">{props.children}</nav>;
