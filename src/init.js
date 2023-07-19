import { readJson, join } from './utils';

Neutralino.init();

Neutralino.events.on('windowClose', () => {
  Neutralino.app.exit();
});

export let config = null;
export let neutralinoConfig;
export const init = async () => {
  config = await readJson(join(NL_CWD, 'editor.config.json'));
  neutralinoConfig = await Neutralino.app.getConfig();
};
