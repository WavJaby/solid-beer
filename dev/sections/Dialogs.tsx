import { DemoGroup, DemoSection } from '../site/Demo';

// @demo interactive
export const NativeDialogExample = () => {
  let element!: HTMLDialogElement;
  return (
    <>
      <button onClick={() => element.showModal()}>Open native dialog</button>
      <dialog ref={element}>
        <h5>Native dialog</h5>
        <p>BeerCSS styles the browser dialog element.</p>
        <nav class="right-align">
          <button onClick={() => element.close()}>Close</button>
        </nav>
      </dialog>
    </>
  );
};

const Dialogs = () => (
  <DemoSection id="dialogs" title="Dialogs">
    <DemoGroup title="Native dialog" doc="DIALOG">
      <NativeDialogExample />
    </DemoGroup>
  </DemoSection>
);
export default Dialogs;
