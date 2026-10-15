import type { Component } from 'solid-js';
import type { ExampleModeControl } from './example';

/** Switch source + copy output; preview state stays mounted. */
export const ExampleModeSwitch: Component<ExampleModeControl> = props => (
  <nav class="group" aria-label="Example syntax">
    <button
      type="button"
      class="small border"
      classList={{ active: props.mode() === 'native' }}
      aria-pressed={props.mode() === 'native'}
      onClick={() => props.setMode('native')}
    >
      Native JSX
    </button>
    <button
      type="button"
      class="small border"
      classList={{ active: props.mode() === 'component' }}
      aria-pressed={props.mode() === 'component'}
      onClick={() => props.setMode('component')}
    >
      Component API
    </button>
  </nav>
);
