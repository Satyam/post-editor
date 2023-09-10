import { onClick } from './utils';

const terminal = document.getElementById('terminal');
const hexoButtons = document.getElementById('hexoButtons');

const nEv = Neutralino.events;

const clearTerminal = () => {
  terminal.innerHTML = '';
};

const escRx = /\x1b\[\d+m/gm;
const progressRx = /--\s*.+\sTamaño:\s*\d+\s*Total:\s*\d+\s*--/m;
const preRx = /<pre>.*<\/pre>/gms;

const appendTerminal = (contents) => {
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
    terminal.lastElementChild.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }
};

['LOG', 'WARN', 'INFO', 'TRACE', 'ERROR', 'FATAL'].forEach((type) => {
  nEv.on(type, (ev) => {
    appendTerminal(`${type}: ${ev.detail}\n`);
  });
});

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
    await Neutralino.extensions.dispatch('js.neutralino.hexo', btn.name, {});
    await new Promise((resolve) => {
      window.addEventListener(
        'DONE',
        (ev) => {
          appendTerminal(`DONE: ${ev.detail}\n`);
          resolve();
        },
        { once: true }
      );
    });
    appendTerminal('<hr/>Haga click en esta ventana para cerrar');
    await anyClick();
    clearTerminal();
    disableButtons(false);
  },
  'button'
);
