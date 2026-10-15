import { createSignal } from 'solid-js';
import { Button, Icon, Table } from 'src';
import { createOption, DemoGroup, DemoSection, OptionGroup, Options } from '../site/Demo';

interface Row {
  name: string;
  status: string;
}
const rows: Row[] = [
  { name: 'Badge', status: 'Implemented' },
  { name: 'Button', status: 'Implemented' },
  { name: 'Table', status: 'Implemented' },
];
const columns = [
  { header: 'Component', cell: (row: Row) => row.name },
  { header: 'Status', cell: (row: Row) => row.status },
];
// @demo interactive
export const SelectableTableExample = (props: { appearance?: string } = {}) => {
  const [selected, setSelected] = createSignal(new Set<number>());
  return (
    <div class="s12 l6">
      <h5 class="h6">Selectable with actions</h5>
      <Table
        data={rows}
        columns={columns}
        tableClass={props.appearance}
        selectedIndices={selected}
        onSelectionChange={setSelected}
        actions={
          <Button size="small" border disabled={selected().size === 0}>
            <Icon>delete</Icon>
            <span>Delete</span>
          </Button>
        }
      />
    </div>
  );
};
// @demo interactive
export const LoadingTableExample = (props: { appearance?: string } = {}) => (
  <div class="s12 l6">
    <h5 class="h6">Loading</h5>
    <Table data={undefined} columns={columns} tableClass={props.appearance} loading />
  </div>
);
// @demo interactive
export const EmptyTableExample = (props: { appearance?: string } = {}) => (
  <div class="s12 l6">
    <h5 class="h6">Empty</h5>
    <Table data={[]} columns={columns} tableClass={props.appearance} emptyText="No components" />
  </div>
);
const CustomTables = () => {
  const style = createOption(['border', 'stripes', 'border stripes'], 'border');
  const align = createOption(['', 'center-align', 'right-align']);
  const space = createOption(['', 'no-space', 'medium-space', 'large-space']);
  const appearance = () => [style.value(), align.value(), space.value()].filter(Boolean).join(' ');
  return (
    <DemoSection id="custom-tables" title="Data tables">
      <DemoGroup
        title="Table"
        doc="TABLE"
        class="grid large-space"
        options={
          <Options>
            <OptionGroup name="style-tables" option={style} />
            <OptionGroup name="align-tables" option={align} defaultLabel="left-align" />
            <OptionGroup name="space-tables" option={space} defaultLabel="small-space" />
          </Options>
        }
      >
        <SelectableTableExample appearance={appearance()} />
        <LoadingTableExample appearance={appearance()} />
        <EmptyTableExample appearance={appearance()} />
      </DemoGroup>
    </DemoSection>
  );
};
export default CustomTables;
