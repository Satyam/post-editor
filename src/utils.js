export const readJson = (fileName) =>
  Neutralino.filesystem
    .readFile(fileName)
    .catch((err) => {
      console.log('Not found:', fileName);
      return '{}';
    })
    .then((c) => JSON.parse(c));

// const stripStartSlashRx = /^\/?(.*)/;
// const stripEndSlashRx = /(.*?)\/?$/;

// export const join1 = (first, ...paths) =>
//   paths.reduce(
//     (joined, p) => joined.concat(p.replace(stripStartSlashRx, '/$1')),
//     first.replace(stripEndSlashRx, '$1')
//   );

export const join = (...args) => args.join('/').replaceAll('//', '/');

export const objMap = (obj, fn, sortFn) =>
  Object.keys(obj, fn)
    .sort(sortFn)
    .map((key, index) => fn(key, obj[key], index));

export const objMapString = (obj, fn, sortFn, sep = '\n') =>
  objMap(obj, fn, sortFn).join(sep);

export const isObjEmpty = (obj) => !obj || Object.keys(obj).length === 0;

export const sortDescending = (a, b) => b - a;
