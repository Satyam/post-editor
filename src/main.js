import { init, config, neutralinoConfig } from './init';
import { parse } from './frontmatter';
import editor from './editor';
import { readJson, join, objMapString, sortDescending } from './utils';
import { imagesToEditor } from './images';
import {
  sectionInitial,
  btnNewPage,
  btnEditPage,
  btnNewPost,
  btnEditPost,
  btnExit,
  sectionEditor,
  inputTitle,
  inputDate,
  inputCats,
  inputTags,
  inputAuthor,
  btnSave,
  btnReturn,
  divFileList,
  divPostExtra,
} from './elements';

const CNAMES = {
  NEW: 'is-new',
  EDIT: 'is-edit',
  POST: 'is-post',
  PAGE: 'is-page',
  PAGE_LIST: 'page-list',
  POST_LIST: 'post-list',
  HIDDEN: 'hidden',
};

init().then(async () => {
  const {
    json: { pages, posts },
  } = await readJson(config.filesList);

  await imagesToEditor();
  btnExit.addEventListener('click', (ev) => {
    Neutralino.app.exit();
  });

  btnNewPage.addEventListener('click', (ev) => {
    sectionInitial.className = CNAMES.HIDDEN;
    sectionEditor.classList.remove(CNAMES.EDIT, CNAMES.POST);
    sectionEditor.classList.add(CNAMES.NEW, CNAMES.PAGE);
  });

  btnNewPost.addEventListener('click', (ev) => {
    sectionInitial.className = CNAMES.HIDDEN;
    sectionEditor.classList.remove(CNAMES.EDIT, CNAMES.PAGE);
    sectionEditor.classList.add(CNAMES.NEW, CNAMES.POST);
  });

  btnReturn.addEventListener('click', (ev) => {
    sectionInitial.className = '';
    sectionEditor.className = '';
  });

  btnSave.addEventListener('click', (ev) => {
    console.log(editor.getContents());
  });

  btnEditPage.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${pages
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.className = CNAMES.PAGE_LIST;
  });

  btnEditPost.addEventListener('click', async (ev) => {
    ev.stopPropagation();

    const tree = {};
    posts.forEach((p) => {
      const [y, m, d] = p.date.split('-');
      if (!(y in tree)) tree[y] = {};
      if (!(m in tree[y])) tree[y][m] = {};
      if (!(d in tree[y][m])) tree[y][m][d] = [];
      tree[y][m][d].push(p);
    });

    divFileList.innerHTML = objMapString(
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
    );
    divFileList.className = CNAMES.POST_LIST;
  });

  divFileList.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    if (ev.target.tagName !== 'A') return;
    ev.preventDefault();

    sectionEditor.classList.remove(CNAMES.NEW, CNAMES.PAGE, CNAMES.POST);
    sectionEditor.classList.add(
      CNAMES.EDIT,
      divFileList.classList.contains(CNAMES.POST_LIST)
        ? CNAMES.POST
        : CNAMES.PAGE
    );

    const fileName = join(config.pagesDir, ev.target.getAttribute('href'));

    const { matter, content } = parse(
      await Neutralino.filesystem.readFile(fileName)
    );

    inputTitle.value = matter.title;
    inputDate.value = matter.date;
    if (divFileList.className === 'post-list') {
      inputAuthor.value = matter.author ?? '';
      inputCats.value = matter.categories ?? '';
      inputTags.value = matter.tags ?? '';
    }
    editor.setContents(content);
    sectionInitial.className = CNAMES.HIDDEN;
  });

  // editor.onChange = function (contents, core) {
  //   console.log('onChange', contents);
  // };

  editor.onImageUploadBefore = (files, info, core, uploadHandler) => {
    // https://github.com/JiHong88/suneditor/discussions/1109
    console.log('-------image onImageUploadBefore ');
    console.log(JSON.stringify({ files, info }, null, 2));
    return true;
    // return Boolean || return (new FileList) || return undefined;
  };
  editor.onImageUpload = async (
    targetElement,
    index,
    state,
    info,
    remainingFilesCount,
    core
  ) => {
    console.log('-------image onImageUpload ');
    console.log(
      JSON.stringify(
        {
          tag: targetElement?.tagName,
          index,
          state,
          info,
          remainingFilesCount,
        },
        null,
        2
      )
    );
  };
});
