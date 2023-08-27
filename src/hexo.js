import { HEXO_DIR } from './data';

const terminal = document.getElementById('terminal');

const appendFileList = (contents) => {
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
            appendFileList(ev.detail.data);
            break;
          case 'stdErr':
            appendFileList(ev.detail.data);
            reject();
            break;
          case 'exit':
            appendFileList(
              `<hr/>La generación terminó con ${
                ev.detail.data ? `error ${ev.detail.data}` : `éxito`
              }`
            );
            if (wait) {
              appendFileList('<hr/>Haga click [aquí] para cerrar');
              onclick(
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

export const server = async () => {
  const process = await Neutralino.os.spawnProcess(
    `cd ${HEXO_DIR} && ./node_modules/.bin/hexo server`
  );
  await new Promise((resolve, reject) => {
    const handler = (ev) => {
      if (process.id == ev.detail.id) {
        switch (ev.detail.action) {
          case 'stdOut':
            const m = hexoURL.exec(ev.detail.data);
            if (m) {
              appendFileList(`<hr/>Haga click en esta ventana para cerrar el servidor<br/>
            La solapa del navegador debe cerrarla independientemente`);
              Neutralino.os.open(m[1]);
              onclick(
                terminal,
                async () => {
                  await Neutralino.os.updateSpawnedProcess(process.id, 'exit');
                },
                true
              );
            } else {
              appendFileList(ev.detail.data);
            }
            break;
          case 'stdErr':
            appendFileList(ev.detail.data);
            reject();
            break;
          case 'exit':
            Neutralino.events.off('spawnedProcess', handler);
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
                appendFileList('<pre></pre>');
                inside = true;
              } else {
                appendFileList(text);
              }
            }
            break;
          case 'stdErr':
            appendFileList(ev.detail.data);
            reject();
            break;
          case 'exit':
            inside = false;
            appendFileList(
              `<hr/>La generación terminó con ${
                ev.detail.data ? `error ${ev.detail.data}` : `éxito`
              }<hr/>Haga click [aquí] para cerrar`
            );
            onclick(
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
