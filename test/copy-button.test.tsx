import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { CopyButton } from '../src';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
  return container;
};
const settle = async () => { await Promise.resolve(); await Promise.resolve(); };
const notification = () => document.getElementById('solid-beer-snackbar');
const useTimers = () => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'requestAnimationFrame'] });
};
beforeAll(async () => {
  useTimers();
  await import('../src/runtime');
  vi.clearAllTimers();
  vi.useRealTimers();
});
beforeEach(useTimers);
afterEach(async () => {
  disposers.splice(0).forEach(dispose => dispose());
  notification()?.remove();
  // Deliver teardown mutations while fake timers still own BeerCSS's background scan.
  await Promise.resolve();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe('CopyButton', () => {
  it('waits for successful copying before showing the official toast, without submitting or bubbling', async () => {
    let resolve!: () => void;
    const copied = new Promise<void>(done => { resolve = done; });
    const write = vi.fn(() => copied);
    vi.stubGlobal('navigator', { clipboard: { writeText: write } });
    const callback = vi.fn();
    const submit = vi.fn((event: SubmitEvent) => event.preventDefault());
    const bubble = vi.fn();
    const container = mount(() => (
      <form onSubmit={submit} onClick={bubble}><CopyButton text="bun add solid-beer" onClick={callback} /></form>
    ));
    const button = container.querySelector<HTMLButtonElement>('[aria-label="Copy text"]')!;
    button.click();
    expect(write).toHaveBeenCalledWith('bun add solid-beer');
    expect(callback).toHaveBeenCalledOnce();
    expect(submit).not.toHaveBeenCalled();
    expect(bubble).not.toHaveBeenCalled();
    expect(notification()).toBeNull();
    resolve();
    await settle();
    vi.advanceTimersToNextTimer();
    expect(notification()?.textContent).toBe('Copied to clipboard');
    expect(notification()?.classList.contains('active')).toBe(true);
    notification()!.click();
    expect(notification()?.classList.contains('active')).toBe(false);
  });
  it('copies the current reactive text and reports a rejected clipboard write', async () => {
    const write = vi.fn().mockResolvedValueOnce(undefined).mockRejectedValueOnce(new Error('Denied'));
    vi.stubGlobal('navigator', { clipboard: { writeText: write } });
    const [text, setText] = createSignal('First');
    const container = mount(() => <CopyButton text={text()} />);
    container.querySelector('button')!.click();
    await settle();
    vi.advanceTimersToNextTimer();
    const element = notification();
    setText('Second');
    expect(container.querySelector('span')?.textContent).toBe('Second');
    container.querySelector('button')!.click();
    await settle();
    vi.advanceTimersToNextTimer();
    expect(write.mock.calls).toEqual([['First'], ['Second']]);
    expect(notification()).toBe(element);
    expect(notification()?.textContent).toBe('Clipboard unavailable');
    expect(notification()?.classList.contains('active')).toBe(true);
  });
  it('reports missing clipboard support without throwing from the click handler', () => {
    vi.stubGlobal('navigator', {});
    const container = mount(() => <CopyButton text="Text" />);
    container.querySelector('button')!.click();
    vi.advanceTimersToNextTimer();
    expect(notification()?.textContent).toBe('Clipboard unavailable');
    expect(notification()?.classList.contains('active')).toBe(true);
  });
});
