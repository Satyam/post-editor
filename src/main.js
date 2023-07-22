import { parse } from './frontmatter';
import editor from './editor';
import {
  readJson,
  join,
  objMapString,
  sortDescending,
  isObjEmpty,
} from './utils';
import { imagesToEditor } from './images';
import {
  btnNewPage,
  btnEditPage,
  btnNewPost,
  btnEditPost,
  btnDraftPage,
  btnDraftPost,
  btnExit,
  main,
  sectionEditor,
  inputTitle,
  inputDate,
  inputCats,
  inputTags,
  inputAuthor,
  btnSave,
  btnSaveDraft,
  btnReturn,
  divFileList,
} from './elements';

const CNAMES = {
  POST: 'is-post',
  PAGE: 'is-page',
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

const start = async () => {
  main.className = CNAMES.SELECT;
  const {
    json: { pages, posts },
  } = await readJson(NL_HEXO_FILES_LIST);

  const { draftPosts, draftPages } = await readJson(NL_DRAFTS_LIST);

  if (isObjEmpty(draftPages)) btnDraftPage.disabled = true;
  if (isObjEmpty(draftPosts)) btnDraftPost.disabled = true;

  await imagesToEditor();

  btnExit.addEventListener('click', (ev) => {
    Neutralino.app.exit();
  });

  btnNewPage.addEventListener('click', (ev) => {
    main.className = CNAMES.EDIT;
    sectionEditor.className = CNAMES.PAGE;
  });

  btnNewPost.addEventListener('click', (ev) => {
    main.className = CNAMES.EDIT;
    sectionEditor.className = CNAMES.POST;
  });

  btnReturn.addEventListener('click', (ev) => {
    main.className = CNAMES.SELECT;
  });

  btnSave.addEventListener('click', (ev) => {
    console.log(editor.getContents());
  });

  btnSaveDraft.addEventListener('click', (ev) => {
    const isPost = sectionEditor.classList.contains(CNAMES.POST);
    const title = inputTitle.value;
    const date = inputDate.value;
    const matter = { title, date };
    if (isPost) {
      matter.author = inputAuthor.value;
      matter.categories = inputCats.value.split(',');
      matter.tags = inputTags.value.split(',');
    }
  });

  btnEditPage.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${pages
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.className = CNAMES.PAGE_LIST;
    sectionEditor.className = CNAMES.PAGE;
  });

  btnDraftPage.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${draftPages
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.className = CNAMES.DRAFT_PAGE_LIST;
    sectionEditor.className = CNAMES.PAGE;
  });

  btnDraftPost.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${draftPosts
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.className = CNAMES.DRAFT_POST_LIST;
    sectionEditor.className = CNAMES.POST;
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
    sectionEditor.className = CNAMES.POST;
  });

  divFileList.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    if (ev.target.tagName !== 'A') return;
    ev.preventDefault();

    const fileName = join(NL_SRC_PAGES_DIR, ev.target.getAttribute('href'));

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
    main.className = CNAMES.EDIT;
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
};

start().catch((err) => {
  console.log(err), Neutralino.app.exit(1);
});
