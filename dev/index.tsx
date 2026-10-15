import { render } from 'solid-js/web';
import './styles.css';
import '../src/runtime';

import App from './App';

render(() => <App />, document.getElementById('root')!);
