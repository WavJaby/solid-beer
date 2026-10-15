import { type Component, type ParentProps } from 'solid-js';
import { dialog } from '../../dialog';

export interface CopyButtonProps {
  text: string;
  class?: string;
  onClick?: (event: MouseEvent) => void;
}

const CopyButton: Component<ParentProps<CopyButtonProps>> = props => {
  const copy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      dialog.toast('Clipboard unavailable');
      return;
    }
    dialog.toast('Copied to clipboard');
  };
  const handleClick = (event: MouseEvent) => {
    event.stopPropagation();
    void copy(props.text);
    props.onClick?.(event);
  };

  return (
    <div class="row no-space">
      <span class="small-text">{props.text}</span>
      <button
        type="button"
        aria-label="Copy text"
        class={`transparent circle small ${props.class ?? ''}`}
        onClick={handleClick}
      >
        <i class="tiny">content_copy</i>
      </button>
    </div>
  );
};

export default CopyButton;
