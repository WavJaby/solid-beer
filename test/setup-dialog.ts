import { beforeEach, vi } from 'vitest';

// jsdom lacks modal APIs; model open/close only. Browser checks own focus + inertness + scrolling.
if (typeof HTMLDialogElement !== 'undefined') beforeEach(() => {
  Object.defineProperties(HTMLDialogElement.prototype, {
    getAnimations: {
      configurable: true,
      value: vi.fn(() => []),
    },
    showModal: {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) { this.open = true; }),
    },
    close: {
      configurable: true,
      value: vi.fn(function (this: HTMLDialogElement) { this.open = false; }),
    },
  });
});
