import { sortDescending, slugify, today, onClick } from './utils';
import { setDataLists, setForm, acceptChanges } from './form';

import { readMd, removeMd, saveMD } from './files';

import {
  loadInfo,
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

import { EVENT, dispatch, on } from './events';
import { editMenu } from './menu';

import { generate, server, upload } from './hexo';

import { pagesList, postsList } from './lists';

const CNAMES = {
  PAGE_LIST: 'page-list',
  POST_LIST: 'post-list',
  DRAFT_POST_LIST: 'draft-post-list',
  DRAFT_PAGE_LIST: 'draft-page-list',
  SELECT: 'select',
  EDIT: 'edit',
  MENU: 'menu',
  SITE: 'site',
};

const btnDraftPage = document.getElementById('draftPage');
const btnDraftPost = document.getElementById('draftPost');
const divFileList = document.getElementById('fileList');
const main = document.getElementById('main');

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
    let tabSelected = document.querySelector('header button[disabled]');
    onClick('header', (btn) => {
      if (btn === tabSelected) return;
      tabSelected.removeAttribute('disabled');
      tabSelected = btn;
      btn.setAttribute('disabled', '');
      switch (btn.name) {
        case 'select':
          clearSelect();
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

    onClick('#newPage', () => {
      main.className = CNAMES.EDIT;
      setMdType(false, true, true);
      setFileName();
      setForm();
    });

    onClick('#newPost', () => {
      main.className = CNAMES.EDIT;
      setMdType(true, true, true);
      setFileName();
      setForm();
    });

    onClick('#editPage', () => {
      const drafts = getDrafts();
      setFileList(CNAMES.PAGE_LIST, pagesList());
      setMdType(false);
    });

    onClick(btnDraftPage, () => {
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

    onClick(btnDraftPost, () => {
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

    onClick('#editPost', () => {
      setFileList(CNAMES.POST_LIST, postsList());
      setMdType(true);
    });

    onClick(divFileList, async (aEl) => {
      if (aEl.tagName !== 'A') return;

      setFileName(aEl.getAttribute('href'));
      if ('isNew' in aEl.dataset) {
        setMdType(isPost, isDraft, true);
      }

      const { matter, content } = await readMd();

      setForm(matter, content);
      main.className = CNAMES.EDIT;
    });

    onClick('#generate', async () => {
      setFileList(CNAMES.CONSOLE, 'Generando sitio<hr/>');
      await generate(true);
      clearSelect();
    });

    onClick('#viewLocal', async () => {
      setFileList(CNAMES.CONSOLE, 'Generando sitio<hr/>');
      await server();
      clearSelect();
    });

    onClick('#upload', async () => {
      setFileList(CNAMES.CONSOLE, 'Generando sitio<hr/>');
      await generate();
      appendFileList('Subiendo el sitio<hr/>');
      await upload();
      clearSelect();
    });

    onClick('#menu', () => {
      main.className = CNAMES.MENU;
      editMenu();
    });

    onClick('#backMenu', () => {
      main.className = CNAMES.SELECT;
    });
  })
  .catch((err) => {
    console.log(err);
    window.close();
    Neutralino.app.exit(1);
  });
