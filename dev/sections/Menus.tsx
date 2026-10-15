import { createSignal } from 'solid-js';
import { Button, dialog, MenuSelect } from 'src';
import { createOption, DemoGroup, DemoSection, OptionGroup, Options } from '../site/Demo';
const options = [
  {
    value: 'beer',
    label: 'BeerCSS',
  },
  {
    value: 'solid',
    label: 'SolidJS',
  },
  {
    value: 'bun',
    label: 'Bun',
  },
];
// @demo interactive
export const EmptyMenuExample = (
  props: {
    appearance?: string;
  } = {},
) => {
  const [value, setValue] = createSignal<string>();
  return (
    <MenuSelect
      class={props.appearance}
      options={options}
      value={value()}
      onSelect={setValue}
      emptyOptionLabel="Choose a technology"
    />
  );
};
// @demo interactive
export const LabeledMenuExample = (
  props: {
    appearance?: string;
  } = {},
) => {
  const [value, setValue] = createSignal<string | undefined>('solid');
  return (
    <MenuSelect class={props.appearance} label="Technology" options={options} value={value()} onSelect={setValue} />
  );
};
// @demo interactive
export const FormMenuExample = (
  props: {
    appearance?: string;
    shape?: string;
  } = {},
) => {
  const [value, setValue] = createSignal<string>();
  const onSubmit = (event: SubmitEvent) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget as HTMLFormElement);
    dialog.toast(
      `FormData: ${[...data.entries()].map(([key, entry]) => `${key}=${String(entry)}`).join(', ') || '(empty)'}`,
    );
  };
  return (
    <form class="row" onSubmit={onSubmit}>
      <MenuSelect
        class={props.appearance}
        name="tech"
        required
        label="Submitted as tech"
        options={options}
        value={value()}
        onSelect={setValue}
      />
      <Button class={props.shape} type="submit">
        Submit
      </Button>
    </form>
  );
};
const Menus = () => {
  const shape = createOption(['', 'small-round', 'round']);
  const style = createOption(['', 'border', 'fill']);
  const size = createOption(['', 'small', 'large']);
  const appearance = () => [style.value(), shape.value(), size.value()].filter(Boolean).join(' ');
  return (
    <DemoSection id="menus" title="Menus">
      <DemoGroup
        title="Menu"
        doc="MENU"
        class="row wrap large-space top-align"
        options={
          <Options>
            <OptionGroup name="shape-menus" option={shape} />
            <OptionGroup name="style-menus" option={style} defaultLabel="plain" />
            <OptionGroup name="size-menus" option={size} defaultLabel="medium" />
          </Options>
        }
      >
        <EmptyMenuExample appearance={appearance()} />
        <LabeledMenuExample appearance={appearance()} />
        <FormMenuExample appearance={appearance()} shape={shape.value()} />
      </DemoGroup>
    </DemoSection>
  );
};
export default Menus;
