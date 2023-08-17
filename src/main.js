import { objMapString, sortDescending, slugify, today } from './utils';
import { setDataLists, setForm, acceptChanges } from './form';
import {
  btnNewPage,
  btnEditPage,
  btnNewPost,
  btnEditPost,
  btnDraftPage,
  btnDraftPost,
  btnGenerate,
  btnViewLocal,
  btnMenu,
  btnBackMenu,
  btnExit,
  main,
  divFileList,
} from './elements';

import { readMd, removeMd, saveMD } from './files';

import {
  HEXO_DIR,
  loadInfo,
  getPages,
  getPosts,
  getDrafts,
  addPostInfo,
  addDraftInfo,
  removeDraftInfo,
  removePostInfo,
  updateProps,
  uniqueFileName,
} from './data';

import {
  fileName,
  isDraft,
  isPost,
  isNew,
  isChanged,
  setFileName,
  setMdType,
} from './state';
import { imagesToEditor, replaceImages } from './images';

import { EVENT, on } from './events';
import { editMenu } from './menu';
const CNAMES = {
  PAGE_LIST: 'page-list',
  POST_LIST: 'post-list',
  DRAFT_POST_LIST: 'draft-post-list',
  DRAFT_PAGE_LIST: 'draft-page-list',
  SELECT: 'select',
  EDIT: 'edit',
  MENU: 'menu',
  CONSOLE: 'console',
};

Neutralino.init();

Neutralino.events.on('windowClose', () => {
  Neutralino.app.exit();
});

const setDraftButtons = () => {
  btnDraftPage.disabled = !getDrafts(false).length;
  btnDraftPost.disabled = !getDrafts(true).length;
};

const clearSelect = () => {
  divFileList.innerHTML = '';
  divFileList.className = '';
  main.className = CNAMES.SELECT;
  setDraftButtons();
};

const setFileList = (className, contents) => {
  divFileList.className = className;
  divFileList.innerHTML = contents;
};

const appendFileList = (contents) => {
  divFileList.innerHTML = `${divFileList.innerHTML}<br/>${contents}`;
};

loadInfo()
  .then(async () => {
    await imagesToEditor();
    clearSelect();

    setDataLists();

    btnExit.addEventListener('click', (ev) => {
      window.close();
      Neutralino.app.exit();
    });

    on(EVENT.SAVE, async ({ matter, contents }) => {
      matter.updated = today;
      setMdType(isPost, true, isNew);
      if (isPost) {
        matter.layout = 'post';
        if (await updateProps(matter)) {
          setDataLists();
        }
        if (!fileName)
          setFileName(
            uniqueFileName(`${matter.date}-${slugify(matter.title)}`)
          );
      } else {
        matter.layout = 'page';
        if (!fileName) setFileName(uniqueFileName(slugify(matter.title)));
      }
      await replaceImages();
      await saveMD(matter, contents);
      await addDraftInfo({ title: matter.title, date: today });
      acceptChanges();
    });

    on(EVENT.REMOVE, async () => {
      await removeMd(true);
      await removePostInfo();
      await removeDraftInfo();
      clearSelect();
    });

    on(EVENT.PUBLISH, async ({ matter, contents }) => {
      setMdType(isPost, false, isNew);
      await saveMD(matter, contents);
      if (isNew) {
        await addPostInfo({
          file: fileName,
          title: matter.title,
          date: matter.date,
        });
      }
      await removeDraftInfo();
      await removeMd();
      clearSelect();
    });

    on(EVENT.DISCARD, async () => {
      await removeMd(false);
      await removeDraftInfo();
      clearSelect();
      acceptChanges();
    });

    on(EVENT.RESET, () => {
      clearSelect();
      acceptChanges();
    });

    btnNewPage.addEventListener('click', (ev) => {
      main.className = CNAMES.EDIT;
      setMdType(false, true, true);
      setFileName();
      setForm();
    });

    btnNewPost.addEventListener('click', (ev) => {
      main.className = CNAMES.EDIT;
      setMdType(true, true, true);
      setFileName();
      setForm();
    });

    btnEditPage.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const drafts = getDrafts();
      setFileList(
        CNAMES.PAGE_LIST,
        `<ul>${getPages()
          .map((p) =>
            drafts.some((d) => d.file === p.file)
              ? `<li class="can-t-edit" title="Está en Borradores">${p.title}</li>`
              : `<li><a href="${p.file}">${p.title}</a></li>`
          )
          .join('')}</ul>`
      );
      setMdType(false);
    });

    btnDraftPage.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      setFileList(
        CNAMES.DRAFT_PAGE_LIST,
        `<ul>${getDrafts()
          .sort(sortDescending)
          .map(
            (p) =>
              `<li>${p.date} - <a href="${p.file}"
              ${p.isNew ? 'data-is-new' : ''}
              >${p.title}</a></li>`
          )
          .join('')}</ul>`
      );
      setMdType(false, true);
    });

    btnDraftPost.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      setFileList(
        CNAMES.DRAFT_POST_LIST,
        `<ul>${getDrafts(true)
          .sort(sortDescending)
          .map(
            (p) =>
              `<li>${p.date} - <a href="${p.file}" 
              ${p.isNew ? 'data-is-new' : ''}
              >${p.title}</a></li>`
          )
          .join('')}</ul>`
      );
      setMdType(true, true);
    });

    btnEditPost.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      const drafts = getDrafts(true);

      const tree = {};
      getPosts().forEach((p) => {
        const [y, m, d] = p.date.split('-');
        if (!(y in tree)) tree[y] = {};
        if (!(m in tree[y])) tree[y][m] = {};
        if (!(d in tree[y][m])) tree[y][m][d] = [];
        tree[y][m][d].push(p);
      });
      setFileList(
        CNAMES.POST_LIST,
        objMapString(
          tree,
          (y) =>
            `<details><summary>${y}</summary>${objMapString(
              tree[y],
              (m) =>
                `<details><summary>${m}</summary>${objMapString(
                  tree[y][m],
                  (d) =>
                    `<details><summary>${d}</summary><p>${d}/${m}/${y}</p><ul>
                  ${tree[y][m][d]
                    .map((p) =>
                      drafts.some((d) => d.file === p.file)
                        ? `<li class="can-t-edit" title="Está en Borradores">${p.title}</li>`
                        : `<li><a href="${p.file}">${p.title}</a></li>`
                    )
                    .join('\n')}</ul></details>`,
                  sortDescending
                )}</details>`,
              sortDescending
            )}</details>`,
          sortDescending
        )
      );
      setMdType(true);
    });

    divFileList.addEventListener('click', async (ev) => {
      const aEl = ev.target;
      ev.stopPropagation();
      if (aEl.tagName !== 'A') return;
      ev.preventDefault();

      setFileName(aEl.getAttribute('href'));
      if ('isNew' in aEl.dataset) {
        setMdType(isPost, isDraft, true);
      }

      const { matter, content } = await readMd();

      setForm(matter, content);
      main.className = CNAMES.EDIT;
    });

    btnGenerate.addEventListener('click', async (ev) => {
      ev.stopPropagation();

      setFileList(CNAMES.CONSOLE, 'Generando sitio<hr/>');

      const generation = await Neutralino.os.spawnProcess(
        `cd ${HEXO_DIR} && ./node_modules/.bin/hexo generate`
      );

      Neutralino.events.on('spawnedProcess', (ev) => {
        if (generation.id == ev.detail.id) {
          switch (ev.detail.action) {
            case 'stdOut':
              appendFileList(ev.detail.data);
              break;
            case 'stdErr':
              appendFileList(ev.detail.data);
              break;
            case 'exit':
              appendFileList(
                `<hr/>La generación terminó con ${
                  ev.detail.data ? `error ${ev.detail.data}` : `éxito`
                }<hr/>Haga click [aquí] para cerrar`
              );
              divFileList.addEventListener(
                'click',
                () => {
                  clearSelect();
                },
                { once: true }
              );
              break;
          }
        }
      });
    });

    const hexoURL = /(http:\/\/localhost:\d+\/\S*)/;
    btnViewLocal.addEventListener('click', async (ev) => {
      ev.stopPropagation();

      setFileList(CNAMES.CONSOLE, 'Generando sitio<hr/>');

      const generation = await Neutralino.os.spawnProcess(
        `cd ${HEXO_DIR} && ./node_modules/.bin/hexo server`
      );

      Neutralino.events.on('spawnedProcess', (ev) => {
        if (generation.id == ev.detail.id) {
          switch (ev.detail.action) {
            case 'stdOut':
              const m = hexoURL.exec(ev.detail.data);
              if (m) {
                appendFileList(`<hr/>Haga click en esta ventana para cerrar el servidor<br/>
                La solapa del navegador debe cerrarla independientemente`);
                Neutralino.os.open(m[1]);
                divFileList.addEventListener(
                  'click',
                  async () => {
                    await Neutralino.os.updateSpawnedProcess(
                      generation.id,
                      'exit'
                    );
                  },
                  { once: true }
                );
              } else {
                appendFileList(ev.detail.data);
              }
              break;
            case 'stdErr':
              appendFileList(ev.detail.data);
              break;
            case 'exit':
              clearSelect();
              break;
          }
        }
      });
    });
    btnMenu.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      main.className = CNAMES.MENU;
      editMenu();
    });
    btnBackMenu.addEventListener('click', (ev) => {
      ev.stopPropagation();
      main.className = CNAMES.SELECT;
    });
  })
  .catch((err) => {
    console.log(err);
    window.close();
    Neutralino.app.exit(1);
  });
