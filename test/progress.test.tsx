import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Progress, type ProgressShape, type ProgressSize } from '../src';
import { compiledProgress } from './fixtures/compiled-progress';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
  return container;
};

afterEach(() => {
  disposers.splice(0).forEach(dispose => dispose());
});

describe('Progress', () => {
  it('preserves live value/max removal, element identity, refs and events through the compiler', () => {
    // Percentage fixture: half complete initially; HTML spec uses position -1 when value is absent.
    const total = 100;
    const [value, setValue] = createSignal<number | undefined>(total / 2);
    const [max, setMax] = createSignal<number | undefined>(total);
    const onClick = vi.fn();
    let element: HTMLProgressElement | undefined;
    const container = mount(() =>
      compiledProgress({
        get value() {
          return value();
        },
        get max() {
          return max();
        },
        ref: node => {
          element = node;
        },
        onClick,
      }),
    );
    const progress = container.querySelector('progress')!;
    expect(progress).toBe(element);
    expect(progress.className).toBe('circle wavy small');
    expect(progress.value).toBe(total / 2);
    expect(progress.max).toBe(total);
    expect(progress.getAttribute('aria-label')).toBe('Compiled progress');
    expect(progress.hasAttribute('shape')).toBe(false);
    progress.click();
    expect(onClick).toHaveBeenCalledOnce();
    setValue(total);
    expect(container.querySelector('progress')).toBe(progress);
    expect(progress.value).toBe(total);
    setValue(undefined);
    setMax(undefined);
    expect(progress.hasAttribute('value')).toBe(false);
    expect(progress.hasAttribute('max')).toBe(false);
    expect(progress.position).toBe(-1);
  });
  it('keeps native indeterminate semantics and forwards refs, attributes and events', () => {
    let element: HTMLProgressElement | undefined;
    const onClick = vi.fn();
    const container = mount(() => (
      <Progress
        ref={node => {
          element = node;
        }}
        aria-label="Loading"
        data-task="upload"
        onClick={onClick}
      />
    ));
    const progress = container.querySelector('progress')!;
    expect(element).toBe(progress);
    expect(progress.hasAttribute('value')).toBe(false);
    expect(progress.position).toBe(-1); // HTML spec: absent value -> indeterminate position.
    expect(progress.getAttribute('aria-label')).toBe('Loading');
    expect(progress.getAttribute('data-task')).toBe('upload');
    progress.click();
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('updates appearance and progress without replacing the native element', () => {
    // Percentage fixture: initially half complete, then fully complete.
    const total = 100;
    const [value, setValue] = createSignal<number | undefined>(total / 2);
    const [shape, setShape] = createSignal<ProgressShape>('circle');
    const [size, setSize] = createSignal<ProgressSize>('small');
    const [wavy, setWavy] = createSignal(true);
    const [highlighted, setHighlighted] = createSignal(true);
    const container = mount(() => (
      <Progress
        shape={shape()}
        size={size()}
        wavy={wavy()}
        value={value()}
        max={total}
        classList={{ margin: highlighted() }}
      />
    ));
    const progress = container.querySelector('progress')!;
    expect(progress.className).toBe('margin circle wavy small');
    expect(progress.value).toBe(total / 2);
    expect(progress.max).toBe(total);
    expect(progress.hasAttribute('shape')).toBe(false);
    expect(progress.hasAttribute('size')).toBe(false);
    expect(progress.hasAttribute('wavy')).toBe(false);
    setShape('linear');
    setSize('large');
    setWavy(false);
    setValue(total);
    expect(container.querySelector('progress')).toBe(progress);
    expect(progress.className).toBe('margin large');
    expect(progress.value).toBe(total);
    setHighlighted(false);
    expect(progress.className).toBe('large');
    setValue(undefined);
    expect(progress.hasAttribute('value')).toBe(false);
    expect(progress.position).toBe(-1); // HTML spec: value removed -> indeterminate position.
  });

  it('preserves class-only usage and lets explicit props override conflicting helpers', () => {
    const container = mount(() => (
      <>
        <Progress class="circle wavy small margin" />
        <Progress class="circle wavy small large margin" shape="linear" wavy={false} size="medium" />
      </>
    ));
    const [nativeStyle, overridden] = container.querySelectorAll('progress');
    expect(nativeStyle?.className).toBe('circle wavy small margin');
    expect(overridden?.className).toBe('margin medium');
  });
});
