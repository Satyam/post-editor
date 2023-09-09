const WS = require('websocket').w3cwebsocket;
const { v4: uuidv4 } = require('uuid');
const argv = require('minimist')(process.argv.slice(2));
const Hexo = require('hexo');
const { join } = require('node:path');
const open = require('open');

const NL_PORT = argv['nl-port'];
const NL_TOKEN = argv['nl-token'];
const NL_EXTID = argv['nl-extension-id'];
const client = new WS(`ws://localhost:${NL_PORT}?extensionId=${NL_EXTID}`);

const send = (msg, event = 'LOG') => {
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

function replaceStr(string, ...placeholders) {
  const replaced = string.replaceAll(/%[sd]/g, () =>
    placeholders.shift().toString()
  );
  return [replaced, ...placeholders].join(' ').replaceAll(escRx, '');
}

const setFakeConsole = (hexo) => {
  console.log('setting fake console');
  // hexo.log.debug = (...args) => send(replaceStr(...args), 'LOG');
  hexo.log.trace = (...args) => send(replaceStr(...args), 'TRACE');
  hexo.log.info = (...args) => send(replaceStr(...args), 'INFO');
  hexo.log.warn = (...args) => send(replaceStr(...args), 'WARN');
  hexo.log.error = (...args) => send(replaceStr(...args), 'ERROR');
  hexo.log.fatal = (...args) => send(replaceStr(...args), 'FATAL');
};
const unsetFakeConsole = (hexo, originalLogger) => {
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

let server = false;
let serverURL = null;

client.onclose = () => {
  console.log('exiting...');
  if (server) {
    server.close();
  }
  process.exit();
};

const commands = {
  generate: (hexo) =>
    hexo.call('generate', {}).then(() => {
      send('generate done', 'DONE');
    }),
  viewLocal: (hexo) => {
    if (server) {
      return open(serverURL).then(() => 'Server is already running');
    } else {
      return hexo.call('server', { open: true }).then((s) => {
        server = s;
        const { address, port } = s.address();
        const { root } = hexo.config;
        serverURL = new URL(
          `http://${
            address === '0.0.0.0' || address === '::' ? 'localhost' : address
          }:${port}${root.startsWith('/') ? root : `/${root}`}`
        ).toString();
        return 'server done';
      });
    }
  },
  upload: (hexo) =>
    hexo.call('deploy', { generate: true }).then(() => {
      return 'deployment done';
    }),
};

client.onmessage = (e) => {
  const { event } = JSON.parse(e.data);
  const command = commands[event];
  if (command) {
    const hexo = new Hexo(join(process.cwd(), 'hexo'), {});
    const originalLogger = hexo.log;
    hexo
      .init()
      .then(() => {
        setFakeConsole(hexo);
        return command(hexo);
      })
      .then((msg) => {
        unsetFakeConsole(hexo, originalLogger);
        send(msg, 'DONE');
        hexo.exit();
      })
      .catch((err) => {
        unsetFakeConsole(hexo, originalLogger);
        send(JSON.stringify(err, null, 2), 'FATAL');
        hexo.exit(err);
      });
  }
};
