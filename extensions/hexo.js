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

const escRx = /\x1b\[\d+m/gm;

function replaceStr(string, ...placeholders) {
  if (typeof string === 'object') {
    return `${replaceStr(...placeholders)}\n${JSON.stringify(string, null, 2)}`;
  } else {
    const replaced = string.replaceAll(/%[sd]/g, () =>
      placeholders.shift().toString()
    );
    return [replaced, ...placeholders].join('\n').replaceAll(escRx, '');
  }
}

const setFakeConsole = (hexo) => {
  console.log('setting fake console');
  ['trace', 'info', 'warn', 'error', 'fatal' /*,'log'*/].forEach((type) => {
    hexo.log[type] = (...args) => send(replaceStr(...args), type.toUpperCase());
  });
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
  generate: async (hexo) => {
    await hexo.call('generate', {});
    return 'generate done';
  },
  viewLocal: async (hexo) => {
    if (server) {
      await open(serverURL);
      return 'Server is already running';
    } else {
      server = await hexo.call('server', { open: true });
      const { address, port } = server.address();
      const { root } = hexo.config;
      serverURL = new URL(
        `http://${
          address === '0.0.0.0' || address === '::' ? 'localhost' : address
        }:${port}${root.startsWith('/') ? root : `/${root}`}`
      ).toString();
      return 'server done';
    }
  },

  upload: async (hexo) => {
    await hexo.call('deploy', { generate: true });
    return 'deployment done';
  },
};

client.onmessage = async (e) => {
  const { event } = JSON.parse(e.data);
  const command = commands[event];
  if (command) {
    const hexo = new Hexo(join(process.cwd(), 'hexo'), {});
    try {
      await hexo.init();
      setFakeConsole(hexo);
      const msg = await command(hexo);
      send(msg, 'DONE');
      hexo.exit();
    } catch (err) {
      send(JSON.stringify(err, null, 2), 'FATAL');
      hexo.exit(err);
    }
  }
};
