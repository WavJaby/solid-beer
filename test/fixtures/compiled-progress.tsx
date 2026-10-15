import { Progress as Indicator, type ProgressProps } from 'solid-beer';

export const compiledProgress = (props: Pick<ProgressProps, 'value' | 'max' | 'ref' | 'onClick'>) => (
  <Indicator
    shape="circle"
    wavy
    size="small"
    value={props.value}
    max={props.max}
    ref={props.ref}
    onClick={props.onClick}
    aria-label="Compiled progress"
    data-compiled="true"
  />
);
