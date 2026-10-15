import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { dialog } from '../src';

// Fake only scheduling; DOM changes + timer ownership run through the shipped BeerCSS runtime.
const duration = 3000; // Existing public display duration; independent contract expectation.
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
  document.querySelectorAll('.snackbar').forEach(element => element.remove());
  document.querySelector('[data-toast-focus]')?.remove();
  // Deliver teardown mutations while fake timers still own BeerCSS's background scan.
  await Promise.resolve();
  vi.clearAllTimers();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
const snackbar = () => document.getElementById('solid-beer-snackbar')!;
const frame = () => vi.advanceTimersToNextTimer();

describe('dialog.toast with BeerCSS', () => {
  it('shows plain text through the runtime and hides after the public duration', () => {
    dialog.toast('<b>Saved</b>');
    const element = snackbar();
    expect(element.className).toBe('snackbar');
    frame();
    expect(element.classList.contains('active')).toBe(true);
    expect(element.textContent).toBe('<b>Saved</b>');
    expect(element.querySelector('b')).toBeNull();
    vi.advanceTimersByTime(duration);
    expect(element.classList.contains('active')).toBe(false);
  });
  it('reuses the element and restarts the timer without an earlier call hiding the latest message', () => {
    dialog.toast('First');
    frame();
    const element = snackbar();
    vi.advanceTimersByTime(duration / 2);
    dialog.toast('Second');
    frame();
    expect(snackbar()).toBe(element);
    expect(document.querySelectorAll('#solid-beer-snackbar')).toHaveLength(1);
    expect(element.textContent).toBe('Second');
    vi.advanceTimersByTime(duration / 2);
    expect(element.classList.contains('active')).toBe(true);
    vi.advanceTimersByTime(duration / 2);
    expect(element.classList.contains('active')).toBe(false);
  });
  it('uses official blur, single-active-snackbar and click-dismiss behavior', () => {
    const input = document.createElement('input');
    input.dataset.toastFocus = '';
    const other = document.createElement('div');
    other.className = 'snackbar active';
    document.body.append(input, other);
    input.focus();
    expect(document.activeElement).toBe(input);
    dialog.toast('Saved');
    frame();
    expect(document.activeElement).not.toBe(input);
    expect(other.classList.contains('active')).toBe(false);
    const element = snackbar();
    element.click();
    expect(element.classList.contains('active')).toBe(false);
    dialog.toast('Again');
    frame();
    expect(element.classList.contains('active')).toBe(true);
    vi.advanceTimersByTime(duration);
    expect(element.classList.contains('active')).toBe(false);
  });
  it('reports missing runtime before creating notification DOM', () => {
    vi.stubGlobal('ui', undefined);
    expect(() => dialog.toast('Saved')).toThrow('dialog.toast requires a client import of solid-beer/runtime');
    expect(document.getElementById('solid-beer-snackbar')).toBeNull();
  });
});
