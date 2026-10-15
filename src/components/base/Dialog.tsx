import { createEffect, createUniqueId, type Component, on, onCleanup, type ParentProps, untrack } from 'solid-js';
import { Portal } from 'solid-js/web';
import { dialogStack } from '../../dialog';
import './Dialog.css';

export interface DialogProps {
  show: boolean;
  class?: string;
  onClose?: () => void;
  onAfterClose?: () => void;
  closeOnClickOutside?: boolean;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  'aria-describedby'?: string;
  closeLabel?: string;
}

const Dialog: Component<ParentProps<DialogProps>> = props => {
  const id = createUniqueId();
  let element!: HTMLDialogElement;
  let pressedBackdrop = false;

  createEffect(
    on(
      () => props.show,
      (show, previousShow) => {
        if (show) {
          // BeerCSS renders the closed state; establish it before first-mount transitions.
          element.getBoundingClientRect();
          element.showModal();
          dialogStack.push(id, () => props.onClose?.());
          onCleanup(() => dialogStack.pop(id));
        } else if (previousShow) {
          element.close();
          // getAnimations flushes CSS; cancelled/reopened exits must not dispose the new dialog.
          // Host + its pseudo-elements own exit; child spinners must not delay disposal.
          const animations = element
            .getAnimations({ subtree: true })
            .filter(animation => (animation.effect as KeyframeEffect | null)?.target === element);
          let cancelled = false;
          onCleanup(() => {
            cancelled = true;
          });
          const finish = () => {
            if (!cancelled) untrack(() => props.onAfterClose?.());
          };
          if (animations.length) void Promise.allSettled(animations.map(animation => animation.finished)).then(finish);
          else finish();
        }
      },
    ),
  );
  onCleanup(() => element.close());

  const isBackdrop = (event: MouseEvent) => {
    if (event.target !== element) return false;
    const bounds = element.getBoundingClientRect();
    return (
      event.clientX < bounds.left ||
      event.clientX >= bounds.right ||
      event.clientY < bounds.top ||
      event.clientY >= bounds.bottom
    );
  };

  return (
    <Portal>
      <dialog
        ref={element}
        class={`solid-beer-dialog vertical-padding ${props.class ?? ''}`}
        aria-label={props['aria-label'] ?? (props['aria-labelledby'] ? undefined : 'Dialog')}
        aria-labelledby={props['aria-labelledby']}
        aria-describedby={props['aria-describedby']}
        onCancel={event => {
          event.preventDefault();
          props.onClose?.();
        }}
        onClose={() => {
          if (props.show && !element.open) props.onClose?.();
        }}
        onPointerDown={event => {
          pressedBackdrop = isBackdrop(event);
        }}
        onClick={event => {
          if (pressedBackdrop && isBackdrop(event) && props.closeOnClickOutside) props.onClose?.();
          pressedBackdrop = false;
        }}
      >
        <button
          type="button"
          aria-label={props.closeLabel ?? 'Close dialog'}
          class="circle transparent small tw:z-10 tw:sticky tw:float-right tw:top-0"
          onClick={() => props.onClose?.()}
        >
          <i aria-hidden="true">close</i>
        </button>
        <div class="small-padding tw:relative">{props.children}</div>
      </dialog>
    </Portal>
  );
};

export default Dialog;
