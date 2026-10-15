import { type Component, type JSX, type ParentProps, Show } from 'solid-js';

export interface ConfirmDialogProps {
  title?: string;
  message: string | JSX.Element;
  confirmText?: string;
  cancelText?: string;
  confirmClass?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
  onClose?: () => void;
  alertMode?: boolean;
}

const ConfirmDialog: Component<ParentProps<ConfirmDialogProps>> = props => {
  const confirm = () => {
    props.onConfirm?.();
    props.onClose?.();
  };

  const cancel = () => {
    props.onCancel?.();
    props.onClose?.();
  };

  return (
    <>
      <Show when={props.title}>
        <h5>{props.title}</h5>
      </Show>
      <p>{props.message}</p>
      <nav class="right-align">
        <Show when={!props.alertMode}>
          <button type="button" class="border" onClick={cancel}>
            {props.cancelText ?? 'Cancel'}
          </button>
        </Show>
        <button type="button" class={props.confirmClass} onClick={confirm}>
          {props.confirmText ?? 'OK'}
        </button>
      </nav>
    </>
  );
};

export default ConfirmDialog;
