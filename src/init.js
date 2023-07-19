import { readJson, join } from './utils';

Neutralino.init();

Neutralino.events.on('windowClose', () => {
  Neutralino.app.exit();
});

export let config = null;

export const init = () =>
  readJson(join(NL_CWD, editor.config.json)).then((cfg) => {
    config = cfg;
  });
