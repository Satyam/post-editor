import editor from './editor';
import { objMapString, sortDescending, slugify, today } from './utils';
import { form, setDataLists, setForm } from './form';
import {
  btnNewPage,
  btnEditPage,
  btnNewPost,
  btnEditPost,
  btnDraftPage,
  btnDraftPost,
  btnExit,
  main,
  divFileList,
} from './elements';

import { readMd, removeMd, saveMD } from './files';

import {
  loadInfo,
  getPages,
  getPosts,
  getDrafts,
  isDraft,
  isPost,
  setMdType,
  setFileName,
  fileName,
  addDraftInfo,
  removeDraftInfo,
  updateProps,
} from './data';
import { imagesToEditor, replaceImages } from './images';

import { on } from './events';

const CNAMES = {
  PAGE_LIST: 'page-list',
  POST_LIST: 'post-list',
  DRAFT_POST_LIST: 'draft-post-list',
  DRAFT_PAGE_LIST: 'draft-page-list',
  SELECT: 'select',
  EDIT: 'edit',
};

Neutralino.init();

Neutralino.events.on('windowClose', () => {
  Neutralino.app.exit();
});

const fs = Neutralino.filesystem;

const setDraftButtons = () => {
  btnDraftPage.disabled = !getDrafts(false).length;
  btnDraftPost.disabled = !getDrafts(true).length;
};

const clearSelect = () => {
  divFileList.className = '';
  main.className = CNAMES.SELECT;
  setDraftButtons();
};

const setFileList = (className, contents) => {
  divFileList.className = className;
  divFileList.innerHTML = contents;
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

    on('save', (data) => {
      console.log('save', data);
      clearSelect();
    });

    on('draft', async (matter) => {
      matter.updated = today;
      setMdType(isPost, true);
      if (isPost) {
        matter.layout = 'post';
        if (await updateProps(matter)) {
          setDataLists();
        }
        if (!fileName)
          setFileName(`${matter.date}-${slugify(matter.title)}.md`);
      } else {
        matter.layout = 'page';
        if (!fileName) setFileName(`${slugify(matter.title)}.md`);
      }
      await replaceImages();
      await saveMD(matter, editor.getContents());
      await addDraftInfo({ title: matter.title, date: today });
    });

    on('remove', async () => {
      console.log('Borrar', fileName, isDraft, isPost);
      await removeMd();
      await removeDraftInfo();
      clearSelect();
    });

    btnNewPage.addEventListener('click', (ev) => {
      main.className = CNAMES.EDIT;
      editor.setContents('');
      setMdType(false, true);
      setFileName();
      setForm();
    });

    btnNewPost.addEventListener('click', (ev) => {
      main.className = CNAMES.EDIT;
      editor.setContents('');
      setMdType(true, true);
      setFileName();
      setForm();
    });

    form.addEventListener('reset', (ev) => {
      clearSelect();
    });

    btnEditPage.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      setFileList(
        CNAMES.PAGE_LIST,
        `<ul>${getPages()
          .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
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
          .map((p) => `<li>${p.date} - <a href="${p.file}">${p.title}</a></li>`)
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
          .map((p) => `<li>${p.date} - <a href="${p.file}">${p.title}</a></li>`)
          .join('')}</ul>`
      );
      setMdType(true, true);
    });

    btnEditPost.addEventListener('click', async (ev) => {
      ev.stopPropagation();

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
                    .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
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
      ev.stopPropagation();
      if (ev.target.tagName !== 'A') return;
      ev.preventDefault();

      setFileName(ev.target.getAttribute('href'));

      const { matter, content } = await readMd();

      setForm(matter);
      editor.setContents(content);
      main.className = CNAMES.EDIT;
    });

    // editor.onChange = function (contents, core) {
    //   console.log('onChange', contents);
    // };
  })
  .catch((err) => {
    console.log(err);
    window.close();
    Neutralino.app.exit(1);
  });
