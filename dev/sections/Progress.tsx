import { createSignal } from 'solid-js';
import { Progress, type ProgressProps, type ProgressShape, type ProgressSize } from '../../src';
import { DemoGroup, DemoSection } from '../site/Demo';

// Percent examples: half complete initially; the slider spans the full percentage scale.
const PERCENT_MAX = 100;
const INITIAL_PERCENT = PERCENT_MAX / 2;
const shapes: readonly ProgressShape[] = ['linear', 'circle'];
const sizes: readonly ProgressSize[] = ['small', 'medium', 'large', 'max'];

// @demo showcase
export const CircularProgressExample = (props: Pick<ProgressProps, 'value' | 'max'> = {}) => (
  <Progress shape="circle" wavy size="small" value={props.value} max={props.max} aria-label="Example progress" />
);

// @demo showcase
export const ProgressExample = (props: ProgressProps = {}) => (
  <Progress
    shape={props.shape ?? 'linear'}
    size={props.size ?? 'medium'}
    wavy={props.wavy ?? false}
    value={props.value}
    max={props.max}
    aria-label="Example progress"
  />
);

const ProgressExamples = () => {
  const [shape, setShape] = createSignal<ProgressShape>('linear');
  const [size, setSize] = createSignal<ProgressSize>('medium');
  const [wavy, setWavy] = createSignal(false);
  const [indeterminate, setIndeterminate] = createSignal(false);
  const [value, setValue] = createSignal(INITIAL_PERCENT);

  return (
    <DemoSection id="progress" title="Progress">
      <DemoGroup
        title="Progress indicators"
        doc="PROGRESS"
        options={
          <>
            <nav class="wrap" aria-label="Progress shape">
              {shapes.map(choice => (
                <label class="radio">
                  <input
                    type="radio"
                    name="progress-shape"
                    value={choice}
                    checked={shape() === choice}
                    onChange={() => setShape(choice)}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </nav>
            <nav class="wrap" aria-label="Progress size">
              {sizes.map(choice => (
                <label class="radio">
                  <input
                    type="radio"
                    name="progress-size"
                    value={choice}
                    checked={size() === choice}
                    onChange={() => setSize(choice)}
                  />
                  <span>{choice}</span>
                </label>
              ))}
            </nav>
            <nav class="wrap">
              <label class="checkbox">
                <input type="checkbox" checked={wavy()} onChange={event => setWavy(event.currentTarget.checked)} />
                <span>Wavy</span>
              </label>
              <label class="checkbox">
                <input
                  type="checkbox"
                  checked={indeterminate()}
                  onChange={event => setIndeterminate(event.currentTarget.checked)}
                />
                <span>Indeterminate</span>
              </label>
              <label class="row">
                <span>Value: {value()}%</span>
                <input
                  type="range"
                  aria-label="Progress value"
                  min={0}
                  max={PERCENT_MAX}
                  value={value()}
                  disabled={indeterminate()}
                  onInput={event => setValue(event.currentTarget.valueAsNumber)}
                />
              </label>
            </nav>
          </>
        }
      >
        <ProgressExample
          shape={shape()}
          size={size()}
          wavy={wavy()}
          value={indeterminate() ? undefined : value()}
          max={PERCENT_MAX}
        />
      </DemoGroup>
      <DemoGroup title="Circular indicator" doc="PROGRESS">
        <CircularProgressExample value={indeterminate() ? undefined : value()} max={PERCENT_MAX} />
      </DemoGroup>
    </DemoSection>
  );
};

export default ProgressExamples;
