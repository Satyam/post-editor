const Hexo = require('hexo');
const { join } = require('node:path');
const open = require('open');
const http = require('node:http');

const serverURL = 'http://localhost:4000/';

const commands = {
  generate: (hexo) => hexo.call('generate', {}),

  viewLocal: async (hexo) => {
    if (
      await new Promise((resolve) => {
        http
          .get(serverURL, () => {
            resolve(true);
          })
          .on('error', () => {
            resolve(false);
          });
      })
    ) {
      console.log('INFO Server is already running');
      return await open(serverURL);
    } else {
      return await hexo.call('server', { open: true });
    }
  },

  upload: (hexo) => hexo.call('deploy', { generate: true }),
};

debugger;
const run = async () => {
  const command = commands[process.argv[2]];
  if (command) {
    const hexo = new Hexo(join(process.cwd(), 'hexo'), {});
    try {
      await hexo.init();
      await command(hexo);
      hexo.exit();
      console.log('--DONE--');
    } catch (err) {
      console.error(JSON.stringify(err, null, 2), 'FATAL');
      hexo.exit(err);
    }
  } else {
    console.error('Unrecognized command', process.argv[2]);
  }
};

run();
