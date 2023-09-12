import { onClick, join } from './utils';

const terminal = document.getElementById('terminal');
const hexoButtons = document.getElementById('hexoButtons');

const clearTerminal = () => {
  terminal.innerHTML = '';
};

const escRx = /\x1b\[\d+m/gm;
const progressRx = /--\s*.+\sTamaño:\s*\d+\s*Total:\s*\d+\s*--/m;
const preRx = /<pre>.*<\/pre>/gms;
const doneRx = /--\s*DONE\s*--/im;
const emptyInfo = /info\s*$/im;

const appendTerminal = (contents) => {
  if (emptyInfo.test(contents)) return;
  if (progressRx.test(contents)) {
    const log = terminal.innerHTML;
    if (preRx.test(log)) {
      terminal.innerHTML = log.replace(preRx, `<pre>${contents}</pre>`);
      return;
    } else {
      contents = `<pre>${contents}</pre>`;
    }
  }
  terminal.innerHTML = `${terminal.innerHTML}${contents
    .replaceAll('\n', '<br/>')
    .replaceAll(escRx, '')}`;
  if (contents.length) {
    terminal.lastElementChild?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }
};

const launch = async (command) => {
  const process = await Neutralino.os.spawnProcess(
    `node ${join(NL_PATH, 'extensions/hexo.js')} ${command}`
  );

  await new Promise((resolve, reject) => {
    const handler = (ev) => {
      const { id, data, action } = ev.detail;
      if (process.id == id) {
        switch (action) {
          case 'stdOut':
            if (doneRx.test(data)) {
              Neutralino.events.off('spawnedProcess', handler);
              resolve();
            } else {
              appendTerminal(data);
            }
            break;
          case 'stdErr':
            appendTerminal(data);
            reject();
            break;
          case 'exit':
            appendTerminal(
              `<hr/>El processo terminó con ${data ? `error ${data}` : `éxito`}`
            );
            Neutralino.events.off('spawnedProcess', handler);
            resolve();
            break;
        }
      }
    };
    Neutralino.events.on('spawnedProcess', handler);
  });
};

const anyClick = async () =>
  new Promise((resolve) => {
    terminal.addEventListener(
      'click',
      () => {
        resolve();
      },
      { once: true }
    );
  });

const disableButtons = (d) => {
  for (const btn of hexoButtons.querySelectorAll('button')) {
    btn.disabled = d;
  }
};

onClick(
  hexoButtons,
  async (btn) => {
    disableButtons(true);
    await launch(btn.name);
    appendTerminal('<hr/>Haga click en esta ventana para cerrar');
    await anyClick();
    clearTerminal();
    disableButtons(false);
  },
  'button'
);
