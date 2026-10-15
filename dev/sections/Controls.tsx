import { createSignal, createUniqueId } from 'solid-js';
import { Checkbox, Field, Radio, Slider, ToggleSwitch } from 'src';
import { DemoGroup, DemoSection } from '../site/Demo';
// @demo interactive
export const CheckboxExample = () => {
  const [checked, setChecked] = createSignal(false);
  return (
    <div>
      <Checkbox checked={checked()} onChange={event => setChecked(event.currentTarget.checked)} data-demo-showcase>
        Enabled
      </Checkbox>
      <p role="status">Enabled: {String(checked())}</p>
    </div>
  );
};
// @demo interactive
export const RadioExample = () => {
  const [choice, setChoice] = createSignal('one');
  const name = createUniqueId();
  return (
    <div>
      <nav data-demo-showcase>
        <Radio name={name} value="one" checked={choice() === 'one'} onChange={() => setChoice('one')}>
          one
        </Radio>
        <Radio name={name} value="two" checked={choice() === 'two'} onChange={() => setChoice('two')}>
          two
        </Radio>
      </nav>
      <p role="status">Selected: {choice()}</p>
    </div>
  );
};
// @demo interactive
export const SwitchExample = () => {
  const [checked, setChecked] = createSignal(false);
  return (
    <div>
      <ToggleSwitch checked={checked()} onChange={event => setChecked(event.currentTarget.checked)} data-demo-showcase>
        Enabled
      </ToggleSwitch>
      <p role="status">Enabled: {String(checked())}</p>
    </div>
  );
};
// @demo interactive
export const InputExample = () => {
  const [value, setValue] = createSignal('');
  const id = createUniqueId();
  return (
    <div>
      <div class="max" data-demo-showcase>
        <Field border floating>
          <input
            id={id}
            type="text"
            placeholder=" "
            value={value()}
            onInput={event => setValue(event.currentTarget.value)}
          />
          <label for={id}>Name</label>
        </Field>
      </div>
      <p role="status">Value: {value() || 'Empty'}</p>
    </div>
  );
};
// @demo interactive
export const SelectExample = () => {
  const [value, setValue] = createSignal('');
  const id = createUniqueId();
  return (
    <div>
      <div class="max" data-demo-showcase>
        <Field border floating>
          <select id={id} value={value()} onChange={event => setValue(event.currentTarget.value)}>
            <option value="">Choose a technology</option>
            <option value="solid">SolidJS</option>
            <option value="native">Native JSX</option>
          </select>
          <label for={id}>Technology</label>
        </Field>
      </div>
      <p role="status">Value: {value() || 'Empty'}</p>
    </div>
  );
};
// @demo interactive
export const TextareaExample = () => {
  const [value, setValue] = createSignal('');
  const id = createUniqueId();
  return (
    <div>
      <div class="max" data-demo-showcase>
        <Field border floating>
          <textarea
            id={id}
            placeholder=" "
            rows={3}
            value={value()}
            onInput={event => setValue(event.currentTarget.value)}
          />
          <label for={id}>Message</label>
        </Field>
      </div>
      <p role="status">Value: {value() || 'Empty'}</p>
    </div>
  );
};
// @demo interactive
export const SliderExample = () => {
  const maximum = 100; // Percentage range: 0-100, starting halfway.
  const [value, setValue] = createSignal(maximum / 2);
  return (
    <div>
      <div class="max" data-demo-showcase>
        <Slider
          size="medium"
          aria-label="Demo slider"
          min={0}
          max={maximum}
          value={value()}
          onInput={event => setValue(event.currentTarget.valueAsNumber)}
        >
          <div class="tooltip" />
        </Slider>
      </div>
      <p role="status">Value: {value()}%</p>
    </div>
  );
};
export const Checkboxes = () => (
  <DemoSection id="checkboxes" title="Checkboxes">
    <DemoGroup title="Reactive checkbox" doc="CHECKBOX">
      <CheckboxExample />
    </DemoGroup>
  </DemoSection>
);
export const Radios = () => (
  <DemoSection id="radios" title="Radios">
    <DemoGroup title="One choice per group" doc="RADIO">
      <RadioExample />
    </DemoGroup>
  </DemoSection>
);
export const Switches = () => (
  <DemoSection id="switches" title="Switches">
    <DemoGroup title="Toggle state" doc="SWITCH">
      <SwitchExample />
    </DemoGroup>
  </DemoSection>
);
export const Fields = () => (
  <DemoSection id="fields" title="Fields">
    <DemoGroup title="Text input and floating label" doc="INPUT">
      <InputExample />
    </DemoGroup>

    <p>Field wraps appearance; native input attributes and handlers stay on the input.</p>
  </DemoSection>
);
export const Selects = () => (
  <DemoSection id="selects" title="Selects">
    <DemoGroup title="Native options in a field" doc="SELECT">
      <SelectExample />
    </DemoGroup>
  </DemoSection>
);
export const Textareas = () => (
  <DemoSection id="textareas" title="Textareas">
    <DemoGroup title="Multiline text" doc="TEXTAREA">
      <TextareaExample />
    </DemoGroup>
  </DemoSection>
);
export const Sliders = () => (
  <DemoSection id="sliders" title="Sliders">
    <DemoGroup title="Range with value indicator" doc="SLIDER">
      <SliderExample />
    </DemoGroup>
  </DemoSection>
);
