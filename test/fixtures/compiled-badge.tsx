import { Badge, Button, type ButtonProps } from 'solid-beer';

export const compiledButton = (props: Pick<ButtonProps, 'disabled' | 'onClick' | 'ref'>) => (
  <Button class="primary" disabled={props.disabled} onClick={props.onClick} ref={props.ref}>
    <i>home</i>
    <span>Save</span>
    <Badge class="none">0</Badge>
  </Button>
);
export const compiledBadge = () => (
  <a href="#custom-components">
    <i>home</i>
    <Badge class="min" />
  </a>
);

export const compiledDynamicButton = (props: { icon: () => string; label: () => string; count: () => number }) => (
  <Button>
    <i>{props.icon()}</i>
    <span>{props.label()}</span>
    <Badge>{props.count()}</Badge>
  </Button>
);
