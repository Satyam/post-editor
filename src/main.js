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

init().then(async () => {
  const {
    json: { pages, posts },
  } = await readJson(config.filesList);

  await imagesToEditor();
  btnExit.addEventListener('click', (ev) => {
    Neutralino.app.exit();
  });

  btnNewPage.addEventListener('click', (ev) => {
    sectionInitial.hidden = true;
    sectionEditor.hidden = false;
  });

  btnReturn.addEventListener('click', (ev) => {
    sectionInitial.hidden = false;
    sectionEditor.hidden = true;
  });

  btnSave.addEventListener('click', (ev) => {
    console.log(editor.getContents());
  });

  btnEditPage.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${pages
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.hidden = false;
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
    divFileList.hidden = false;
  });

  divFileList.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    if (ev.target.tagName !== 'A') return;
    ev.preventDefault();
    divFileList.hidden = false;

    const fileName = join(config.pagesDir, ev.target.getAttribute('href'));

    const { matter, content } = parse(
      await Neutralino.filesystem.readFile(fileName)
    );
    debugger;
    inputTitle.value = matter.title;
    inputDate.value = matter.date;
    divPostExtra.hidden = true;
    editor.setContents(content);
    sectionInitial.hidden = true;
    sectionEditor.hidden = false;
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
          tag: targetElement.tagName,
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
