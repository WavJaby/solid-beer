import { type Component, createSignal, For, Show } from 'solid-js';
import { dialog } from '../../src';
import { highlightJsx } from './highlight';
import type { DemoSource, DemoEntry, ExampleModeControl } from './example';
import { ExampleModeSwitch } from './ExampleModeSwitch';

const BEERCSS_DOCS = 'https://github.com/beercss/beercss/blob/main/docs';

export interface CodeDialogProps {
  title: string;
  entries: readonly DemoEntry[];
  source: DemoSource;
  syntax?: ExampleModeControl;
  /** BeerCSS docs file name without its extension; omit for library workflows. */
  doc?: string;
  onClose?: () => void;
}

const copy = (text: string) => {
  void navigator.clipboard.writeText(text).then(
    () => dialog.toast('Copied to clipboard'),
    () => dialog.toast('Clipboard unavailable'),
  );
};

/** Source switches leave render factories + preview state intact. */
export const CodeDialog: Component<CodeDialogProps> = props => {
  const [usage, setUsage] = createSignal<'showcase' | 'interactive'>('showcase');
  const native = (entry: DemoSource) => (usage() === 'interactive' ? entry.interactiveNativeCode : entry.nativeCode);
  const source = (entry: DemoSource) => {
    const api = usage() === 'interactive' ? entry.interactiveCode! : entry.code;
    return props.syntax?.mode() === 'native' && native(entry) ? native(entry)! : api;
  };
  return (
    <>
      <nav class="tw:pr-12">
        <h5 class="max truncate">{props.title}</h5>
        <Show when={props.doc}>
          <a
            class="button small-round border"
            href={`${BEERCSS_DOCS}/${props.doc}.md`}
            target="_blank"
            rel="noreferrer"
          >
            <i>description</i>
            <span>BeerCSS docs</span>
          </a>
        </Show>
        <button class="chip" onClick={() => copy(source(props.source))}>
          <i>content_copy</i>
          <span>Copy all</span>
        </button>
      </nav>
      <Show when={props.source.interactiveCode}>
        <nav class="group" aria-label="Example usage">
          <button
            type="button"
            class="small border"
            classList={{ active: usage() === 'showcase' }}
            aria-pressed={usage() === 'showcase'}
            onClick={() => setUsage('showcase')}
          >
            Showcase
          </button>
          <button
            type="button"
            class="small border"
            classList={{ active: usage() === 'interactive' }}
            aria-pressed={usage() === 'interactive'}
            onClick={() => setUsage('interactive')}
          >
            Interactive usage
          </button>
        </nav>
      </Show>
      <Show when={props.syntax && props.entries.every(entry => native(entry))}>
        <ExampleModeSwitch {...props.syntax!} />
      </Show>
      <For each={props.entries}>
        {entry => (
          <article class="border large-padding">
            <div>{entry.render()}</div>
            <div class="row top-align no-space">
              <pre class="scroll max no-margin">
                <code>{highlightJsx(source(entry))}</code>
              </pre>
              <button class="circle transparent" title="Copy" onClick={() => copy(source(entry))}>
                <i>content_copy</i>
              </button>
            </div>
          </article>
        )}
      </For>
    </>
  );
};

export const openCodeDialog = (props: Omit<CodeDialogProps, 'onClose'>) =>
  dialog.show(CodeDialog, props, { class: 'right large', closeOnClickOutside: true });
