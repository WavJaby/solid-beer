import type { ParentProps } from 'solid-js';

const Nav = (props: ParentProps) => (
  <>
    <nav class="top max l gap-1">{props.children}</nav>
    <nav class="left max m">{props.children}</nav>
    <nav class="s bottom">{props.children}</nav>
  </>
);

export default Nav;
