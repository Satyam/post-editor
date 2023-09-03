import { EVENT, on } from './events';
import { onClick } from './utils';
import { confirm } from './dialog';

const terminal = document.getElementById('terminal');
const hexoButtons = document.getElementById('hexoButtons');

const clearTerminal = () => {
  terminal.innerHTML = '';
};

const escRx = /\x1b\[\d\dm/g;
const setTerminal = (contents) => {
  terminal.innerHTML = contents.replaceAll('\n', '<br/>').replaceAll(escRx, '');
};

const appendTerminal = (contents) => {
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

let activeProcess = false;

const setActiveProcess = (id) => {
  activeProcess = id ?? false;
  for (const btn of hexoButtons.querySelectorAll('button')) {
    btn.disabled = id !== false;
  }
};

const killActiveProcess = async () => {
  if (activeProcess !== false)
    await Neutralino.os.updateSpawnedProcess(activeProcess, 'exit');
  setActiveProcess(false);
};

on(EVENT.PAGE_SWITCH, async () => {
  if (activeProcess === false) return false;
  if (
    await confirm(
      'El servidor local está activo y no se puede cambiar de solapa mientras lo esté.<br/>¿Desea apagarlo?',
      '¿Quiere apagarlo?'
    )
  ) {
    await killActiveProcess();
    return false;
  } else {
    return true; // stop switch;
  }
});

export const generate = async (wait = false) => {
  const process = await Neutralino.os.spawnProcess('npm run hexo:generate');
  setActiveProcess(process.id);

  await new Promise((resolve, reject) => {
    const handler = async (ev) => {
      const { id, data, action } = ev.detail;
      if (process.id == id) {
        switch (action) {
          case 'stdOut':
            appendTerminal(data);
            break;
          case 'stdErr':
            appendTerminal(data);
            reject();
            break;
          case 'exit':
            appendTerminal(
              `<hr/>La generación terminó con ${
                data ? `error ${data}` : `éxito`
              }`
            );
            Neutralino.events.off('spawnedProcess', handler);
            setActiveProcess(false);
            if (wait) {
              appendTerminal('<hr/>Haga click [aquí] para cerrar');
              await anyClick();
              resolve();
            } else resolve();
            break;
        }
      }
    };
    Neutralino.events.on('spawnedProcess', handler);
  });
};

const hexoURL = /(http:\/\/localhost:\d+\/[^\s\x1b\?]*)/;

export const server = async () => {
  const process = await Neutralino.os.spawnProcess('npm run hexo:server');
  setActiveProcess(process.id);
  await new Promise((resolve, reject) => {
    const handler = async (ev) => {
      const { id, data, action } = ev.detail;
      if (process.id == id) {
        switch (action) {
          case 'stdOut':
            const m = hexoURL.exec(data);
            if (m) {
              appendTerminal(`<hr/>Haga click en esta ventana para cerrar el servidor<br/>
            La solapa del navegador debe cerrarla independientemente<br/>`);
              Neutralino.os.open(m[1]);
              await anyClick();
              await killActiveProcess();
            } else {
              appendTerminal(data);
            }
            break;
          case 'stdErr':
            appendTerminal(data);
            reject();
            break;
          case 'exit':
            Neutralino.events.off('spawnedProcess', handler);
            setActiveProcess(false);
            resolve();
            break;
        }
      }
    };

    Neutralino.events.on('spawnedProcess', handler);
  });
};

export const upload = async () => {
  const process = await Neutralino.os.spawnProcess('npm run hexo:deploy');
  setActiveProcess(process.id);

  await new Promise((resolve, reject) => {
    const handler = async (ev) => {
      const { id, data, action } = ev.detail;
      if (process.id == id) {
        switch (action) {
          case 'stdOut':
            if (data.includes('basicFTP')) {
              appendTerminal(`${data}\n<pre class="mono"></pre>`);
            } else if (data.includes('>>')) {
              document.querySelector('pre.mono').innerHTML = data;
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
              `<hr/>La generación terminó con ${
                data ? `error ${data}` : `éxito`
              }<hr/>Haga click [aquí] para cerrar`
            );
            Neutralino.events.off('spawnedProcess', handler);
            setActiveProcess(false);
            await anyClick();
            resolve();
            break;
        }
      }
    };
    Neutralino.events.on('spawnedProcess', handler);
  });
};

onClick(
  hexoButtons,
  async (btn) => {
    try {
      switch (btn.name) {
        case 'generate':
          setTerminal('Generando sitio<hr/>');
          await generate(true);
          break;

        case 'viewLocal':
          setTerminal('Generando sitio<hr/>');
          await server();
          break;

        case 'upload':
          setTerminal('Generando sitio<hr/>');
          await generate();
          appendTerminal('Subiendo el sitio<hr/>');
          await upload();
          break;
      }
    } catch (err) {
      killActiveProcess();
      clearTerminal();
    }

    clearTerminal();
    setActiveProcess(false); // just to make it double sure.
  },
  'button'
);
