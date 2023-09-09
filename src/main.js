import { onClick } from './utils';

import { loadInfo } from './data';

import { imagesToEditor } from './images';

import { EVENT, dispatch } from './events';
import { editMenu } from './menu';
import './hexo';
import { selectInit, clearSelect } from './select';

const CNAMES = {
  MENU: 'menu',
  SITE: 'site',
};

const main = document.getElementById('main');

Neutralino.init();

Neutralino.events.on('windowClose', () => {
  Neutralino.app.exit();
});

loadInfo()
  .then(async () => {
    await imagesToEditor();

    let tabSelected = document.querySelector('header button[name="select"]');
    tabSelected.setAttribute('disabled', '');
    selectInit();

    onClick(
      'header',
      async (btn) => {
        if (btn === tabSelected) return;

        if (await dispatch(EVENT.PAGE_SWITCH, btn.name)) return;
        tabSelected.removeAttribute('disabled');
        tabSelected = btn;
        btn.setAttribute('disabled', '');
        switch (btn.name) {
          case 'select':
            clearSelect();
            // main.className = CNAMES.SELECT;
            break;
          case 'menuEditor':
            main.className = CNAMES.MENU;
            editMenu();
            break;
          case 'site':
            main.className = CNAMES.SITE;
            break;
          case 'exit':
            dispatch(EVENT.EXIT).then((ev) => {
              if (!ev) {
                window.close();
                Neutralino.app.exit();
              }
            });
            break;
        }
      },
      'button'
    );
  })
  .catch((err) => {
    console.log(err);
    window.close();
    Neutralino.app.exit(1);
  });
