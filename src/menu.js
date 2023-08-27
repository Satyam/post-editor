import { parse, stringify } from 'yaml';
import { onClick } from './utils';
// For some reason it works when imported via <script> but dies if imported
// and rolled up.
// import Sortable from 'sortablejs';

import { MENU_CONFIG, getPages } from './data';

const fs = Neutralino.filesystem;

let pages = [];
const currentMenu = document.getElementById('currentMenu');
const morePages = document.getElementById('morePages');
const menuEditor = document.getElementById('menuEditor');
const btnSave = document.getElementById('saveMenu');

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
        return `<li title="${value}">
          <span class="icon-left updown"></span>
          <span class="icon-left document"></span>
          <span contentEditable >${label}</span>
        </li>`;
      } else {
        return `<li>
          <span class="icon-left updown"></span>
          <span class="icon-left folder"></span>
          <span contentEditable>${label}</span>
            <ul class="draggable">${renderMenuObj(menu[label])}</ul>
          </li>`;
      }
    })
    .join('\n');

export const editMenu = async () => {
  pages = Array.from(getPages());

  const { menu } = parse(await fs.readFile(MENU_CONFIG));

  currentMenu.innerHTML = renderMenuObj(menu);
  morePages.innerHTML = pages
    .filter((p) => !p.used)
    .map(
      (p) => `<li title="${p.file}">
      <span class="icon-left updown"></span>
      <span class="icon-left document"></span>
      ${p.title}
    </li>`
    )
    .join('\n');

  const options = {
    group: 'nested',
    filter: '.empty',
    animation: 150,
    fallbackOnBody: true,
    swapThreshold: 0.65,
    onEnd: (ev) => {
      const { from, item, to } = ev;
      console.log({ from, item, to });
      if (from.getAttribute('id') === 'nuevaCarpeta') {
        from.innerHTML = `<li>
          <span class="icon-left updown"></span>
          <span class="icon-left new-folder"></span>
          Nueva carpeta
        </li>`;
        item.innerHTML = `<span class="icon-left updown"></span>
          <span class="icon-left folder"></span>
          <span contentEditable>--- editar ---</span>
          <ul class="draggable">
            <li class="empty">--vacía--</li>
          </ul>`;
        new Sortable(item.querySelector('.draggable'), options);
      }
      if (from.children.length === 0) {
        from.innerHTML = `<li class="empty">--vacía--</li>`;
      }
      for (const empty of currentMenu.querySelectorAll('li.empty')) {
        if (empty.closest('ul').children.length > 1) {
          empty.remove();
        }
      }
      for (const empty of morePages.querySelectorAll('li.empty')) {
        const ul = empty.closest('ul');
        if (ul.children.length === 1) {
          ul.closest('li').remove();
        }
      }
    },
  };

  for (const el of menuEditor.querySelectorAll('.draggable')) {
    new Sortable(el, options);
  }
};

onClick('#saveMenu', async () => {
  const parseUl = (ulEl) => {
    const subMenu = {};
    for (const liEl of ulEl.children) {
      const label = liEl
        .querySelector('span[contentEditable]')
        .innerText.trim();
      const subUl = liEl.querySelector('ul');
      if (subUl) {
        subMenu[label] = parseUl(subUl);
      } else {
        subMenu[label] = liEl.getAttribute('title');
      }
    }
    return subMenu;
  };
  await fs.writeFile(MENU_CONFIG, stringify({ menu: parseUl(currentMenu) }));
});
