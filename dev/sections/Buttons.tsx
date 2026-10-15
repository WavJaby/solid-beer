import { Badge, Button, Icon, type ButtonProps } from 'src';
import { createOption, DemoGroup, DemoSection, OptionGroup, Options } from '../site/Demo';
// @demo showcase
export const PlainButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    Button
  </Button>
);
// @demo showcase
export const IconTextButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    <Icon>home</Icon>
    <span>Button</span>
  </Button>
);
// @demo showcase
export const RoundedButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    smallRound
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    Button
  </Button>
);
// @demo showcase
export const RoundedIconButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    smallRound
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    <Icon>home</Icon>
    <span>Button</span>
  </Button>
);
// @demo showcase
export const BorderButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    border
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    Button
  </Button>
);
// @demo showcase
export const BorderIconButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    border
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    <Icon>home</Icon>
    <span>Button</span>
  </Button>
);
// @demo showcase
export const RoundedBorderButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    border
    smallRound
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    Button
  </Button>
);
// @demo showcase
export const RoundedBorderIconButtonExample = (
  props: { color?: string; size?: ButtonProps['size']; elevation?: ButtonProps['elevation']; vertical?: boolean } = {},
) => (
  <Button
    classes={[props.color ?? '']}
    border
    smallRound
    fill={props.color === 'fill'}
    size={props.size}
    elevation={props.elevation}
    vertical={props.vertical}
  >
    <Icon>home</Icon>
    <span>Button</span>
  </Button>
);
// @demo showcase
export const SearchButtonExample = (props: { size?: ButtonProps['size'] } = {}) => (
  <Button shape="circle" size={props.size}>
    <Icon>search</Icon>
  </Button>
);
// @demo showcase
export const BorderSearchButtonExample = (props: { size?: ButtonProps['size'] } = {}) => (
  <Button shape="circle" border size={props.size}>
    <Icon>search</Icon>
  </Button>
);
// @demo showcase
export const FilledSearchButtonExample = (props: { size?: ButtonProps['size'] } = {}) => (
  <Button shape="circle" fill size={props.size}>
    <Icon>search</Icon>
  </Button>
);
// @demo showcase
export const TransparentSearchButtonExample = (props: { size?: ButtonProps['size'] } = {}) => (
  <Button shape="circle" class="transparent" size={props.size}>
    <Icon>search</Icon>
  </Button>
);
// @demo showcase
export const LargeFabExample = (props: { color?: string } = {}) => (
  <Button classes={[props.color ?? '']} shape="square" size="extra" round fill={props.color === 'fill'}>
    <Icon>add</Icon>
  </Button>
);
// @demo showcase
export const FabExample = (props: { color?: string } = {}) => (
  <Button classes={[props.color ?? '']} shape="square" round fill={props.color === 'fill'}>
    <Icon>add</Icon>
  </Button>
);
// @demo showcase
export const ExtendedFabExample = (props: { color?: string } = {}) => (
  <Button classes={[props.color ?? '']} extended shape="square" round fill={props.color === 'fill'}>
    <Icon>add</Icon>
    <span>Extended</span>
  </Button>
);
// @demo showcase
export const CircularExtendedFabExample = (props: { color?: string } = {}) => (
  <Button classes={[props.color ?? '']} extended shape="circle" fill={props.color === 'fill'}>
    <Icon>add</Icon>
    <span>Circle</span>
  </Button>
);
// @demo showcase
export const BadgeButtonExample = () => (
  <Button class="primary">
    <Icon>favorite</Icon>
    <span>Follow</span>
    <Badge inline>0</Badge>
  </Button>
);
const Buttons = () => {
  const color = createOption(['', 'fill', 'primary', 'secondary', 'tertiary']);
  const size = createOption(['small', 'medium', 'large', 'extra'], 'medium');
  const elevate = createOption(['none', 'small', 'medium', 'large']);
  const direction = createOption(['', 'vertical']);
  const iconSize = createOption(['small', 'medium', 'large', 'extra'], 'medium');
  const fabColor = createOption(['', 'fill', 'primary', 'secondary', 'tertiary']);
  return (
    <DemoSection id="buttons" title="Buttons">
      <DemoGroup
        title="Common buttons"
        doc="BUTTON"
        class="row wrap large-space"
        options={
          <Options>
            <OptionGroup name="color-buttons" option={color} />
            <OptionGroup name="size-buttons" option={size} defaultLabel="medium" />
            <OptionGroup name="elevate-buttons" option={elevate} defaultLabel="no-elevate" />
            <OptionGroup name="direction-buttons" option={direction} defaultLabel="horizontal" />
          </Options>
        }
      >
        <PlainButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
        <IconTextButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
        <RoundedButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
        <RoundedIconButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
        <BorderButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
        <BorderIconButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
        <RoundedBorderButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
        <RoundedBorderIconButtonExample
          color={color.value()}
          size={size.value()}
          elevation={elevate.value()}
          vertical={direction.value() === 'vertical'}
        />
      </DemoGroup>
      <DemoGroup
        title="Icon buttons"
        doc="BUTTON"
        options={
          <Options>
            <OptionGroup name="size-icon-buttons" option={iconSize} defaultLabel="medium" />
          </Options>
        }
      >
        <SearchButtonExample size={iconSize.value()} />
        <BorderSearchButtonExample size={iconSize.value()} />
        <FilledSearchButtonExample size={iconSize.value()} />
        <TransparentSearchButtonExample size={iconSize.value()} />
      </DemoGroup>
      <DemoGroup
        title="FABs"
        doc="BUTTON"
        options={
          <Options>
            <OptionGroup name="color-fabs" option={fabColor} />
          </Options>
        }
      >
        <LargeFabExample color={fabColor.value()} />
        <FabExample color={fabColor.value()} />
        <ExtendedFabExample color={fabColor.value()} />
        <CircularExtendedFabExample color={fabColor.value()} />
      </DemoGroup>
      <DemoGroup title="Button with badge" doc="BUTTON">
        <BadgeButtonExample />
      </DemoGroup>
    </DemoSection>
  );
};
export default Buttons;
