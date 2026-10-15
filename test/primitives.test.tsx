import { createRoot, createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, expectTypeOf, it, vi } from 'vitest';
import {
  Checkbox,
  Button,
  Badge,
  Card,
  Field,
  Slider,
  ToggleSwitch,
  type BadgeProps,
  type ButtonProps,
  type CardProps,
  type ListProps,
  type NavigationProps,
  type TabsProps,
} from '../src';
import { compiledPrimitives } from './fixtures/compiled-primitives';
import { CompiledClasses } from './fixtures/compiled-classes';
import { DynamicAppearance, DynamicBadge, DynamicClassList } from './fixtures/compiled-dynamic';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
  return container;
};
afterEach(() => disposers.splice(0).forEach(dispose => dispose()));

describe('BeerCSS primitives', () => {
  it('merges compiled classes before classList and explicit params, reading each array once', () => {
    const [color, setColor] = createSignal('primary');
    const [enabled, setEnabled] = createSignal(true);
    const read = vi.fn(() => [color(), 'large border']);
    const container = mount(() => <CompiledClasses classes={read} enabled={enabled()} />);
    const button = container.querySelector('button')!;
    expect(new Set(button.classList)).toEqual(new Set(['custom', 'primary', 'small']));
    expect(container.querySelector('span')!.classList.contains('badge')).toBe(true);
    expect(container.querySelector('progress')!.classList.contains('wavy')).toBe(false);
    read.mockClear();
    setColor('secondary');
    expect(read).toHaveBeenCalledTimes(3); // One read for each of the three hosts.
    expect(button.classList.contains('primary')).toBe(false);
    expect(button.classList.contains('secondary')).toBe(true);
    setEnabled(false);
    expect(button.classList.contains('custom')).toBe(false);
    expect(container.querySelector('progress')!.classList.contains('custom')).toBe(false);
    expect(container.querySelector('progress')!.classList.contains('circle')).toBe(true);
  });
  it('applies Button/Badge params after raw helpers and keeps the badge base class', () => {
    const [border, setBorder] = createSignal(false);
    const container = mount(() => (
      <Button class="border large primary" shape="circle" size="small" border={border()}>
        <Badge class="min custom" classList={{ badge: false }} dot={false} inline>
          0
        </Badge>
      </Button>
    ));
    const button = container.querySelector('button')!;
    expect(new Set(button.classList)).toEqual(new Set(['primary', 'circle', 'small']));
    expect(new Set(container.querySelector('span')!.classList)).toEqual(new Set(['badge', 'custom', 'none']));
    setBorder(true);
    expect(button.classList.contains('border')).toBe(true);
    expect(container.querySelector('button')).toBe(button);
  });
  it('keeps layout classes and composed children outside the typed appearance API', () => {
    expectTypeOf<CardProps>().not.toHaveProperty('padding');
    expectTypeOf<ListProps>().not.toHaveProperty('spacing');
    expectTypeOf<TabsProps>().not.toHaveProperty('align');
    expectTypeOf<NavigationProps>().not.toHaveProperty('wrap');
    expectTypeOf<ButtonProps>().not.toHaveProperty('icon');
    expectTypeOf<BadgeProps>().not.toHaveProperty('badge');
  });
  it('compiles reactive classList with host precedence, protected base tokens and one value read per update', () => {
    const [enabled, setEnabled] = createSignal(true);
    const [explicit, setExplicit] = createSignal(false as boolean | undefined);
    const [elevation, setElevation] = createSignal<'large' | undefined>('large');
    const read = vi.fn(enabled);
    const container = mount(() => (
      <DynamicClassList enabled={enabled()} read={read} border={explicit()} elevation={elevation()} wavy={explicit()} />
    ));
    const classes = (selector: string) => new Set(container.querySelector(selector)!.classList);
    expect(classes('article')).toEqual(new Set(['margin', 'small-padding', 'round', 'large-padding', 'large-elevate']));
    expect(classes('progress')).toEqual(new Set(['margin', 'custom', 'circle']));
    expect(classes('div')).toEqual(new Set(['field', 'custom']));
    expect(classes('button')).toEqual(new Set(['custom']));
    read.mockClear();
    setEnabled(false);
    expect(read).toHaveBeenCalledOnce();
    expect(classes('article')).toEqual(new Set(['margin', 'small-padding', 'large-elevate']));
    expect(classes('progress')).toEqual(new Set(['margin']));
    expect(classes('div')).toEqual(new Set(['field']));
    expect(classes('button')).toEqual(new Set());
    setExplicit(undefined);
    expect(classes('progress')).toEqual(new Set(['margin']));
    setEnabled(true);
    expect(classes('article')).toEqual(
      new Set(['border', 'round', 'margin', 'small-padding', 'large-padding', 'large-elevate']),
    );
    expect(classes('progress')).toEqual(new Set(['wavy', 'margin', 'custom', 'circle']));
    setElevation(undefined);
    expect(classes('article')).toEqual(
      new Set(['border', 'round', 'margin', 'small-padding', 'large-padding', 'small-elevate']),
    ); // Omitted elevation preserves the raw helper; spacing stays caller-owned.
  });
  it('keeps dynamic Badge/Button classes reactive with normalized badge helpers', () => {
    const [helpers, setHelpers] = createSignal<string | undefined>(' primary  none ');
    const [classes, setClasses] = createSignal<string | undefined>('chip');
    const read = vi.fn(helpers);
    const container = mount(() => <DynamicBadge class={classes()} helpers={read()} />);
    expect(container.querySelector('button')!.className).toBe('chip');
    expect(container.querySelector('.badge')!.className).toBe('badge primary none');
    expect(container.querySelector('.badge')!.textContent).toBe('0');
    read.mockClear();
    setHelpers(undefined);
    expect(read).toHaveBeenCalledOnce();
    expect(container.querySelector('.badge')!.className).toBe('badge');
    setClasses(undefined);
    expect(container.querySelector('button')!.className).toBe('');
  });

  it('rejects invalid dynamic finite options instead of silently dropping their classes', () => {
    createRoot(dispose => {
      try {
        expect(() =>
          DynamicAppearance({
            border: false,
            elevation: 'invalid' as never,
            active: false,
            shape: 'linear',
            size: 'medium',
            wavy: false,
            value: undefined,
          }),
        ).toThrow('Invalid elevation: "invalid"');
      } finally {
        dispose();
      }
    });
  });

  it('updates compiled typed classes, preserves undefined defaults and removes progress value', () => {
    const [state, setState] = createSignal({
      border: false as boolean | undefined,
      elevation: 'large' as 'large' | undefined,
      active: false,
      shape: 'linear' as 'linear' | undefined,
      size: 'medium' as 'medium' | undefined,
      wavy: false as boolean | undefined,
      value: 50 as number | undefined,
    }); // Percent fixture starts halfway.
    const reads = vi.fn(() => state().border);
    const container = mount(() => (
      <DynamicAppearance
        border={reads()}
        elevation={state().elevation}
        active={state().active}
        shape={state().shape}
        size={state().size}
        wavy={state().wavy}
        value={state().value}
      />
    ));
    expect(new Set(container.querySelector('article')!.classList)).toEqual(new Set(['margin', 'large-elevate']));
    expect(new Set(container.querySelector('progress')!.classList)).toEqual(new Set(['margin', 'medium']));
    reads.mockClear();
    setState({
      border: undefined,
      elevation: undefined,
      active: true,
      shape: undefined,
      size: undefined,
      wavy: undefined,
      value: undefined,
    });
    expect(reads).toHaveBeenCalledOnce();
    expect(new Set(container.querySelector('article')!.classList)).toEqual(
      new Set(['border', 'small-elevate', 'margin']),
    );
    expect(new Set(container.querySelector('progress')!.classList)).toEqual(
      new Set(['circle', 'wavy', 'small', 'margin']),
    );
    expect(container.querySelector('.overlay')!.classList.contains('active')).toBe(true);
    expect(container.querySelector('progress')!.hasAttribute('value')).toBe(false);
  });

  it('overrides only explicit helper groups and preserves reactive classList', () => {
    const [border, setBorder] = createSignal(false);
    const container = mount(() => (
      <Card
        class="border top-padding small-elevate margin"
        classList={{ round: border() }}
        border={border()}
        elevation="large"
      >
        Body
      </Card>
    ));
    const card = container.querySelector('article')!;
    expect(card.className).toBe('top-padding margin large-elevate');
    setBorder(true);
    expect(card.className).toBe('border top-padding margin round large-elevate');
  });

  it('forwards control refs, native attributes and events to inputs', () => {
    const [checked, setChecked] = createSignal(false);
    let element: HTMLInputElement | undefined;
    const container = mount(() => (
      <>
        <Checkbox
          size="small"
          name="enabled"
          value="yes"
          checked={checked()}
          ref={node => (element = node)}
          onChange={event => setChecked(event.currentTarget.checked)}
        >
          Enabled
        </Checkbox>
        <ToggleSwitch disabled aria-label="Unavailable" />
      </>
    ));
    const input = container.querySelector('input')!;
    expect(input).toBe(element);
    expect(input.name).toBe('enabled');
    expect(input.value).toBe('yes');
    expect(input.hasAttribute('size')).toBe(false);
    expect(input.parentElement?.className).toBe('checkbox small');
    input.click();
    expect(checked()).toBe(true);
    expect(container.querySelector<HTMLInputElement>('[aria-label="Unavailable"]')?.disabled).toBe(true);
  });

  it('keeps field children native and slider value bindings reactive', () => {
    // Percent range: half complete, then a quarter complete.
    const maximum = 100;
    const [value, setValue] = createSignal(maximum / 2);
    const container = mount(() => (
      <>
        <Field floating border>
          <input id="field" />
          <label for="field">Field</label>
        </Field>
        <Slider
          size="medium"
          max={maximum}
          value={value()}
          onInput={event => setValue(event.currentTarget.valueAsNumber)}
        >
          <span class="tooltip">Value</span>
        </Slider>
      </>
    ));
    expect(new Set(container.querySelector('.field')?.classList)).toEqual(new Set(['field', 'label', 'border']));
    const range = container.querySelector<HTMLInputElement>('input[type="range"]')!;
    expect(range.parentElement?.children.length).toBe(3); // Input + track + supplied tooltip.
    setValue(maximum / 4);
    expect(range.valueAsNumber).toBe(maximum / 4);
  });

  it('retains events, refs and dynamic values after primitive compilation', () => {
    const [checked, setChecked] = createSignal(false);
    const [label, setLabel] = createSignal('First');
    const changed = vi.fn();
    let input: HTMLInputElement | undefined;
    const container = mount(() =>
      compiledPrimitives({
        get checked() {
          return checked();
        },
        value: 0,
        changed,
        inputRef: node => (input = node),
        get label() {
          return label();
        },
      }),
    );
    expect(input).toBe(container.querySelector('input[type="checkbox"]'));
    setChecked(true);
    expect(input?.checked).toBe(true);
    input!.click();
    expect(changed).toHaveBeenCalledOnce();
    setLabel('Second');
    expect(container.querySelector('article')?.textContent).toBe('Second');
    expect(container.querySelector('article')?.hasAttribute('padding')).toBe(false);
  });
});
