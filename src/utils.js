const fs = Neutralino.filesystem;

export const readJson = (fileName, defaultValue) =>
  fs.readFile(fileName).then(
    (c) => JSON.parse(c),
    (err) => defaultValue ?? {}
  );

export const today = new Date().toISOString().split('T')[0];
export const writeJson = (filename, obj) =>
  fs.writeFile(filename, JSON.stringify(obj, null, 2));
// const stripStartSlashRx = /^\/?(.*)/;
// const stripEndSlashRx = /(.*?)\/?$/;

// export const join1 = (first, ...paths) =>
//   paths.reduce(
//     (joined, p) => joined.concat(p.replace(stripStartSlashRx, '/$1')),
//     first.replace(stripEndSlashRx, '$1')
//   );
const manySlashesRx = /\/{2,}/g;
export const join = (...args) => args.join('/').replaceAll(manySlashesRx, '/');

export const objMap = (obj, fn, sortFn) =>
  Object.keys(obj, fn)
    .sort(sortFn)
    .map((key, index) => fn(key, obj[key], index));

export const objMapString = (obj, fn, sortFn, sep = '\n') =>
  objMap(obj, fn, sortFn).join(sep);

export const isObjEmpty = (obj) => !obj || Object.keys(obj).length === 0;

export const sortDescending = (a, b) => b - a;

const invalidCharsRx = /[^a-z0-9 -]/g;
const multipleSpacesRx = /\s+/g;
const multipleDashesRx = /-+/g;
// remove accents, swap ñ for n, etc
const from = 'àáäâèéëêìíïîòóöôùúüûñç·/_,:;';
const to = 'aaaaeeeeiiiioooouuuunc------';

export const slugify = (str) => {
  if (!str) return str;
  let s = str.trim().toLowerCase();

  for (let i = 0, l = from.length; i < l; i++) {
    s = s.replaceAll(from.charAt(i), to.charAt(i));
  }

  return s
    .replaceAll(invalidCharsRx, '') // remove invalid chars
    .replaceAll(multipleSpacesRx, '-') // collapse whitespace and replace by -
    .replaceAll(multipleDashesRx, '-'); // collapse dashes
};

export const onClick = (selector, fn, once) => {
  const el =
    typeof selector === 'string' ? document.querySelector(selector) : selector;
  el.addEventListener(
    'click',
    (ev) => {
      ev.stopPropagation();
      ev.preventDefault();
      fn(ev.target);
    },
    once && { once: true }
  );
};
