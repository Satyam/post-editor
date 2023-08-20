import { parse, stringify } from 'yaml';
// For some reason it works when imported via <script> but dies if imported
// and rolled up.
// import Sortable from 'sortablejs';

import { MENU_CONFIG, getPages } from './data';

const fs = Neutralino.filesystem;

let pages = [];
const currentMenu = document.getElementById('currentMenu');
const morePages = document.getElementById('morePages');
const menuEditor = document.getElementById('menuEditor');

const basePartRx = /\/?([^\.]+).*/;

const renderMenuObj = (menu) =>
  Object.keys(menu)
    .map((label) => {
      const value = menu[label];
      if (typeof value === 'string') {
        pages.some((p) => {
          if (
            p.file.replace(basePartRx, '$1') === value.replace(basePartRx, '$1')
          ) {
            p.used = true;
            return true;
          }
        });
        return `<li title="${value}"><span class="icon-left updown"></span><span contentEditable >${label}</span></li>`;
      } else {
        return `<li><span class="icon-left updown"></span><span contentEditable>${label}</span><ul class="draggable">${renderMenuObj(
          menu[label]
        )}</ul></li>`;
      }
    })
    .join('\n');

export const editMenu = async () => {
  pages = Array.from(getPages());

  const { menu } = parse(await fs.readFile(MENU_CONFIG));

  currentMenu.innerHTML = renderMenuObj(menu);
  morePages.innerHTML = pages
    .filter((p) => !p.used)
    .map((p) => `<li title="${p.file}">${p.title}</li>`)
    .join('\n');

  var options = {
    group: 'nested',
    animation: 150,
    fallbackOnBody: true,
    swapThreshold: 0.65,
  };

  [
    // 'onChoose',
    // 'onStart',
    'onEnd',
    // 'onAdd',
    // 'onUpdate',
    // 'onSort',
    // 'onRemove',
    // 'onChange',
    // 'onUnchoose',
  ].forEach(function (name) {
    options[name] = (ev) => {
      const {
        item,
        to,
        from,
        oldIndex,
        newIndex,
        oldDraggableIndex,
        newDraggableIndex,
        clone,
        pullMode,
      } = ev;
      console.log(name, {
        item,
        to,
        from,
        oldIndex,
        newIndex,
        oldDraggableIndex,
        newDraggableIndex,
        clone,
        pullMode,
      });
    };
  });

  for (const el of menuEditor.querySelectorAll('.draggable')) {
    new Sortable(el, options);
  }
};
