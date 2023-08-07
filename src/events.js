const ev = {};

export const on = (name, fn) => {
  if (!(name in ev)) ev[name] = [];
  return ev[name].push(fn);
};

export const off = (name, fn) => {
  if (name in ev) {
    const i = ev[name].indexOf(fn);
    if (i > -1) {
      ev[name].splice(i, 1);
    }
  }
};

export const dispatch = async (name, data) => {
  if (name in ev) {
    for (const fn of ev[name]) await fn(data);
  }
};

export const EVENT = {
  SAVE: 'save',
  TYPE_CHANGE: 'typeChange',
  REMOVE: 'remove',
  PUBLISH: 'publish',
  DISCARD: 'discard',
  RESET: 'reset',
  EDITOR_CHANGED: 'editorChanged',
};
