import { createSignal, Show } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SearchSelect, type SearchSelectOption, UserLink } from '../src';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
  return container;
};
const input = (container: HTMLElement, value: string) => {
  const field = container.querySelector('input')!;
  field.value = value;
  field.dispatchEvent(new Event('input', { bubbles: true }));
  return field;
};
const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>(done => {
    resolve = done;
  });
  return { promise, resolve };
};
afterEach(() => disposers.splice(0).forEach(dispose => dispose()));

describe('SearchSelect', () => {
  it.each(['click', 'Enter', ' '])(
    'clears query and selection through %s and returns focus to the input',
    async action => {
      const item = 'Alex';
      const search = vi.fn().mockResolvedValue([{ label: item, value: item }]);
      const [selected, setSelected] = createSignal<string>();
      const container = mount(() => (
        <>
          <SearchSelect search={search} setSelected={setSelected} />
          <Show when={selected()}>{value => <p>{value()}</p>}</Show>
        </>
      ));
      expect(container.querySelector('[aria-label="Clear search"]')).toBeNull();
      const field = input(container, item);
      await vi.waitFor(() => expect(container.querySelector('[role="option"]')).not.toBeNull());
      container.querySelector<HTMLElement>('[role="option"]')!.click();
      expect(selected()).toBe(item);
      const clear = container.querySelector<HTMLElement>('[aria-label="Clear search"]')!;
      clear.focus();
      if (action === 'click') clear.click();
      else {
        const event = new KeyboardEvent('keydown', { key: action, bubbles: true, cancelable: true });
        clear.dispatchEvent(event);
        expect(event.defaultPrevented).toBe(true);
      }
      expect(field.value).toBe('');
      expect(field.getAttribute('aria-expanded')).toBe('true');
      expect(document.activeElement).toBe(field);
      expect(container.querySelector('[aria-label="Clear search"]')).toBeNull();
      expect(container.querySelector('p')).toBeNull();
      expect(selected()).toBeUndefined();
      expect(search.mock.calls.map(([query]) => query)).toEqual([item, '']);
    },
  );

  it('updates caller-owned selection on consecutive mouse and keyboard selections', async () => {
    const items = [
      { id: 'alex', label: 'Alex' },
      { id: 'sam', label: 'Sam' },
    ];
    const [selectedItem, setSelectedItem] = createSignal<(typeof items)[number]>();
    const container = mount(() => (
      <>
        <SearchSelect
          search={async query =>
            items
              .filter(item => item.label.toLowerCase().includes(query.toLowerCase()))
              .map(item => ({ label: item.label, value: item }))
          }
          setSelected={setSelectedItem}
        />
        <Show when={selectedItem()}>{item => <p>{item().id}</p>}</Show>
      </>
    ));
    const field = input(container, 'Alex');
    await vi.waitFor(() => expect(container.querySelector('[role="option"]')?.textContent).toBe('Alex'));
    container.querySelector<HTMLElement>('[role="option"]')!.click();
    expect(container.querySelector('p')?.textContent).toBe('alex');
    expect(selectedItem()).toBe(items[0]);
    input(container, 'Sam');
    await vi.waitFor(() => expect(container.querySelector('[role="option"]')?.textContent).toBe('Sam'));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(selectedItem()).toBe(items[1]);
    expect(field.value).toBe('Sam');
    expect(container.querySelector('p')?.textContent).toBe('sam');
  });

  it('selects arbitrary items with keyboard navigation and custom rendering', async () => {
    const product = { sku: 'keyboard', title: 'Keyboard' };
    const [selected, setSelected] = createSignal<typeof product>();
    const container = mount(() => (
      <SearchSelect
        search={async () => [{ label: product.title, value: product }]}
        renderOption={item => <strong>{item.value.sku}</strong>}
        setSelected={setSelected}
      />
    ));
    const field = input(container, 'key');
    await vi.waitFor(() => expect(container.querySelector('[role="option"]')?.textContent).toBe(product.sku));
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowDown', bubbles: true }));
    expect(field.getAttribute('aria-activedescendant')).toBe(container.querySelector('[role="option"]')!.id);
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));
    expect(selected()).toBe(product);
    expect(field.value).toBe(product.title);
    expect(field.getAttribute('aria-expanded')).toBe('false');
    expect(container.querySelector('p')).toBeNull();
  });

  it('stores function-valued items without invoking them as signal updaters', async () => {
    const item = vi.fn(() => 'Result');
    const [selected, setSelected] = createSignal<typeof item>();
    const container = mount(() => (
      <SearchSelect search={async () => [{ label: 'Result', value: item }]} setSelected={setSelected} />
    ));
    input(container, 'result');
    await vi.waitFor(() => expect(container.querySelector('[role="option"]')).not.toBeNull());
    container.querySelector<HTMLElement>('[role="option"]')!.click();
    expect(selected()).toBe(item);
    expect(item).not.toHaveBeenCalled();
    container.querySelector<HTMLElement>('[aria-label="Clear search"]')!.click();
    expect(selected()).toBeUndefined();
  });

  it('ignores older responses and late results after Escape', async () => {
    const old = deferred<readonly SearchSelectOption<string>[]>();
    const latest = deferred<readonly SearchSelectOption<string>[]>();
    const dismissed = deferred<readonly SearchSelectOption<string>[]>();
    const search = vi
      .fn()
      .mockReturnValueOnce(old.promise)
      .mockReturnValueOnce(latest.promise)
      .mockReturnValueOnce(dismissed.promise);
    const container = mount(() => <SearchSelect search={search} setSelected={createSignal<string>()[1]} />);
    input(container, 'old');
    const field = input(container, 'latest');
    latest.resolve([{ label: 'Latest', value: 'Latest' }]);
    await vi.waitFor(() => expect(container.querySelector('[role="option"]')?.textContent).toBe('Latest'));
    old.resolve([{ label: 'Old', value: 'Old' }]);
    await old.promise;
    expect(container.querySelector('[role="option"]')?.textContent).toBe('Latest');
    input(container, 'dismiss');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    dismissed.resolve([{ label: 'Dismissed', value: 'Dismissed' }]);
    await dismissed.promise;
    expect(container.querySelector('[role="option"]')).toBeNull();
    expect(field.getAttribute('aria-expanded')).toBe('false');
  });

  it('retries an unchanged query and does not search the selected label', async () => {
    const search = vi
      .fn()
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce([{ label: 'Result', value: 'Result' }]);
    const container = mount(() => <SearchSelect search={search} setSelected={createSignal<string>()[1]} />);
    input(container, 'query');
    await vi.waitFor(() => expect(container.textContent).toContain('No results found'));
    input(container, 'query');
    await vi.waitFor(() => expect(container.querySelector('[role="option"]')?.textContent).toBe('Result'));
    container.querySelector<HTMLElement>('[role="option"]')!.click();
    expect(search.mock.calls).toEqual([['query'], ['query']]);
    expect(container.querySelector('input')?.value).toBe('Result');
  });

  it('ignores failures after dismissing the menu or disposing the component', async () => {
    const closed = deferred<readonly SearchSelectOption<string>[]>();
    const disposed = deferred<readonly SearchSelectOption<string>[]>();
    const onError = vi.fn();
    const search = vi
      .fn()
      .mockImplementationOnce(async () => {
        await closed.promise;
        throw new Error('Closed request');
      })
      .mockImplementationOnce(async () => {
        await disposed.promise;
        throw new Error('Disposed request');
      });
    const container = mount(() => (
      <SearchSelect search={search} setSelected={createSignal<string>()[1]} onError={onError} />
    ));
    const field = input(container, 'close');
    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    closed.resolve([]);
    await search.mock.results[0]!.value.catch(() => undefined);
    input(container, 'dispose');
    disposers.splice(0).forEach(dispose => dispose());
    disposed.resolve([]);
    await search.mock.results[1]!.value.catch(() => undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it('shows loading, empty and error states without rejecting the input handler', async () => {
    const pending = deferred<readonly SearchSelectOption<string>[]>();
    const error = new Error('Unavailable');
    const onError = vi.fn();
    const search = vi.fn().mockReturnValueOnce(pending.promise).mockRejectedValueOnce(error);
    const container = mount(() => (
      <SearchSelect search={search} setSelected={createSignal<string>()[1]} onError={onError} />
    ));
    input(container, 'empty');
    expect(container.textContent).toContain('Searching...');
    pending.resolve([]);
    await vi.waitFor(() => expect(container.textContent).toContain('No results found'));
    expect(container.querySelector('input')?.getAttribute('aria-expanded')).toBe('true');
    input(container, 'error');
    await vi.waitFor(() => expect(container.textContent).toContain('Search failed'));
    expect(onError).toHaveBeenCalledWith(error);
  });
});

describe('UserLink', () => {
  it('uses a non-submit chip, shows loading, and updates avatar + label on a changed id', async () => {
    const first = deferred<{ id: string; nickname: string; avatarUrl: string }>();
    const [id, setId] = createSignal('alex');
    const loadUser = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockResolvedValueOnce({ id: 'sam', username: 'Sam', avatarUrl: 'data:image/png;base64,sam' });
    const container = mount(() => <UserLink userId={id()} loadUser={loadUser} />);
    expect(container.querySelector('button')?.type).toBe('button');
    expect(container.querySelector('progress')).not.toBeNull();
    first.resolve({ id: 'alex', nickname: 'Alex', avatarUrl: 'data:image/png;base64,alex' });
    await vi.waitFor(() => expect(container.textContent).toBe('Alex'));
    expect(container.querySelector('img')?.getAttribute('src')).toContain('alex');
    setId('sam');
    await vi.waitFor(() => expect(container.textContent).toBe('Sam'));
    expect(container.querySelector('img')?.getAttribute('src')).toContain('sam');
    setId('');
    await vi.waitFor(() => expect(container.querySelector('button')?.disabled).toBe(true));
  });
});
