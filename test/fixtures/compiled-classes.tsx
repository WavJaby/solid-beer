import { Button, Badge, Progress } from 'solid-beer';

export const CompiledClasses = (props: { classes: () => readonly string[]; enabled: boolean }) => (
  <>
    <Button
      class="border custom"
      classes={props.classes()}
      classList={{ custom: props.enabled }}
      border={false}
      size="small"
    >
      Save
    </Button>
    <Badge classes={props.classes()} classList={{ badge: false }} inline>
      0
    </Badge>
    <Progress class="wavy" classes={props.classes()} classList={{ custom: props.enabled }} wavy={false} shape="circle" />
  </>
);
