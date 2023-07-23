import { parse, stringify } from './frontmatter';
import editor from './editor';
import {
  readJson,
  writeJson,
  join,
  objMapString,
  sortDescending,
  slugify,
} from './utils';
import { form, setDataLists, setForm } from './form';
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
  btnReturn,
  divFileList,
} from './elements';

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

let isPost = false;

const start = async () => {
  main.className = CNAMES.SELECT;
  const {
    json: { pages, posts, categories, tags, authors },
  } = await readJson(NL_HEXO_FILES_LIST);

  setDataLists(categories, tags, authors);
  const drafts = await readJson(NL_DRAFTS_LIST);

  btnDraftPage.disabled = drafts.draftPages.length === 0;
  btnDraftPost.disabled = drafts.draftPosts.length === 0;

  await imagesToEditor();

  btnExit.addEventListener('click', (ev) => {
    Neutralino.app.exit();
  });

  form.addEventListener('save', (ev) => {
    console.log('save', ev.detail);
  });
  form.addEventListener('draft', async (ev) => {
    console.log('draft', ev.detail);
    const matter = ev.detail;
    matter.updated = new Date().toISOString();
    if (isPost) {
      matter.layout = 'post';
      const file = join('posts', `${matter.date}-${slugify(matter.title)}`);
      await fs.writeFile(
        join(NL_DRAFTS_DIR, file),
        stringify(matter, editor.getContents())
      );
      drafts.draftPosts.push({ file, title, date });
    } else {
      matter.layout = 'page';
      const file = join('pages', slugify(matter.title));
      await fs.writeFile(
        join(NL_DRAFTS_DIR, file),
        stringify(matter, editor.getContents())
      );
      drafts.draftPages.push({ file, title, date });
    }
    await writeJson(NL_DRAFTS_LIST, drafts);
    btnDraftPage.disabled = drafts.draftPages.length === 0;
    btnDraftPost.disabled = drafts.draftPosts.length === 0;
  });
  btnNewPage.addEventListener('click', (ev) => {
    main.className = CNAMES.EDIT;
    isPost = false;
    setForm(isPost);
  });

  btnNewPost.addEventListener('click', (ev) => {
    main.className = CNAMES.EDIT;
    isPost = true;
    setForm(isPost);
  });

  btnReturn.addEventListener('click', (ev) => {
    main.className = CNAMES.SELECT;
  });

  btnEditPage.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${pages
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.className = CNAMES.PAGE_LIST;
    isPost = false;
  });

  btnDraftPage.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${drafts.draftPages
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.className = CNAMES.DRAFT_PAGE_LIST;
    isPost = false;
  });

  btnDraftPost.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    divFileList.innerHTML = `<ul>${drafts.draftPosts
      .map((p) => `<li><a href="${p.file}">${p.title}</a></li>`)
      .join('')}</ul>`;
    divFileList.className = CNAMES.DRAFT_POST_LIST;
    isPost = true;
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
    isPost = true;
  });

  divFileList.addEventListener('click', async (ev) => {
    ev.stopPropagation();
    if (ev.target.tagName !== 'A') return;
    ev.preventDefault();

    const fileName = join(NL_SRC_PAGES_DIR, ev.target.getAttribute('href'));

    const { matter, content } = parse(
      await Neutralino.filesystem.readFile(fileName)
    );

    setForm(isPost, matter);
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
