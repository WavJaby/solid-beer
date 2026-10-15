/// <reference path="../dev/site/example-source.d.ts" />
import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../src/runtime';
import { DialogStack, Progress, programmaticDialogs } from '../src';
import ProgressExamples from '../dev/sections/Progress';
import Buttons from '../dev/sections/Buttons';
import Badges from '../dev/sections/Badges';
import { StackedDialogExample } from '../dev/sections/CustomDialogs';
import { DemoGroup } from '../dev/site/Demo';
import { optionCode } from '../dev/site/example';
import { beerSections } from '../dev/sections';
import { beerCssComponents } from '../src';
import { Checkboxes, Radios, Switches, Fields, Selects, Textareas, Sliders } from '../dev/sections/Controls';
import { Cards, TabExamples, Pages, Overlays, Snackbars } from '../dev/sections/Surfaces';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
  return container;
};
const click = (root: ParentNode, text: string) => {
  const button = [...root.querySelectorAll('button')].find(
    element => (element.querySelector('span')?.textContent ?? element.textContent)?.trim() === text,
  );
  expect(button, `Missing button: ${text}`).toBeDefined();
  button!.click();
};

afterEach(() => {
  for (const entry of [...programmaticDialogs]) entry.props.onClose();
  if (vi.isFakeTimers()) vi.runOnlyPendingTimers();
  disposers.splice(0).forEach(dispose => dispose());
  document.getElementById('solid-beer-snackbar')?.remove();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('demo source', () => {
  it('opens and closes nested dialogs from the local stacked-dialog example', () => {
    vi.useFakeTimers();
    const container = mount(() => (
      <>
        <StackedDialogExample />
        <DialogStack />
      </>
    ));
    const rootDepth = 1; // The first dialog is level one; each recursive open adds one level.
    click(container, 'Stacked dialogs');
    vi.runOnlyPendingTimers();
    expect(programmaticDialogs.map(entry => entry.props.depth)).toEqual([rootDepth]);
    const root = document.querySelector('dialog')!;
    click(root, `Open depth ${rootDepth + 1}`);
    vi.runOnlyPendingTimers();
    expect(programmaticDialogs.map(entry => entry.props.depth)).toEqual([rootDepth, rootDepth + 1]);
    const nested = [...document.querySelectorAll('dialog')].at(-1)!;
    expect(nested.querySelector('h5')?.textContent).toBe(`Recursive dialog (depth: ${rootDepth + 1})`);
    click(nested, 'Close this');
    vi.runOnlyPendingTimers();
    expect(programmaticDialogs.map(entry => entry.props.depth)).toEqual([rootDepth]);
    expect(document.querySelector('dialog')).toBe(root);
    click(root, 'Close this');
    vi.runOnlyPendingTimers();
    expect(programmaticDialogs).toHaveLength(0);
    expect(document.querySelector('dialog')).toBeNull();
  });

  it('renders every BeerCSS category with an anchor, examples and code actions', () => {
    expect(beerSections.map(section => section.title)).toEqual(beerCssComponents.map(component => component.name));
    const container = mount(() => (
      <>
        {beerSections.map(section => (
          <section.component />
        ))}
      </>
    ));
    for (const section of beerSections) {
      const element = container.querySelector(`#${section.id}`)!;
      expect(element, section.title).not.toBeNull();
      expect(element.querySelector('[title="Show code"]'), section.title).not.toBeNull();
      expect(element.querySelector('div.row.wrap'), section.title).not.toBeNull();
    }
    expect(container.querySelector('nav[aria-label="Example syntax"]')).toBeNull();
  });

  it('updates control values, pages and overlay visibility through user events', () => {
    const container = mount(() => (
      <>
        <Checkboxes />
        <Selects />
        <Sliders />
        <TabExamples />
        <Overlays />
      </>
    ));
    container.querySelector<HTMLInputElement>('#checkboxes input')!.click();
    expect(container.querySelector('#checkboxes [role="status"]')?.textContent).toBe('Enabled: true');
    const select = container.querySelector<HTMLSelectElement>('#selects select')!;
    select.value = 'solid';
    select.dispatchEvent(new Event('change', { bubbles: true }));
    expect(container.querySelector('#selects [role="status"]')?.textContent).toBe('Value: solid');
    const range = container.querySelector<HTMLInputElement>('#sliders input')!;
    range.value = range.max; // Exercise the documented maximum, independent of implementation.
    range.dispatchEvent(new Event('input', { bubbles: true }));
    expect(container.querySelector('#sliders [role="status"]')?.textContent).toBe(`Value: ${range.max}%`);
    container.querySelectorAll<HTMLAnchorElement>('#tabs .tabs a')[1]!.click();
    expect(container.querySelector('#tabs .page.active h6')?.textContent).toBe('Details');
    click(container.querySelector('#overlays')!, 'Show overlay');
    expect(container.querySelector('#overlays .overlay')?.classList.contains('active')).toBe(true);
    click(container.querySelector('#overlays')!, 'Dismiss overlay');
    expect(container.querySelector('#overlays .overlay')?.classList.contains('active')).toBe(false);
  });

  it('prints current scalar options without losing false, empty strings or escapes', () => {
    expect(optionCode('disabled', false)).toBe(' disabled={false}');
    expect(optionCode('value', '')).toBe(' value={""}');
    expect(optionCode('title', 'A "quoted"\nline')).toBe(' title={"A \\"quoted\\"\\nline"}');
    expect(optionCode('value', undefined)).toBe('');
    expect(optionCode('value', null)).toBe(' value={null}');
    expect(() => optionCode('handler', () => undefined)).toThrow('must be a scalar');
    expect(() => optionCode('data', {})).toThrow('must be a scalar');
  });
});

describe('compiled demo entries', () => {
  it.each([
    ['radios', Radios],
    ['switches', Switches],
    ['fields', Fields],
    ['selects', Selects],
    ['textareas', Textareas],
    ['sliders', Sliders],
    ['tabs', TabExamples],
    ['pages', Pages],
    ['overlays', Overlays],
    ['snackbars', Snackbars],
  ] as const)('offers both usages for %s without remounting its preview', (id, Section) => {
    vi.useFakeTimers();
    const container = mount(() => (
      <>
        <Section />
        <DialogStack />
      </>
    ));
    container.querySelector<HTMLButtonElement>(`#${id} button[title="Show code"]`)!.click();
    vi.runOnlyPendingTimers();
    const panel = document.querySelector('dialog')!;
    const preview = panel.querySelector('article > div:first-child')!;
    const code = () => panel.querySelector('code')!.textContent!;
    expect(panel.querySelector('[aria-label="Example usage"] [aria-pressed="true"]')?.textContent).toBe('Showcase');
    expect(code()).not.toMatch(/createSignal|Example|onChange|onClick|onInput/);
    click(panel, 'Interactive usage');
    expect(code()).toContain('createSignal(');
    expect(code()).toMatch(/<[A-Za-z]+Example \/>/);
    click(panel, 'Native JSX');
    expect(code()).not.toMatch(/from ['"]solid-beer['"]|beerClass|splitProps/);
    click(panel, 'Showcase');
    expect(code()).not.toMatch(/createSignal|Example/);
    expect(panel.querySelector('article > div:first-child')).toBe(preview);
  });
  it('defaults Checkbox to showcase, copies both usage modes and preserves the controlled preview', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const container = mount(() => (
      <>
        <Checkboxes />
        <DialogStack />
      </>
    ));
    container.querySelector<HTMLButtonElement>('#checkboxes button[title="Show code"]')!.click();
    vi.runOnlyPendingTimers();
    const panel = document.querySelector('dialog')!;
    const preview = panel.querySelector<HTMLInputElement>('article input')!;
    const code = () => panel.querySelector('code')!.textContent!;
    expect(panel.querySelector('[aria-label="Example usage"] [aria-pressed="true"]')?.textContent).toBe('Showcase');
    expect(code()).toContain('<Checkbox>Enabled</Checkbox>');
    expect(code()).not.toMatch(/createSignal|onChange|Example/);
    preview.click();
    expect(code()).toContain('<Checkbox checked>');
    expect(container.querySelector<HTMLInputElement>('#checkboxes input')!.checked).toBe(true);
    click(panel, 'Copy all');
    await Promise.resolve();
    expect(writeText.mock.lastCall![0]).toBe(code());
    click(panel, 'Interactive usage');
    expect(code()).toContain('createSignal(false)');
    expect(code()).toContain('onChange={event => setChecked(event.currentTarget.checked)}');
    expect(code()).toContain('<CheckboxExample />');
    click(panel, 'Copy all');
    await Promise.resolve();
    expect(writeText.mock.lastCall![0]).toBe(code());
    click(panel, 'Native JSX');
    expect(code()).toContain('type="checkbox"');
    expect(code()).not.toContain('<Checkbox ');
    click(panel, 'Showcase');
    expect(code()).toContain('type="checkbox"');
    expect(code()).not.toMatch(/createSignal|onChange|Example/);
    click(panel, 'Copy all');
    await Promise.resolve();
    expect(writeText.mock.lastCall![0]).toBe(code());
    expect(panel.querySelector('article input')).toBe(preview);
    expect(preview.checked).toBe(true);
  });
  it('shows separate badge variants with selected colors in direct source', () => {
    vi.useFakeTimers();
    const container = mount(() => (
      <>
        <Badges />
        <DialogStack />
      </>
    ));
    container.querySelector<HTMLButtonElement>('#badges button[title="Show code"]')!.click();
    vi.runOnlyPendingTimers();
    const panel = document.querySelector('dialog')!;
    const previews = [...panel.querySelectorAll('article > div:first-child')];
    expect(previews.length).toBeGreaterThan(1);
    for (const preview of previews) expect(preview.querySelectorAll('.badge')).toHaveLength(1);
    const choice = [...container.querySelectorAll<HTMLLabelElement>('#badges label')].find(
      label => label.textContent?.trim() === 'secondary',
    )!;
    choice.querySelector<HTMLInputElement>('input')!.click();
    for (const code of panel.querySelectorAll('code')) {
      expect(code.textContent).toContain('secondary');
      expect(code.textContent).not.toMatch(/props\.|Example|classes=/);
    }
  });
  it('shows one button per code card and preserves previews when switching syntax', () => {
    vi.useFakeTimers();
    const container = mount(() => (
      <>
        <Buttons />
        <DialogStack />
      </>
    ));
    container.querySelector<HTMLButtonElement>('#buttons button[title="Show code"]')!.click();
    vi.runOnlyPendingTimers();
    const panel = document.querySelector('dialog')!;
    const previews = [...panel.querySelectorAll('article > div:first-child')];
    expect(previews.length).toBeGreaterThan(1);
    for (const preview of previews) expect(preview.querySelectorAll('button')).toHaveLength(1);
    expect(panel.querySelectorAll('code')).toHaveLength(previews.length);
    const choose = (name: string, label: string) => {
      const choice = [...container.querySelectorAll<HTMLLabelElement>('#buttons label')].find(
        item => item.textContent?.trim() === label && item.querySelector(`input[name="${name}"]`),
      );
      choice!.querySelector<HTMLInputElement>('input')!.click();
    };
    choose('color-buttons', 'primary');
    choose('size-buttons', 'large');
    for (const preview of previews) {
      const button = preview.querySelector('button')!;
      expect(button.classList.contains('primary')).toBe(true);
      expect(button.classList.contains('large')).toBe(true);
    }
    container.querySelector<HTMLInputElement>('#buttons input[name="color-buttons"]')!.click();
    for (const preview of previews) expect(preview.querySelector('button')!.classList.contains('primary')).toBe(false);
    click(panel, 'Native JSX');
    expect([...panel.querySelectorAll('article > div:first-child')]).toEqual(previews);
    for (const code of panel.querySelectorAll('code')) expect(code.textContent).toContain('<button');
  });

  it('updates compiled Cards options without remounting previews and copies a complete group once', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const container = mount(() => (
      <>
        <Cards />
        <DialogStack />
      </>
    ));
    const pageCard = container.querySelectorAll('#cards article')[1];
    container.querySelector<HTMLButtonElement>('#cards button[title="Show code"]')!.click();
    vi.runOnlyPendingTimers();
    const panel = document.querySelector('dialog')!;
    const dialogCard = panel.querySelectorAll('article > div > article')[1];
    const choices = container.querySelectorAll<HTMLInputElement>('#cards input[name="card-padding"]');
    choices[choices.length - 1]!.click();
    expect(container.querySelectorAll('#cards article')[1]).toBe(pageCard);
    expect(panel.querySelectorAll('article > div > article')[1]).toBe(dialogCard);
    expect(pageCard?.classList.contains('large-padding')).toBe(true);
    expect(dialogCard?.classList.contains('large-padding')).toBe(true);
    expect(panel.querySelectorAll('code')[1]!.textContent).toContain('large-padding');
    click(panel, 'Copy all');
    await Promise.resolve();
    const api = writeText.mock.lastCall![0] as string;
    expect(api.match(/from 'solid-beer'/g)).toHaveLength(1);
    expect(api).not.toContain('export const CardExample');
    expect(api).toContain('<Card');
    expect(api).toContain('large-padding');
    click(panel, 'Native JSX');
    click(panel, 'Copy all');
    await Promise.resolve();
    expect(writeText.mock.lastCall![0]).toContain('<article');
    expect(writeText.mock.lastCall![0]).not.toMatch(/import \{ Card[, }]/);
    expect(panel.querySelectorAll('article > div > article')[1]).toBe(dialogCard);
  });

  it('switches only the dialog representation and retains option values', () => {
    vi.useFakeTimers();
    // Percentage fixture: start half complete, then change to a quarter complete.
    const total = 100;
    const [value, setValue] = createSignal(total / 2);
    const renderWrapped = vi.fn((props: { value: number }) => <Progress value={props.value} max={total} />);
    const Wrapped = (props: { value: number }) => renderWrapped(props);
    const container = mount(() => (
      <>
        <DemoGroup
          title="Paired"
          entries={[{ render: () => <Wrapped value={value()} />, code: '<Progress />', nativeCode: '<progress />' }]}
          source={{ code: '<Progress />', nativeCode: '<progress />' }}
        />
        <DialogStack />
      </>
    ));
    expect(renderWrapped).toHaveBeenCalledOnce();
    const pagePreview = container.querySelector('progress');
    expect(container.querySelector('nav[aria-label="Example syntax"]')).toBeNull();
    container.querySelector<HTMLButtonElement>('button[title="Show code"]')!.click();
    vi.runOnlyPendingTimers();
    const panel = document.querySelector('dialog')!;
    const callsBeforeSwitch = renderWrapped.mock.calls.length;
    const dialogPreview = panel.querySelector('progress');
    click(panel, 'Native JSX');
    expect(renderWrapped.mock.calls.length).toBe(callsBeforeSwitch);
    expect(panel.querySelector('progress')).toBe(dialogPreview);
    expect(container.querySelector('progress')).toBe(pagePreview);
    const callsBeforeNativeUpdate = renderWrapped.mock.calls.length;
    setValue(total / 4);
    expect(container.querySelector('progress')?.value).toBe(total / 4);
    expect(panel.querySelector('progress')?.value).toBe(total / 4);
    expect(renderWrapped.mock.calls.length).toBe(callsBeforeNativeUpdate);
    expect(container.querySelector('progress')).toBe(pagePreview);
    expect(panel.querySelector('progress')).toBe(dialogPreview);
    click(panel, 'Component API');
    expect(container.querySelector('progress')?.value).toBe(total / 4);
    expect(renderWrapped.mock.calls.length).toBe(callsBeforeNativeUpdate);
  });

  it('copies generated reactive source and keeps options updating the page and dialog', async () => {
    vi.useFakeTimers();
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { configurable: true, value: { writeText } });
    const container = mount(() => (
      <>
        <ProgressExamples />
        <DialogStack />
      </>
    ));
    container.querySelector<HTMLButtonElement>('button[title="Show code"]')!.click();
    vi.runOnlyPendingTimers();
    const panel = document.querySelector('dialog')!;
    expect(panel.querySelector('code')?.textContent).toContain('<Progress');
    expect(panel.querySelector('code')?.textContent).not.toContain('wavy={false}');
    const pagePreview = container.querySelector('progress');
    click(panel, 'Native JSX');
    expect(panel.querySelector('code')?.textContent).toContain('<progress');
    expect(container.querySelector('nav[aria-label="Example syntax"]')).toBeNull();
    expect(container.querySelector('progress')).toBe(pagePreview);
    const circle = container.querySelector<HTMLInputElement>('input[name="progress-shape"][value="circle"]')!;
    circle.click();
    expect(container.querySelector('progress')?.classList.contains('circle')).toBe(true);
    expect(panel.querySelector('progress')?.classList.contains('circle')).toBe(true);
    expect(panel.querySelector('code')?.textContent).toContain('circle');
    const nativeSource = panel.querySelector('code')!.textContent;
    click(panel, 'Copy all');
    await Promise.resolve();
    expect(writeText).toHaveBeenLastCalledWith(nativeSource);
    const indeterminate = [...container.querySelectorAll<HTMLLabelElement>('label')]
      .find(label => label.textContent?.trim() === 'Indeterminate')!
      .querySelector<HTMLInputElement>('input')!;
    indeterminate.click();
    expect(container.querySelector('progress')?.hasAttribute('value')).toBe(false);
    expect(panel.querySelector('progress')?.hasAttribute('value')).toBe(false);
    expect(panel.querySelector('code')?.textContent).not.toContain('value=');
    click(panel, 'Component API');
    expect(panel.querySelector('code')?.textContent).toContain('<Progress');
    expect(panel.querySelector('button[aria-pressed="true"]')?.textContent).toContain('Component API');
  });

  it('does not offer a Native switch for an unpaired group', () => {
    vi.useFakeTimers();
    const container = mount(() => (
      <DemoGroup
        title="Native only"
        entries={[{ render: () => <progress />, code: '<progress />' }]}
        source={{ code: '<progress />' }}
      />
    ));
    expect(container.querySelector('progress')).not.toBeNull();
    expect(container.querySelector('nav[aria-label="Example syntax"]')).toBeNull();
  });
});
