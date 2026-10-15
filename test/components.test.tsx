import { createRoot, createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { describe, expect, it, vi } from 'vitest';
import { compiledBadge, compiledButton, compiledDynamicButton } from './fixtures/compiled-badge';
import { Badge, Button, Collapsible, ConfirmDialog, MenuSelect, Table } from '../src';

const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  const dispose = render(view, container);
  return { container, dispose };
};

describe('Collapsible', () => {
  it('starts open by default and supports a closed initial state', () => {
    const open = mount(() => (
      <Collapsible title="Details">
        <p>Content</p>
      </Collapsible>
    ));
    expect(open.container.querySelector('.collapsible')?.classList.contains('active')).toBe(true);
    open.dispose();

    const closed = mount(() => (
      <Collapsible title="Details" defaultOpen={false}>
        <p>Content</p>
      </Collapsible>
    ));
    expect(closed.container.querySelector('.collapsible')?.classList.contains('active')).toBe(false);
    closed.dispose();
  });
});

describe('Badge and Button', () => {
  it('updates compiled dynamic icon, label and badge children without recreating the host', () => {
    const [icon, setIcon] = createSignal('home');
    const [label, setLabel] = createSignal('Save');
    const [count, setCount] = createSignal(0);
    const { container, dispose } = mount(() => compiledDynamicButton({ icon, label, count }));
    try {
      const button = container.querySelector('button')!;
      expect(button.querySelector('.badge')?.textContent).toBe('0');
      setIcon('check');
      setLabel('Saved');
      setCount(1); // One completed action.
      expect(container.querySelector('button')).toBe(button);
      expect([...button.children].map(child => child.textContent)).toEqual(['check', 'Saved', '1']);
      expect(button.querySelector('.badge')?.parentElement).toBe(button);
    } finally {
      dispose();
      container.remove();
    }
  });
  it('keeps composed children, refs, events and reactive native props after compilation', () => {
    const [disabled, setDisabled] = createSignal(false);
    const onClick = vi.fn();
    let element: HTMLButtonElement | undefined;
    const { container, dispose } = mount(() => (
      <>
        {compiledButton({
          get disabled() {
            return disabled();
          },
          onClick,
          ref: node => {
            element = node;
          },
        })}
        {compiledBadge()}
      </>
    ));
    try {
      const button = container.querySelector('button')!;
      expect(button).toBe(element);
      expect(button.className).toBe('primary');
      expect([...button.children].map(child => [child.tagName, child.textContent])).toEqual([
        ['I', 'home'],
        ['SPAN', 'Save'],
        ['SPAN', '0'],
      ]);
      expect(button.querySelector('.badge')?.className).toBe('badge none');
      expect(button.hasAttribute('icon')).toBe(false);
      button.click();
      expect(onClick).toHaveBeenCalledOnce();
      setDisabled(true);
      expect(container.querySelector('button')).toBe(button);
      expect(button.disabled).toBe(true);
      const anchor = container.querySelector('a')!;
      expect(anchor.getAttribute('href')).toBe('#custom-components');
      expect(anchor.querySelector('.badge')?.className).toBe('badge min');
      expect(anchor.querySelector('.badge')?.textContent).toBe('');
      expect(anchor.querySelectorAll('span')).toHaveLength(1); // Empty badge exists; omitted label does not.
    } finally {
      dispose();
      container.remove();
    }
  });
  it('preserves caller-owned icon, label and badge children without extra wrappers', () => {
    const { container, dispose } = mount(() => (
      <>
        <a>
          <i>home</i>
          <Badge class="min" />
        </a>
        <Button>
          <span>Label</span>
          <Badge class="none">3</Badge>
        </Button>
        <Button>
          <i>search</i>
        </Button>
      </>
    ));
    const [anchorBadge] = container.querySelectorAll('a');
    expect(anchorBadge?.querySelector('i')?.textContent).toBe('home');
    expect(anchorBadge?.querySelector('.badge')?.className).toBe('badge min');
    expect(anchorBadge?.querySelectorAll('span')).toHaveLength(1);

    const [labelled, iconOnly] = container.querySelectorAll('button');
    expect(labelled?.querySelector('span:not(.badge)')?.textContent).toBe('Label');
    expect(labelled?.querySelector('.badge')?.textContent).toBe('3');
    expect(iconOnly?.querySelector('span')).toBeNull();
    dispose();
  });
});

describe('MenuSelect', () => {
  it('validates required selections without canceling native feedback', () => {
    const [value, setValue] = createSignal<string>();
    const [disabled, setDisabled] = createSignal(false);
    const { container, dispose } = mount(() => (
      <form><MenuSelect required name="tech" options={[{ value: 'solid', label: 'SolidJS' }]} value={value()} onSelect={setValue} disabled={disabled()} /></form>
    ));
    try {
      const form = container.querySelector('form')!;
      const proxy = container.querySelector<HTMLInputElement>('input[type="text"]')!;
      expect(container.querySelector('menu')!.parentElement!.contains(proxy)).toBe(false);
      const invalid = new Event('invalid', { cancelable: true });
      proxy.dispatchEvent(invalid);
      expect(invalid.defaultPrevented).toBe(false);
      expect(form.checkValidity()).toBe(false);
      setValue('solid');
      expect(form.checkValidity()).toBe(true);
      expect([...new FormData(form).entries()]).toEqual([['tech', 'solid']]);
      setValue(undefined);
      expect(form.checkValidity()).toBe(false);
      setDisabled(true);
      expect(form.checkValidity()).toBe(true);
    } finally {
      dispose();
      container.remove();
    }
  });
  it('toggles from child clicks, closes on blur/Escape and submits only enabled selections', () => {
    const [value, setValue] = createSignal<string | undefined>();
    const [disabled, setDisabled] = createSignal(false);
    const { container, dispose } = mount(() => (
      <form>
        <MenuSelect
          name="tech"
          options={[{ value: 'solid', label: 'SolidJS' }]}
          value={value()}
          onSelect={setValue}
          emptyOptionLabel="Choose"
          disabled={disabled()}
        />
      </form>
    ));
    try {
      const form = container.querySelector('form')!;
      const button = container.querySelector('button')!;
      const menu = container.querySelector('menu')!;
      expect(button.type).toBe('button');
      expect(new FormData(form).has('tech')).toBe(false);
      button.focus();
      button.querySelector('span')!.click();
      expect(menu.classList.contains('active')).toBe(true);
      button.querySelector('i')!.click();
      expect(menu.classList.contains('active')).toBe(false);
      button.click();
      button.focus();
      button.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      expect(menu.classList.contains('active')).toBe(false);
      button.focus();
      button.click();
      button.blur();
      expect(menu.classList.contains('active')).toBe(false);
      button.focus();
      button.click();
      const option = container.querySelectorAll<HTMLElement>('menu li')[1]!;
      const press = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
      option.dispatchEvent(press);
      expect(press.defaultPrevented).toBe(false);
      option.click();
      expect(menu.classList.contains('active')).toBe(false);
      expect(button.querySelector('span')!.textContent).toBe('SolidJS');
      expect(new FormData(form).get('tech')).toBe('solid');
      setDisabled(true);
      expect(new FormData(form).has('tech')).toBe(false);
      expect(button.disabled).toBe(true);
      setDisabled(false);
      button.click();
      container.querySelector<HTMLElement>('menu li')!.click();
      expect(new FormData(form).has('tech')).toBe(false);
    } finally {
      dispose();
      container.remove();
    }
  });
  it('reports the empty option and selected values', () => {
    createRoot(dispose => {
      const selections: Array<string | undefined> = [];
      const { container } = mount(() => (
        <MenuSelect
          options={[{ value: 'one', label: 'One' }]}
          emptyOptionLabel="None"
          onSelect={value => selections.push(value)}
        />
      ));
      const items = container.querySelectorAll('menu li');
      expect(items).toHaveLength(2);
      (items[0] as HTMLElement).click();
      (items[1] as HTMLElement).click();
      expect(selections).toEqual([undefined, 'one']);
      dispose();
    });
  });
});

describe('Table', () => {
  it('shows an empty state without rendering data rows', () => {
    createRoot(dispose => {
      const { container } = mount(() => (
        <Table
          data={[]}
          columns={[{ header: 'Name', cell: row => row }]}
          emptyText="Nothing here"
          tableClass="stripes"
        />
      ));
      expect(container.textContent).toContain('Nothing here');
      expect(container.querySelectorAll('tbody tr')).toHaveLength(1);
      expect(container.querySelector('table')?.className).toBe('stripes no-margin');
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('nav')).toBeNull();
      expect(container.querySelector('td')?.colSpan).toBe(1); // Empty state spans the sole data column.
      dispose();
    });
  });
  it('renders read-only rows, loading spans and independent actions without selection props', () => {
    const [loading, setLoading] = createSignal(false);
    const onRowClick = vi.fn();
    const { container, dispose } = mount(() => (
      <Table data={['First']} columns={[{ header: 'Name', cell: row => row }]} loading={loading()} actions={<button>Refresh</button>} onRowClick={onRowClick} />
    ));
    try {
      expect(container.querySelectorAll('th')).toHaveLength(1);
      expect(container.querySelectorAll('td')).toHaveLength(1);
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('nav')?.textContent).toContain('Refresh');
      container.querySelector('tbody tr')!.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      expect(onRowClick).toHaveBeenCalledWith('First', 0);
      setLoading(true);
      expect(container.querySelector('progress')).not.toBeNull();
      expect(container.querySelector('td')?.colSpan).toBe(1); // Loading spans the sole data column.
    } finally {
      dispose();
      container.remove();
    }
  });
  it('enables selection only with both props and preserves toggles, row clicks and spans', () => {
    const [selected, setSelected] = createSignal(new Set<number>());
    const [editable, setEditable] = createSignal(false);
    const [data, setData] = createSignal<string[] | undefined>(['First', 'Second']);
    const onRowClick = vi.fn();
    const { container, dispose } = mount(() => (
      <Table data={data()} columns={[{ header: 'Name', cell: row => row }]} selectedIndices={selected} onSelectionChange={editable() ? setSelected : undefined} onRowClick={onRowClick} />
    ));
    try {
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('nav')).toBeNull();
      setEditable(true);
      const checkboxes = () => [...container.querySelectorAll<HTMLInputElement>('input')];
      expect(checkboxes()).toHaveLength(data()!.length + 1); // One checkbox per row + header.
      checkboxes()[1]!.click();
      expect([...selected()]).toEqual([0]);
      expect(onRowClick).not.toHaveBeenCalled();
      expect(container.querySelector('nav')?.textContent).toContain('1 selected');
      checkboxes()[1]!.click();
      expect(selected().size).toBe(0);
      checkboxes()[0]!.click();
      expect([...selected()]).toEqual([0, 1]);
      expect(checkboxes()[0]!.checked).toBe(true);
      checkboxes()[0]!.click();
      expect(selected().size).toBe(0);
      setData(undefined);
      checkboxes()[0]!.click();
      expect(selected().size).toBe(0);
      expect(container.querySelector('td')?.colSpan).toBe(2); // Data column + selection column.
      setEditable(false);
      expect(container.querySelector('input')).toBeNull();
      expect(container.querySelector('td')?.colSpan).toBe(1);
    } finally {
      dispose();
      container.remove();
    }
  });
});

describe('ConfirmDialog', () => {
  it('does not render a cancel action in alert mode', () => {
    const { container, dispose } = mount(() => <ConfirmDialog message="Done" alertMode />);
    expect(container.textContent).toContain('Done');
    expect(container.textContent).toContain('OK');
    expect(container.textContent).not.toContain('Cancel');
    dispose();
  });
});
