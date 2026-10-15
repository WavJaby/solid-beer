import { For, type Component } from 'solid-js';
import { programmaticDialogs, removeProgrammaticDialog } from '../../dialog';
import Dialog from '../base/Dialog';

const DialogStack: Component = () => (
  <For each={programmaticDialogs}>
    {entry => (
      <Dialog
        show={entry.props.show}
        onClose={entry.props.onClose}
        onAfterClose={() => removeProgrammaticDialog(entry.id)}
        class={entry.class}
        closeOnClickOutside={entry.closeOnClickOutside}
        aria-label={typeof entry.props.title === 'string' ? entry.props.title : undefined}
      >
        <entry.Component {...entry.props} />
      </Dialog>
    )}
  </For>
);

export default DialogStack;
