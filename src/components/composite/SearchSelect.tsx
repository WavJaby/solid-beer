import {
  batch,
  createEffect,
  createResource,
  createSignal,
  createUniqueId,
  For,
  type JSX,
  Match,
  onCleanup,
  onMount,
  Show,
  type Setter,
  Switch,
  untrack,
} from 'solid-js';

export interface SearchSelectOption<T> {
  label: string;
  value: T;
}

export interface SearchSelectProps<T> {
  search: (query: string) => Promise<readonly SearchSelectOption<T>[]>;
  setSelected: Setter<T | undefined>;
  renderOption?: (item: SearchSelectOption<T>) => JSX.Element;
  initialQuery?: string;
  placeholder?: string;
  label?: string;
  required?: boolean;
  emptyText?: string;
  loadingText?: string;
  errorText?: string;
  onError?: (error: unknown) => void;
}

const SearchSelect = <T,>(props: SearchSelectProps<T>) => {
  const id = createUniqueId();
  const [query, setQuery] = createSignal(props.initialQuery ?? '');
  const [open, setOpen] = createSignal(false);
  const [active, setActive] = createSignal(-1);
  const [data, { refetch }] = createResource(
    () => (open() ? query() : false),
    value => props.search(value),
  );
  const results = () => (data.loading || data.state === 'errored' ? [] : data() ?? []);
  createEffect(() => {
    if (data.state === 'errored') untrack(() => props.onError?.(data.error));
  });
  let container: HTMLDivElement | undefined;
  let inputElement: HTMLInputElement | undefined;
  const close = () => setOpen(false);
  const search = (value: string) => {
    const unchanged = open() && value === query();
    batch(() => {
      setQuery(value);
      setActive(-1);
      setOpen(true);
    });
    if (unchanged) void refetch();
  };
  const select = (item: SearchSelectOption<T>) => {
    batch(() => {
      close();
      setQuery(item.label);
    });
    props.setSelected(() => item.value);
  };
  const clear = () => {
    search('');
    inputElement?.focus();
    props.setSelected(undefined);
  };
  const outsideClick = (event: MouseEvent) => {
    if (container && !event.composedPath().includes(container)) close();
  };
  onMount(() => document.addEventListener('click', outsideClick));
  onCleanup(() => document.removeEventListener('click', outsideClick));
  const keyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
    } else if (open() && results().length && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      const last = results().length - 1;
      setActive(index => (event.key === 'ArrowDown' ? Math.min(index + 1, last) : index <= 0 ? last : index - 1));
    } else if (event.key === 'Enter' && open() && active() >= 0) {
      event.preventDefault();
      select(results()[active()]!);
    }
  };
  return (
    <div ref={container} class="field prefix round fill" classList={{ suffix: query().length > 0 }}>
      <i class="front">search</i>
      <input
        ref={inputElement}
        type="search"
        role="combobox"
        aria-label={props.label ?? props.placeholder ?? 'Search'}
        aria-autocomplete="list"
        aria-controls={`${id}-results`}
        aria-expanded={open()}
        aria-activedescendant={open() && active() >= 0 ? `${id}-option-${active()}` : undefined}
        value={query()}
        onInput={event => search(event.currentTarget.value)}
        onFocus={() => !open() && search(query())}
        onKeyDown={keyDown}
        placeholder={props.placeholder ?? 'Search...'}
        required={props.required}
        autocomplete="off"
      />
      <Show when={query().length > 0}>
        <a
          role="button"
          tabIndex={0}
          aria-label="Clear search"
          onMouseDown={event => event.preventDefault()}
          onClick={clear}
          onKeyDown={event => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              clear();
            }
          }}
        >
          <i>close</i>
        </a>
      </Show>
      <Show when={open()}>
        <menu id={`${id}-results`} role="listbox" aria-busy={data.loading} class="active">
          <Switch
            fallback={
              <For each={results()}>
                {(item, index) => (
                  <li
                    id={`${id}-option-${index()}`}
                    role="option"
                    aria-selected={active() === index()}
                    classList={{ active: active() === index() }}
                    onClick={() => select(item)}
                  >
                    {props.renderOption ? props.renderOption(item) : item.label}
                  </li>
                )}
              </For>
            }
          >
            <Match when={data.loading}>
              <li role="presentation">
                <progress class="circle small" />
                <span role="status">{props.loadingText ?? 'Searching...'}</span>
              </li>
            </Match>
            <Match when={data.state === 'errored'}>
              <li role="presentation">
                <span role="status">{props.errorText ?? 'Search failed'}</span>
              </li>
            </Match>
            <Match when={results().length === 0}>
              <li role="presentation">
                <span role="status">{props.emptyText ?? 'No results found'}</span>
              </li>
            </Match>
          </Switch>
        </menu>
      </Show>
    </div>
  );
};

export default SearchSelect;
