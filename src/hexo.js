import { HEXO_DIR } from './data';
import { EVENT, on } from './events';
import { onClick } from './utils';
import { confirm } from './dialog';

const terminal = document.getElementById('terminal');

const clearTerminal = () => {
  terminal.innerHTML = '';
};

const setTerminal = (contents) => {
  terminal.innerHTML = contents.replaceAll('\n', '<br/>');
};

const appendTerminal = (contents) => {
  terminal.innerHTML = `${terminal.innerHTML}${contents.replaceAll(
    '\n',
    '<br/>'
  )}`;
  terminal.lastElementChild.scrollIntoView({
    behavior: 'smooth',
    block: 'center',
    inline: 'nearest',
  });
};

export const generate = async (wait = false) => {
  const process = await Neutralino.os.spawnProcess(
    `cd ${HEXO_DIR} && ./node_modules/.bin/hexo generate`
  );

  await new Promise((resolve, reject) => {
    const handler = (ev) => {
      if (process.id == ev.detail.id) {
        switch (ev.detail.action) {
          case 'stdOut':
            appendTerminal(ev.detail.data);
            break;
          case 'stdErr':
            appendTerminal(ev.detail.data);
            reject();
            break;
          case 'exit':
            appendTerminal(
              `<hr/>La generación terminó con ${
                ev.detail.data ? `error ${ev.detail.data}` : `éxito`
              }`
            );
            if (wait) {
              appendTerminal('<hr/>Haga click [aquí] para cerrar');
              onClick(
                terminal,
                () => {
                  Neutralino.events.off('spawnedProcess', handler);
                  resolve();
                },
                true
              );
            } else resolve();
            break;
        }
      }
    };
    Neutralino.events.on('spawnedProcess', handler);
  });
};

const hexoURL = /(http:\/\/localhost:\d+\/\S*)/;

let activeProcess = false;

on(EVENT.PAGE_SWITCH, async () => {
  if (activeProcess === false) return false;
  if (
    await confirm(
      'El servidor local está activo y no se puede cambiar de solapa mientras lo esté.<br/>¿Desea apagarlo?',
      '¿Quiere apagarlo?'
    )
  ) {
    await Neutralino.os.updateSpawnedProcess(activeProcess, 'exit');
    activeProcess = false;
    return false;
  } else {
    return true; // stop switch;
  }
});

export const server = async () => {
  const process = await Neutralino.os.spawnProcess(
    `cd ${HEXO_DIR} && ./node_modules/.bin/hexo server`
  );
  activeProcess = process.id;
  await new Promise((resolve, reject) => {
    const handler = (ev) => {
      if (process.id == ev.detail.id) {
        switch (ev.detail.action) {
          case 'stdOut':
            const m = hexoURL.exec(ev.detail.data);
            if (m) {
              appendTerminal(`<hr/>Haga click en esta ventana para cerrar el servidor<br/>
            La solapa del navegador debe cerrarla independientemente<br/>`);
              Neutralino.os.open(m[1]);
              onClick(
                terminal,
                async () => {
                  await Neutralino.os.updateSpawnedProcess(process.id, 'exit');
                  activeProcess = false;
                },
                true
              );
            } else {
              appendTerminal(ev.detail.data);
            }
            break;
          case 'stdErr':
            appendTerminal(ev.detail.data);
            reject();
            break;
          case 'exit':
            Neutralino.events.off('spawnedProcess', handler);
            activeProcess = false;
            resolve();
            break;
        }
      }
    };

    Neutralino.events.on('spawnedProcess', handler);
  });
};

export const upload = async () => {
  const process = await Neutralino.os.spawnProcess(
    `cd ${HEXO_DIR} && ./node_modules/.bin/hexo deploy  pwd="${await Neutralino.os.getEnv(
      'ROXY_SITE_PASSWORD'
    )}"`
  );
  let inside = false;
  await new Promise((resolve, reject) => {
    const handler = (ev) => {
      if (process.id == ev.detail.id) {
        switch (ev.detail.action) {
          case 'stdOut':
            const text = ev.detail.data;
            if (inside) {
              terminal.querySelector('pre').innerHTML = text;
            } else {
              if (text.includes('----')) {
                appendTerminal('<pre></pre>');
                inside = true;
              } else {
                appendTerminal(text);
              }
            }
            break;
          case 'stdErr':
            appendTerminal(ev.detail.data);
            reject();
            break;
          case 'exit':
            inside = false;
            appendTerminal(
              `<hr/>La generación terminó con ${
                ev.detail.data ? `error ${ev.detail.data}` : `éxito`
              }<hr/>Haga click [aquí] para cerrar`
            );
            onClick(
              terminal,
              () => {
                Neutralino.events.off('spawnedProcess', handler);
                resolve();
              },
              true
            );
            break;
        }
      }
    };
    Neutralino.events.on('spawnedProcess', handler);
  });
};

onClick('#generate', async () => {
  setTerminal('Generando sitio<hr/>');
  await generate(true);
  clearTerminal();
});

onClick('#viewLocal', async () => {
  setTerminal('Generando sitio<hr/>');
  await server();
  clearTerminal();
});

onClick('#upload', async () => {
  setTerminal('Generando sitio<hr/>');
  await generate();
  appendTerminal('Subiendo el sitio<hr/>');
  await upload();
  clearTerminal();
});
