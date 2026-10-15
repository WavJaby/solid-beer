import { createSignal } from 'solid-js';
import { render } from 'solid-js/web';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { Dialog, DialogStack, dialog, dialogStack, programmaticDialogs } from '../src';

const disposers: Array<() => void> = [];
const mount = (view: Parameters<typeof render>[0]) => {
  const container = document.createElement('div');
  document.body.append(container);
  disposers.push(render(view, container), () => container.remove());
};
const current = () => [...document.querySelectorAll<HTMLDialogElement>('dialog[open]')].at(-1)!;
const exitAnimation = (target: Element, finished: Promise<void>) => ({ finished, effect: { target } }) as unknown as Animation;
const cancel = (element = current()) => {
  const event = new Event('cancel', { cancelable: true });
  element.dispatchEvent(event);
  return event;
};
const backdrop = (element = current()) => {
  // jsdom's dialog rect is empty; negative coordinates lie outside it.
  const position = { bubbles: true, clientX: -1, clientY: -1 };
  element.dispatchEvent(new MouseEvent('pointerdown', position));
  element.dispatchEvent(new MouseEvent('click', position));
};

afterEach(() => {
  for (const entry of [...programmaticDialogs]) entry.props.onClose();
  if (vi.isFakeTimers()) vi.runOnlyPendingTimers();
  disposers.splice(0).forEach(dispose => dispose());
  vi.useRealTimers();
  vi.restoreAllMocks();
});

describe('Dialog lifecycle', () => {
  it('waits for every exit animation before reporting completion', async () => {
    const [show, setShow] = createSignal(true);
    const onAfterClose = vi.fn();
    mount(() => <Dialog show={show()} onAfterClose={onAfterClose}>Content</Dialog>);
    let finishMotion!: () => void;
    let finishBackdrop!: () => void;
    const motion = new Promise<void>(resolve => { finishMotion = resolve; });
    const backdropMotion = new Promise<void>(resolve => { finishBackdrop = resolve; });
    const element = current();
    const child = element.querySelector('div')!;
    vi.mocked(element.getAnimations).mockReturnValue([exitAnimation(element, motion), exitAnimation(element, backdropMotion), exitAnimation(child, new Promise(() => {}))]);
    setShow(false);
    expect(element.getAnimations).toHaveBeenCalledWith({ subtree: true });
    expect(onAfterClose).not.toHaveBeenCalled();
    finishMotion();
    await motion;
    expect(onAfterClose).not.toHaveBeenCalled();
    finishBackdrop();
    await Promise.allSettled([motion, backdropMotion]);
    await Promise.resolve();
    expect(onAfterClose).toHaveBeenCalledOnce();
  });

  it('ignores an earlier exit when reopened and closed again', async () => {
    const [show, setShow] = createSignal(true);
    const onAfterClose = vi.fn();
    mount(() => <Dialog show={show()} onAfterClose={onAfterClose}>Content</Dialog>);
    let finishOld!: () => void;
    let finishNew!: () => void;
    const oldExit = new Promise<void>(resolve => { finishOld = resolve; });
    const newExit = new Promise<void>(resolve => { finishNew = resolve; });
    const element = current();
    vi.mocked(element.getAnimations).mockReturnValueOnce([exitAnimation(element, oldExit)]).mockReturnValueOnce([exitAnimation(element, newExit)]);
    setShow(false);
    setShow(true);
    setShow(false);
    finishOld();
    await oldExit;
    await Promise.resolve();
    expect(onAfterClose).not.toHaveBeenCalled();
    finishNew();
    await newExit;
    await Promise.resolve();
    expect(onAfterClose).toHaveBeenCalledOnce();
  });

  it.each([false, true])('handles cancelled animations with disposed=%s', async disposed => {
    const [show, setShow] = createSignal(true);
    const onAfterClose = vi.fn();
    mount(() => <Dialog show={show()} onAfterClose={onAfterClose}>Content</Dialog>);
    let reject!: (error: Error) => void;
    const finished = new Promise<void>((_, fail) => { reject = fail; });
    const element = current();
    vi.mocked(element.getAnimations).mockReturnValue([exitAnimation(element, finished)]);
    setShow(false);
    if (disposed) disposers.shift()!();
    reject(new Error('Animation cancelled'));
    await Promise.allSettled([finished]);
    await Promise.resolve();
    expect(onAfterClose).toHaveBeenCalledTimes(disposed ? 0 : 1); // Disposal suppresses completion; cancellation alone completes cleanup.
  });

  it('retains programmatic DOM until exit completes and updates reopened callbacks', async () => {
    mount(() => <DialogStack />);
    const original = vi.fn();
    const updated = vi.fn();
    const content = () => <p>Programmatic content</p>;
    const id = dialog.show(content, { onClose: original }, { id: 'animation-test' });
    let finishExit!: () => void;
    const finished = new Promise<void>(resolve => { finishExit = resolve; });
    const element = current();
    vi.mocked(element.getAnimations).mockReturnValue([exitAnimation(element, finished)]);
    element.querySelector<HTMLButtonElement>('button')!.click();
    expect(original).toHaveBeenCalledOnce();
    expect(element.isConnected).toBe(true);
    expect(programmaticDialogs.find(entry => entry.id === id)?.props.show).toBe(false);
    dialog.show(content, { onClose: updated }, { id });
    finishExit();
    await finished;
    await Promise.resolve();
    expect(element.open).toBe(true);
    expect(element.isConnected).toBe(true);
    vi.mocked(element.getAnimations).mockReturnValue([]);
    element.querySelector<HTMLButtonElement>('button')!.click();
    expect(updated).toHaveBeenCalledOnce();
    expect(original).toHaveBeenCalledOnce();
    expect(element.isConnected).toBe(false);
  });

  it('opens natively, tracks dialogs without callbacks and closes on hide/disposal', () => {
    const [show, setShow] = createSignal(false);
    mount(() => <Dialog show={show()} aria-label="Details" closeLabel="Dismiss details">Content</Dialog>);
    expect(document.querySelector('dialog')!.open).toBe(false);
    setShow(true);
    const element = current();
    expect(element.showModal).toHaveBeenCalledOnce();
    expect(element.getAttribute('aria-label')).toBe('Details');
    expect(element.querySelector('button')!.getAttribute('aria-label')).toBe('Dismiss details');
    expect(element.querySelector('button')!.type).toBe('button');
    expect(dialogStack.current).toHaveLength(1); // One visible dialog, even without a close callback.
    expect(cancel(element).defaultPrevented).toBe(true);
    expect(element.open).toBe(true);
    setShow(false);
    expect(element.open).toBe(false);
    expect(dialogStack.current).toHaveLength(0);
    setShow(true);
    disposers.shift()!();
    expect(element.open).toBe(false);
    expect(dialogStack.current).toHaveLength(0);
  });

  it('keeps controlled state authoritative and accepts labelled/described content', () => {
    const onClose = vi.fn();
    mount(() => <Dialog show onClose={onClose} aria-labelledby="title" aria-describedby="description"><h2 id="title">Title</h2><p id="description">Description</p></Dialog>);
    const element = current();
    expect(element.hasAttribute('aria-label')).toBe(false);
    expect(element.getAttribute('aria-labelledby')).toBe('title');
    expect(element.getAttribute('aria-describedby')).toBe('description');
    expect(cancel(element).defaultPrevented).toBe(true);
    expect(onClose).toHaveBeenCalledOnce();
    expect(element.open).toBe(true);
    backdrop(element);
    expect(onClose).toHaveBeenCalledOnce();
    element.close();
    element.dispatchEvent(new Event('close'));
    expect(onClose).toHaveBeenCalledTimes(2); // Cancel + external native close.
  });

  it('dismisses only a complete backdrop click when enabled', () => {
    const onClose = vi.fn();
    mount(() => <Dialog show closeOnClickOutside onClose={onClose}>Content</Dialog>);
    const element = current();
    const content = element.querySelector('div')!;
    content.dispatchEvent(new MouseEvent('pointerdown', { bubbles: true }));
    element.dispatchEvent(new MouseEvent('click', { bubbles: true, clientX: -1, clientY: -1 }));
    expect(onClose).not.toHaveBeenCalled();
    content.click();
    expect(onClose).not.toHaveBeenCalled();
    backdrop(element);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('removes only the top dialog and retains its parent', () => {
    const [parent, setParent] = createSignal(true);
    const [child, setChild] = createSignal(true);
    mount(() => <><Dialog show={parent()} onClose={() => setParent(false)}>Parent</Dialog><Dialog show={child()} onClose={() => setChild(false)}>Child</Dialog></>);
    expect(dialogStack.current).toHaveLength(2); // Parent + child.
    cancel();
    expect(child()).toBe(false);
    expect(parent()).toBe(true);
    expect(document.querySelectorAll('dialog[open]')).toHaveLength(1);
    dialogStack.closeTop();
    expect(document.querySelectorAll('dialog[open]')).toHaveLength(0);
  });
});

describe('dialog promises', () => {
  it.each(['confirm', 'cancel', 'escape', 'close'] as const)('settles confirm through %s', async action => {
    vi.useFakeTimers();
    mount(() => <DialogStack />);
    const result = dialog.confirm('Continue?', 'Confirmation');
    vi.runOnlyPendingTimers();
    const element = current();
    expect(element.getAttribute('aria-label')).toBe('Confirmation');
    if (action === 'escape') cancel(element);
    else if (action === 'close') element.querySelector<HTMLButtonElement>('[aria-label="Close dialog"]')!.click();
    else [...element.querySelectorAll('button')].find(button => button.textContent === (action === 'confirm' ? 'OK' : 'Cancel'))!.click();
    await expect(result).resolves.toBe(action === 'confirm');
    expect(element.open).toBe(false);
  });

  it.each(['confirm', 'escape', 'close', 'backdrop'] as const)('settles alert through %s', async action => {
    vi.useFakeTimers();
    mount(() => <DialogStack />);
    const result = dialog.alert('Saved');
    vi.runOnlyPendingTimers();
    const element = current();
    if (action === 'escape') cancel(element);
    else if (action === 'backdrop') backdrop(element);
    else if (action === 'close') element.querySelector<HTMLButtonElement>('[aria-label="Close dialog"]')!.click();
    else [...element.querySelectorAll('button')].find(button => button.textContent === 'OK')!.click();
    await expect(result).resolves.toBeUndefined();
    expect(element.open).toBe(false);
  });
});
