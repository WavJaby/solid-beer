import { Badge, Button, Icon } from 'src';
import { createOption, DemoGroup, DemoSection, OptionGroup, Options } from '../site/Demo';
// @demo showcase
export const DotBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']} dot />
  </a>
);
// @demo showcase
export const SingleDigitBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']}>1</Badge>
  </a>
);
// @demo showcase
export const DoubleDigitBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']}>10</Badge>
  </a>
);
// @demo showcase
export const TextBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']}>New</Badge>
  </a>
);
// @demo showcase
export const SquareBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']} square>
      New
    </Badge>
  </a>
);
// @demo showcase
export const OutlinedTextBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge
      class="border"
      classes={[props.color ? `${props.color}-border ${props.color}-text` : '', props.position ?? '']}
    >
      New
    </Badge>
  </a>
);
// @demo showcase
export const OutlinedDoubleDigitBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge
      class="border"
      classes={[props.color ? `${props.color}-border ${props.color}-text` : '', props.position ?? '']}
    >
      10
    </Badge>
  </a>
);
// @demo showcase
export const OutlinedSingleDigitBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge
      class="border"
      classes={[props.color ? `${props.color}-border ${props.color}-text` : '', props.position ?? '']}
    >
      1
    </Badge>
  </a>
);
// @demo showcase
export const OutlinedSquareBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <a>
    <Icon>home</Icon>
    <Badge
      square
      class="border"
      classes={[props.color ? `${props.color}-border ${props.color}-text` : '', props.position ?? '']}
    >
      New
    </Badge>
  </a>
);
// @demo showcase
export const CircularButtonBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <Button shape="circle">
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']}>1</Badge>
  </Button>
);
// @demo showcase
export const ButtonBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <Button>
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']}>1</Badge>
  </Button>
);
// @demo showcase
export const CircularChipBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <Button class="chip" shape="circle">
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']}>1</Badge>
  </Button>
);
// @demo showcase
export const ChipBadgeExample = (
  props: {
    color?: string;
    position?: string;
  } = {},
) => (
  <Button class="chip">
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '', props.position ?? '']}>1</Badge>
  </Button>
);
// @demo showcase
export const IconInlineBadgeExample = (
  props: {
    color?: string;
  } = {},
) => (
  <Button>
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '']} inline>
      1
    </Badge>
  </Button>
);
// @demo showcase
export const TextInlineBadgeExample = (
  props: {
    color?: string;
  } = {},
) => (
  <Button>
    <span>Button</span>
    <Badge classes={[props.color ?? '']} inline>
      1
    </Badge>
  </Button>
);
// @demo showcase
export const ChipIconInlineBadgeExample = (
  props: {
    color?: string;
  } = {},
) => (
  <Button class="chip">
    <Icon>home</Icon>
    <Badge classes={[props.color ?? '']} inline>
      1
    </Badge>
  </Button>
);
// @demo showcase
export const ChipTextInlineBadgeExample = (
  props: {
    color?: string;
  } = {},
) => (
  <Button class="chip">
    <span>Button</span>
    <Badge classes={[props.color ?? '']} inline>
      1
    </Badge>
  </Button>
);
// @demo showcase
export const NotificationBadgeExample = () => (
  <a href="#badges">
    <Icon>notifications</Icon>
    <Badge dot />
  </a>
);
const Badges = () => {
  const color = createOption(['', 'primary', 'secondary', 'tertiary']);
  const position = createOption(['', 'top left', 'bottom left', 'bottom right']);
  return (
    <DemoSection id="badges" title="Badges">
      <DemoGroup
        title="Common badges"
        doc="BADGE"
        options={
          <Options>
            <OptionGroup name="color-badges" option={color} />
            <OptionGroup name="position-badges" option={position} />
          </Options>
        }
      >
        <DotBadgeExample color={color.value()} position={position.value()} />
        <SingleDigitBadgeExample color={color.value()} position={position.value()} />
        <DoubleDigitBadgeExample color={color.value()} position={position.value()} />
        <TextBadgeExample color={color.value()} position={position.value()} />
        <SquareBadgeExample color={color.value()} position={position.value()} />
        <OutlinedTextBadgeExample color={color.value()} position={position.value()} />
        <OutlinedDoubleDigitBadgeExample color={color.value()} position={position.value()} />
        <OutlinedSingleDigitBadgeExample color={color.value()} position={position.value()} />
        <OutlinedSquareBadgeExample color={color.value()} position={position.value()} />
        <CircularButtonBadgeExample color={color.value()} position={position.value()} />
        <ButtonBadgeExample color={color.value()} position={position.value()} />
        <CircularChipBadgeExample color={color.value()} position={position.value()} />
        <ChipBadgeExample color={color.value()} position={position.value()} />
      </DemoGroup>
      <DemoGroup title="Inline badge" doc="BADGE">
        <IconInlineBadgeExample color={color.value()} />
        <TextInlineBadgeExample color={color.value()} />
        <ChipIconInlineBadgeExample color={color.value()} />
        <ChipTextInlineBadgeExample color={color.value()} />
      </DemoGroup>
      <DemoGroup title="Notification badge" doc="BADGE">
        <NotificationBadgeExample />
      </DemoGroup>
    </DemoSection>
  );
};
export default Badges;
