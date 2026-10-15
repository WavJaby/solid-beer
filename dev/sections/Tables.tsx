import { createOption, DemoGroup, DemoSection, OptionGroup, Options } from '../site/Demo';

// @demo showcase
export const NativeTableExample = (props: { style?: string; align?: string; space?: string } = {}) => (
  <table
    classList={{
      border: props.style === 'border' || props.style === 'border stripes',
      stripes: props.style === 'stripes' || props.style === 'border stripes',
      'center-align': props.align === 'center-align',
      'right-align': props.align === 'right-align',
      'no-space': props.space === 'no-space',
      'medium-space': props.space === 'medium-space',
      'large-space': props.space === 'large-space',
    }}
  >
    <thead>
      <tr>
        <th>Component</th>
        <th>Element</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>Progress</td>
        <td>progress</td>
      </tr>
      <tr>
        <td>Button</td>
        <td>button</td>
      </tr>
    </tbody>
  </table>
);

const Tables = () => {
  const style = createOption(['border', 'stripes', 'border stripes']);
  const align = createOption(['', 'center-align', 'right-align']);
  const space = createOption(['', 'no-space', 'medium-space', 'large-space']);
  return (
    <DemoSection id="tables" title="Tables">
      <DemoGroup
        title="Native table"
        doc="TABLE"
        options={
          <Options>
            <OptionGroup name="native-table-style" option={style} />
            <OptionGroup name="native-table-align" option={align} defaultLabel="left-align" />
            <OptionGroup name="native-table-space" option={space} defaultLabel="small-space" />
          </Options>
        }
      >
        <NativeTableExample style={style.value()} align={align.value()} space={space.value()} />
      </DemoGroup>
    </DemoSection>
  );
};
export default Tables;
