import { type Component, createSignal, createUniqueId, type JSX } from 'solid-js';
import { createStore, produce } from 'solid-js/store';
import ConfirmDialog from './components/composite/ConfirmDialog';
import type {} from 'beercss';

const TOAST_DURATION_MS = 3000; // Preserve the public toast display duration.

export interface DialogEntry {
  id: string;
  onClose: () => void;
}

export interface ProgrammaticDialogEntry {
  id: string;
  Component: Component<any>;
  props: Record<string, any>;
  class?: string;
  closeOnClickOutside?: boolean;
}

const [stack, setStack] = createSignal<DialogEntry[]>([]);
const [programmaticDialogs, setProgrammaticDialogs] = createStore<ProgrammaticDialogEntry[]>([]);
const componentIds = new WeakMap<Component<any>, string>();

const getComponentId = (component: Component<any>) => {
  const existingId = componentIds.get(component);
  if (existingId) return existingId;
  const id = createUniqueId();
  componentIds.set(component, id);
  return id;
};

const resolveDialogId = (component: Component<any>, explicitId?: string) => {
  if (explicitId) return explicitId;
  const defaultId = getComponentId(component);
  return programmaticDialogs.some(dialogEntry => dialogEntry.id === defaultId) ? createUniqueId() : defaultId;
};

export const dialogStack = {
  get current() {
    return stack();
  },
  push(id: string, onClose: () => void) {
    setStack(previous => [...previous, { id, onClose }]);
  },
  pop(id: string) {
    setStack(previous => previous.filter(entry => entry.id !== id));
  },
  isTop(id: string) {
    const entries = stack();
    return entries.length > 0 && entries[entries.length - 1]?.id === id;
  },
  closeTop() {
    stack().at(-1)?.onClose();
  },
};

const closeDialog = (id: string, originalOnClose?: () => void) => {
  const index = programmaticDialogs.findIndex(entry => entry.id === id);
  if (index === -1 || !programmaticDialogs[index]?.props.show) return;

  setProgrammaticDialogs(index, 'props', 'show', false);
  originalOnClose?.();
};

export const removeProgrammaticDialog = (id: string) => {
  setProgrammaticDialogs(
    produce(entries => {
      const index = entries.findIndex(entry => entry.id === id);
      if (index !== -1 && !entries[index]?.props.show) entries.splice(index, 1);
    }),
  );
};

export const dialog = {
  show<T extends Record<string, any>>(
    component: Component<T>,
    props: Omit<T, 'show' | 'onClose'> & { onClose?: () => void },
    options?: { id?: string; class?: string; closeOnClickOutside?: boolean },
  ) {
    const id = resolveDialogId(component, options?.id);
    const existingIndex = programmaticDialogs.findIndex(entry => entry.id === id);
    if (existingIndex !== -1) {
      setProgrammaticDialogs(existingIndex, 'props', previous => ({
        ...previous,
        ...props,
        show: true,
        onClose: () => closeDialog(id, props.onClose),
      }));
      return id;
    }

    const entry: ProgrammaticDialogEntry = {
      id,
      Component: component,
      class: options?.class,
      closeOnClickOutside: options?.closeOnClickOutside,
      props: { ...props, show: true, onClose: () => closeDialog(id, props.onClose) },
    };
    setProgrammaticDialogs(produce(entries => entries.push(entry)));
    return id;
  },

  confirm(message: string | JSX.Element, title?: string) {
    return new Promise<boolean>(resolve => {
      dialog.show(ConfirmDialog, {
        message,
        title,
        onConfirm: () => resolve(true),
        onCancel: () => resolve(false),
        onClose: () => resolve(false),
      });
    });
  },

  alert(message: string | JSX.Element, title?: string) {
    return new Promise<void>(resolve => {
      dialog.show(
        ConfirmDialog,
        {
          message,
          title,
          alertMode: true,
          onConfirm: () => resolve(),
          onClose: () => resolve(),
        },
        { closeOnClickOutside: true },
      );
    });
  },

  error(message: string | JSX.Element) {
    return dialog.alert(message, 'Error');
  },

  toast(message: string) {
    if (typeof document === 'undefined') return;
    if (typeof globalThis.ui !== 'function')
      throw new Error('dialog.toast requires a client import of solid-beer/runtime');
    const id = 'solid-beer-snackbar';
    let snackbar = document.getElementById(id);
    if (!snackbar) {
      snackbar = document.createElement('div');
      snackbar.id = id;
      snackbar.className = 'snackbar';
      document.body.append(snackbar);
    }
    snackbar.textContent = message;
    globalThis.ui(snackbar, TOAST_DURATION_MS);
  },
};

export { programmaticDialogs };
