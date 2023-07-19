import { init, config, neutralinoConfig } from './init';
import { parse } from './frontmatter';
import editor from './editor';
import { readJson, join } from './utils';
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
  ulFileList,
  divPostExtra,
} from './elements';

init().then(async () => {
  const {
    json: { pages, posts },
  } = await readJson(config.filesList);

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
    ulFileList.innerHTML = pages
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('');
    ulFileList.hidden = false;
  });

  ulFileList.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    ev.preventDefault();
    ulFileList.hidden = false;

    const fileName = join(config.pagesDir, ev.target.getAttribute('href'));

    const { matter, content } = parse(
      await Neutralino.filesystem.readFile(fileName)
    );
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
    console.log({ files, info });
    debugger;
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
    if (state === 'create') {
      await Neutralino.filesystem
        .copyFile(
          join(config.srcImagesDir, info.name),
          join(
            NL_CWD,
            neutralinoConfig.documentRoot,
            config.finalImagesDir,
            info.name
          )
        )
        .catch((err) => {
          console.error(err);
          throw err;
        });
    }
  };
});
