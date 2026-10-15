import { Badge, Button, Card, Field, Overlay, Progress, type CardProps, type ProgressProps } from 'solid-beer';

export const DynamicBadge = (props: { class?: string; helpers?: string }) => (
  <Button class={props.class}>
    <span>Save</span>
    <Badge class={props.helpers}>0</Badge>
  </Button>
);

export const DynamicClassList = (props: {
  enabled: boolean;
  border: CardProps['border'];
  elevation: CardProps['elevation'];
  wavy: ProgressProps['wavy'];
  read: () => boolean;
}) => (
  <>
    <Card
      class="border small-padding margin small-elevate"
      classList={{ 'border round': props.read(), 'large-padding': props.enabled }}
      border={props.border}
      elevation={props.elevation}
    >
      Surface
    </Card>
    <Progress
      class="wavy margin"
      classList={{ wavy: props.enabled, 'custom circle': props.enabled }}
      wavy={props.wavy}
    />
    <Field classList={{ field: props.enabled, custom: props.enabled }} />
    <Button classList={{ custom: props.enabled }}>Save</Button>
  </>
);

export const DynamicAppearance = (props: {
  border: CardProps['border'];
  elevation: CardProps['elevation'];
  active: boolean;
  shape: ProgressProps['shape'];
  size: ProgressProps['size'];
  wavy: ProgressProps['wavy'];
  value: number | undefined;
}) => (
  <>
    <Card class="border small-elevate margin" border={props.border} elevation={props.elevation}>
      Surface
    </Card>
    <Overlay active={props.active} />
    <Progress
      class="circle wavy small margin"
      shape={props.shape}
      size={props.size}
      wavy={props.wavy}
      value={props.value}
    />
  </>
);
