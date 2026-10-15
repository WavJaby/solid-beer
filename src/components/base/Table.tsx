import { createMemo, For, Show, type Accessor, type JSX, type ParentProps } from 'solid-js';

export interface Column<T> {
  header: JSX.Element | string;
  cell: (row: T, index: number) => JSX.Element;
  headerClass?: string;
  cellClass?: string;
}

export interface TableProps<T> {
  data: T[] | undefined;
  columns: Column<T>[];
  /** Supply both selection props to enable checkboxes. */
  selectedIndices?: Accessor<Set<number>>;
  onSelectionChange?: (indices: Set<number>) => void;
  loading?: boolean;
  emptyText?: string;
  class?: string;
  maxHeight?: string;
  /** Classes on the inner `<table>`; default `border`. BeerCSS: `border stripes left-align center-align right-align no-space small-space medium-space large-space`. */
  tableClass?: string;
  actions?: JSX.Element;
  selectionFallback?: JSX.Element;
  onRowClick?: (row: T, index: number) => void;
}

function Table<T>(props: ParentProps<TableProps<T>>) {
  const selectable = () => Boolean(props.selectedIndices && props.onSelectionChange);
  const selectedCount = () => (selectable() ? props.selectedIndices!().size : 0);
  const columnCount = () => props.columns.length + Number(selectable());
  const isAllSelected = createMemo(() => Boolean(props.data?.length) && props.data?.length === selectedCount());
  const toggleAll = () => {
    if (!props.data) return;
    props.onSelectionChange!(isAllSelected() ? new Set() : new Set(props.data.map((_, index) => index)));
  };
  const toggleRow = (index: number) => {
    const next = new Set(props.selectedIndices!());
    if (next.has(index)) next.delete(index);
    else next.add(index);
    props.onSelectionChange!(next);
  };

  return (
    <div class={props.class}>
      <Show when={selectable() || props.actions || props.selectionFallback}>
        <nav class="row tiny-padding">
          <Show when={selectedCount() > 0} fallback={props.selectionFallback}>
            <span class="chip small primary no-margin">{selectedCount()} selected</span>
          </Show>
          <div class="max" />
          {props.actions}
        </nav>
      </Show>
      <div class="scroll no-round" style={{ 'max-height': props.maxHeight }}>
        <table class={`${props.tableClass ?? 'border'} no-margin`}>
          <thead>
            <tr>
              <Show when={selectable()}>
                <th class="min">
                  <label class="checkbox">
                    <input type="checkbox" checked={isAllSelected()} onChange={toggleAll} />
                    <span />
                  </label>
                </th>
              </Show>
              <For each={props.columns}>{column => <th class={column.headerClass}>{column.header}</th>}</For>
            </tr>
          </thead>
          <tbody>
            <Show when={props.loading}>
              <tr>
                <td colspan={columnCount()} class="center-align">
                  <progress class="circle small" />
                </td>
              </tr>
            </Show>
            <Show when={!props.loading && !props.data?.length}>
              <tr>
                <td colspan={columnCount()} class="center-align large-opacity">
                  {props.emptyText ?? 'No items found'}
                </td>
              </tr>
            </Show>
            <Show when={!props.loading && props.data}>
              <For each={props.data}>
                {(row, index) => (
                  <tr onClick={() => props.onRowClick?.(row, index())}>
                    <Show when={selectable()}>
                      <td class="min">
                        <label class="checkbox" onClick={event => event.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={props.selectedIndices!().has(index())}
                            onChange={() => toggleRow(index())}
                          />
                          <span />
                        </label>
                      </td>
                    </Show>
                    <For each={props.columns}>
                      {column => <td class={column.cellClass}>{column.cell(row, index())}</td>}
                    </For>
                  </tr>
                )}
              </For>
            </Show>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Table;
