import { render, renderIcons } from './render.js';
import { DemoSession } from './state.js';

const root = document.getElementById('app');
if (!(root instanceof HTMLElement))
  throw new Error('Missing application root.');
const session = new DemoSession((kind) =>
  kind === 'icons' ? renderIcons(root, session.state) : render(root, session),
);
render(root, session);
