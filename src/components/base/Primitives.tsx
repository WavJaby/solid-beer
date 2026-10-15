import { type JSX, splitProps } from 'solid-js';
import { Dynamic } from 'solid-js/web';
import { beerClass, beerPropKeys, beerRecipes, type BeerComponentName, type BeerRecipe } from '../../appearance';

type Options<N extends BeerComponentName> = {
  [P in keyof (typeof beerRecipes)[N]['options']]?: (typeof beerRecipes)[N]['options'][P] extends readonly string[]
    ? (typeof beerRecipes)[N]['options'][P][number]
    : (typeof beerRecipes)[N]['options'][P] extends string
    ? boolean
    : keyof (typeof beerRecipes)[N]['options'][P];
} & { classes?: readonly string[] };
type HostProps<N extends BeerComponentName, Tag extends keyof JSX.IntrinsicElements> = Omit<
  JSX.IntrinsicElements[Tag],
  keyof Options<N>
> &
  Options<N>;
type ChoiceProps<N extends 'Checkbox' | 'Radio' | 'ToggleSwitch'> = Omit<
  JSX.InputHTMLAttributes<HTMLInputElement>,
  'type' | 'size'
> &
  Options<N>;

/** Appearance props stay on the wrapper; native attributes, events and refs target the input for controls. */
const primitive =
  <P extends object>(name: BeerComponentName) =>
  (props: P) => {
    const recipe: BeerRecipe = beerRecipes[name];
    const [local, rest] = splitProps(props as Record<string, unknown>, beerPropKeys(recipe));
    const attributes = Object.fromEntries((recipe.attributeBindings ?? []).map(name => ['attr:' + name, undefined]));
    for (const name of recipe.attributeBindings ?? [])
      Object.defineProperty(attributes, 'attr:' + name, { enumerable: true, get: () => local[name] });
    if (recipe.kind === 'choice')
      return (
        <label class={beerClass(recipe, local)}>
          <input {...(rest as JSX.InputHTMLAttributes<HTMLInputElement>)} type={recipe.inputType} />
          <span>{local.children as JSX.Element}</span>
        </label>
      );
    if (recipe.kind === 'slider')
      return (
        <div class={beerClass(recipe, local)}>
          <input {...(rest as JSX.InputHTMLAttributes<HTMLInputElement>)} type="range" />
          <span />
          {local.children as JSX.Element}
        </div>
      );
    return (
      <Dynamic
        component={recipe.tag as keyof JSX.IntrinsicElements}
        {...rest}
        {...attributes}
        class={beerClass(recipe, local)}
        children={local.children as JSX.Element}
      />
    );
  };

export type AppBarProps = HostProps<'AppBar', 'header'>;
export type ProgressProps = HostProps<'Progress', 'progress'>;
export type ProgressShape = NonNullable<ProgressProps['shape']>;
export type ProgressSize = NonNullable<ProgressProps['size']>;
export type ButtonProps = HostProps<'Button', 'button'>;
export type BadgeProps = HostProps<'Badge', 'span'>;
export type BottomAppBarProps = HostProps<'BottomAppBar', 'footer'>;
export type CardProps = HostProps<'Card', 'article'>;
export type ChipProps = HostProps<'Chip', 'button'>;
export type CheckboxProps = ChoiceProps<'Checkbox'>;
export type RadioProps = ChoiceProps<'Radio'>;
export type ToggleSwitchProps = ChoiceProps<'ToggleSwitch'>;
export type DividerProps = HostProps<'Divider', 'hr'>;
export type FieldProps = HostProps<'Field', 'div'>;
export type IconProps = HostProps<'Icon', 'i'>;
export type ListProps = HostProps<'List', 'ul'>;
export type NavigationProps = HostProps<'Navigation', 'nav'>;
export type OverlayProps = HostProps<'Overlay', 'div'>;
export type PageProps = HostProps<'Page', 'div'>;
export type SliderProps = Omit<JSX.InputHTMLAttributes<HTMLInputElement>, 'type' | 'size'> & Options<'Slider'>;
export type SnackbarProps = HostProps<'Snackbar', 'div'>;
export type TabsProps = HostProps<'Tabs', 'div'>;
export type TabProps = HostProps<'Tab', 'a'>;
export type TooltipProps = HostProps<'Tooltip', 'span'>;

export const AppBar = primitive<AppBarProps>('AppBar');
export const Progress = primitive<ProgressProps>('Progress');
export const Button = primitive<ButtonProps>('Button');
export const Badge = primitive<BadgeProps>('Badge');
export const BottomAppBar = primitive<BottomAppBarProps>('BottomAppBar');
export const Card = primitive<CardProps>('Card');
export const Chip = primitive<ChipProps>('Chip');
export const Checkbox = primitive<CheckboxProps>('Checkbox');
export const Radio = primitive<RadioProps>('Radio');
export const ToggleSwitch = primitive<ToggleSwitchProps>('ToggleSwitch');
export const Divider = primitive<DividerProps>('Divider');
export const Field = primitive<FieldProps>('Field');
export const Icon = primitive<IconProps>('Icon');
export const List = primitive<ListProps>('List');
export const Navigation = primitive<NavigationProps>('Navigation');
export const Overlay = primitive<OverlayProps>('Overlay');
export const Page = primitive<PageProps>('Page');
export const Slider = primitive<SliderProps>('Slider');
export const Snackbar = primitive<SnackbarProps>('Snackbar');
export const Tabs = primitive<TabsProps>('Tabs');
export const Tab = primitive<TabProps>('Tab');
export const Tooltip = primitive<TooltipProps>('Tooltip');
