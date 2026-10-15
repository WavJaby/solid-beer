import { Collapsible } from 'src';
import { DemoGroup, DemoSection } from '../site/Demo';
const text =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.';
// @demo interactive
export const OpenPanelExample = () => (
  <Collapsible title={<h6>Open by default</h6>}>
    <div class="padding">
      <p>{text}</p>
    </div>
  </Collapsible>
);
// @demo interactive
export const ClosedPanelExample = () => (
  <Collapsible title={<h6>Closed by default</h6>} defaultOpen={false} class="border">
    <div class="padding">
      <p>{text}</p>
    </div>
  </Collapsible>
);
// @demo interactive
export const NestedPanelExample = () => (
  <Collapsible title={<h6>Nested</h6>} class="fill">
    <div class="padding">
      <Collapsible title={<h6>Inner</h6>} defaultOpen={false}>
        <div class="padding">
          <p>{text}</p>
        </div>
      </Collapsible>
    </div>
  </Collapsible>
);
const CustomExpansions = () => (
  <DemoSection id="custom-expansions" title="Collapsible panels">
    <DemoGroup title="Collapsible" class="row wrap large-space vertical">
      <OpenPanelExample />
      <ClosedPanelExample />
      <NestedPanelExample />
    </DemoGroup>
  </DemoSection>
);
export default CustomExpansions;
