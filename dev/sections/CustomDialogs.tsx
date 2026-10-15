import { createSignal, type Component } from 'solid-js';
import { Button, Dialog, dialog, Icon } from 'src';
import { createOption, DemoGroup, DemoSection, OptionGroup, Options } from '../site/Demo';
// @demo interactive
export const ControlledDialogExample = (
  props: {
    appearance?: string;
  } = {},
) => {
  const [show, setShow] = createSignal(false);
  return (
    <>
      <Button onClick={() => setShow(true)}>Controlled</Button>
      <Dialog show={show()} onClose={() => setShow(false)} class={props.appearance} closeOnClickOutside>
        <h5>Controlled dialog</h5>
        <p>Class: {props.appearance || '(default)'}. Escape and overlay click close it.</p>
        <nav class="right-align">
          <Button border onClick={() => setShow(false)}>
            Close
          </Button>
        </nav>
      </Dialog>
    </>
  );
};
// Mount DialogStack once near the app root for programmatic dialogs.
// @demo interactive
export const ConfirmDialogExample = () => (
  <Button
    border
    onClick={() =>
      void dialog.confirm('Delete this item?', 'Confirm').then(ok => dialog.toast(ok ? 'Confirmed' : 'Cancelled'))
    }
  >
    dialog.confirm()
  </Button>
);
// @demo interactive
export const AlertDialogExample = () => (
  <Button border onClick={() => void dialog.alert('Saved.', 'Done')}>
    dialog.alert()
  </Button>
);
const RecursiveDialog: Component<{ onClose: () => void; depth: number }> = props => (
  <>
    <h5>Recursive dialog (depth: {props.depth})</h5>
    <p>This demonstrates stackable dialogs.</p>
    <p>Each dialog manages its own close action.</p>
    <nav class="right-align">
      <button class="border" onClick={props.onClose}>
        Close this
      </button>
      <button class="primary" onClick={() => dialog.show(RecursiveDialog, { depth: props.depth + 1 })}>
        Open depth {props.depth + 1}
      </button>
    </nav>
  </>
);
// @demo interactive
export const StackedDialogExample = (
  props: {
    appearance?: string;
  } = {},
) => (
  <Button
    class="primary"
    onClick={() =>
      dialog.show(
        RecursiveDialog,
        {
          depth: 1,
        },
        {
          class: props.appearance,
        },
      )
    }
  >
    <Icon>layers</Icon>
    <span>Stacked dialogs</span>
  </Button>
);
const CustomDialogs = () => {
  const position = createOption(['', 'left', 'right', 'top', 'bottom', 'max']);
  const size = createOption(['', 'small', 'medium', 'large']);
  const appearance = () => [position.value(), size.value()].filter(Boolean).join(' ');
  return (
    <DemoSection id="custom-dialogs" title="Dialog workflows">
      <DemoGroup
        title="Dialog API"
        doc="DIALOG"
        options={
          <Options>
            <OptionGroup name="position-dialogs" option={position} />
            <OptionGroup name="size-dialogs" option={size} />
          </Options>
        }
      >
        <ControlledDialogExample appearance={appearance()} />
        <ConfirmDialogExample />
        <AlertDialogExample />
        <StackedDialogExample appearance={appearance()} />
      </DemoGroup>
    </DemoSection>
  );
};
export default CustomDialogs;
