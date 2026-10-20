import { smoke } from './smoke.js';

const worker = new Worker('./worker.js', { type: 'module' });
const workerResult = new Promise((resolve, reject) => {
  const timer = setTimeout(() => {
    worker.terminate();
    reject(new Error('Web Worker deadline'));
  }, 10000);
  worker.onmessage = (event) => {
    clearTimeout(timer);
    worker.terminate();
    resolve(event.data);
  };
  worker.onerror = (event) => {
    clearTimeout(timer);
    worker.terminate();
    reject(new Error(event.message));
  };
});
const results = Promise.all([smoke(), workerResult]);
(globalThis as unknown as { runtimeResults: typeof results }).runtimeResults =
  results;
void results.then(() => {
  document.body.textContent =
    'Installed package browser and Web Worker passed.';
});
