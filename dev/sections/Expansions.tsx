import { DemoGroup, DemoSection } from '../site/Demo';
const Expansions = () => (
  <DemoSection id="expansions" title="Expansions">
    <DemoGroup title="Native details" doc="EXPANSION" class="row wrap large-space vertical">
      <DisclosureExample />
      <OpenDisclosureExample />
      <NestedDisclosureExample />
    </DemoGroup>
  </DemoSection>
);
export default Expansions;
// @demo showcase
export const DisclosureExample = () => (
  <details>
    <summary>Click to expand</summary>
    <p>A native disclosure styled with BeerCSS.</p>
  </details>
);
// @demo showcase
export const OpenDisclosureExample = () => (
  <details open>
    <summary>Open by default</summary>
    <p>Use the open attribute for the initial state.</p>
  </details>
);
// @demo showcase
export const NestedDisclosureExample = () => (
  <details>
    <summary>Multiple levels</summary>
    <details>
      <summary>First</summary>
      <details>
        <summary>Second</summary>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore
          magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo
          consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla
          pariatur.
        </p>
      </details>
    </details>
  </details>
);
