export const readJson = (fileName) =>
  Neutralino.filesystem.readFile(fileName).then((c) => JSON.parse(c));

const stripStartSlashRx = /^\/?(.*)/;
const stripEndSlashRx = /(.*?)\/?$/;

export const join = (first, ...paths) =>
  paths.reduce(
    (joined, p) => joined.concat(p.replace(stripStartSlashRx, '/$1')),
    first.replace(stripEndSlashRx, '$1')
  );
