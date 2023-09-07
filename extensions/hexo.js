const WS = require('websocket').w3cwebsocket;
const { v4: uuidv4 } = require('uuid');
const argv = require('minimist')(process.argv.slice(2));
const Hexo = require('hexo');
const { join } = require('node:path');

const NL_PORT = argv['nl-port'];
const NL_TOKEN = argv['nl-token'];
const NL_EXTID = argv['nl-extension-id'];
const client = new WS(`ws://localhost:${NL_PORT}?extensionId=${NL_EXTID}`);

const send = (msg, event = 'hexo') => {
  client.send(
    JSON.stringify({
      id: uuidv4(),
      method: 'app.broadcast',
      accessToken: NL_TOKEN,
      data: { event, data: msg },
    })
  );
};

const escRx = /\x1b\[\d+m/g;

const hexo = new Hexo(join(process.cwd(), 'hexo'), {});

const originalLogger = hexo.log;

function replaceStr(string, ...placeholders) {
  const replaced = string.replaceAll(/%[sd]/g, () =>
    placeholders.shift().toString()
  );
  return [replaced, ...placeholders].join(' ').replaceAll(escRx, '');
}

const setFakeConsole = () => {
  console.log('setting fake console');
  // hexo.log.debug = (...args) => send(replaceStr(...args), 'LOG');
  hexo.log.trace = (...args) => send(replaceStr(...args), 'TRACE');
  hexo.log.info = (...args) => send(replaceStr(...args), 'INFO');
  hexo.log.warn = (...args) => send(replaceStr(...args), 'WARN');
  hexo.log.error = (...args) => send(replaceStr(...args), 'ERROR');
  hexo.log.fatal = (...args) => send(replaceStr(...args), 'FATAL');
};
const unsetFakeConsole = () => {
  console.log('restoring');
  // hexo.log.debug = originalLogger.debug;
  hexo.log.trace = originalLogger.trace;
  hexo.log.info = originalLogger.info;
  hexo.log.warn = originalLogger.warn;
  hexo.log.error = originalLogger.error;
  hexo.log.fatal = originalLogger.fatal;
};

client.onerror = (err) =>
  console.og(`Connection error! ${JSON.stringify(err, null, 2)}`);

client.onopen = () => console.log('Connected');

client.onclose = () => process.exit();

let server = false;
hexo.init().then(() => {
  client.onmessage = (e) => {
    const { event, data } = JSON.parse(e.data);
    // console.log('message', event, data);

    switch (event) {
      case 'generate':
        setFakeConsole();
        hexo.call('generate', {}).then((s) => {
          unsetFakeConsole();
          send('generate done');
        });
        break;
      case 'server':
        if (server) {
          send('Server is already running');
        } else {
          setFakeConsole();
          console.log('about to start server');
          hexo.call('server', { open: true }).then((s) => {
            server = s;
            send(`server active: ${JSON.stringify(s.address())}`);
            unsetFakeConsole();
          });
        }
        break;
      case 'stopServer':
        if (server) {
          setFakeConsole();
          console.log('closing server');
          server.close();
          hexo.unwatch();
          server = false;
          send('server closed');
          unsetFakeConsole();
        }
        break;
    }
  };
});
