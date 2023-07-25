import { parse, stringify } from './frontmatter';
import editor from './editor';
import { join, objMapString, sortDescending, slugify } from './utils';
import {
  form,
  setDataLists,
  setForm,
  isDraft,
  isPost,
  setEditor,
} from './form';
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

import { drafts, pages, posts, load, saveDrafts } from './files';

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

load()
  .then(async () => {
    main.className = CNAMES.SELECT;

    setDataLists();

    btnDraftPage.disabled = !drafts.pages?.length;
    btnDraftPost.disabled = !drafts.posts?.length;

    btnExit.addEventListener('click', (ev) => {
      Neutralino.app.exit();
    });

    form.addEventListener('save', (ev) => {
      console.log('save', ev.detail);
    });

    form.addEventListener('draft', async (ev) => {
      const matter = ev.detail;
      matter.updated = new Date().toISOString();
      if (isPost) {
        matter.layout = 'post';
        const file = join('posts', `${matter.date}-${slugify(matter.title)}`);
        await fs.writeFile(
          join(NL_DRAFTS_DIR, file),
          stringify(matter, editor.getContents())
        );
        drafts.posts.push({ file, title: matter.title, date: matter.date });
      } else {
        matter.layout = 'page';
        const file = join('pages', slugify(matter.title));
        await fs.writeFile(
          join(NL_DRAFTS_DIR, file),
          stringify(matter, editor.getContents())
        );
        drafts.pages.push({ file, title: matter.title, date: matter.date });
      }
      await saveDrafts();
      btnDraftPage.disabled = !drafts.pages?.length;
      btnDraftPost.disabled = !drafts.posts?.length;
    });

    btnNewPage.addEventListener('click', (ev) => {
      main.className = CNAMES.EDIT;
      setEditor(false);
      setForm();
    });

    btnNewPost.addEventListener('click', (ev) => {
      main.className = CNAMES.EDIT;
      setEditor(true);
      setForm();
    });

    form.addEventListener('reset', (ev) => {
      main.className = CNAMES.SELECT;
    });

    btnEditPage.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      divFileList.innerHTML = `<ul>${pages
        .map(
          (p) =>
            `<li><a href="${join(NL_SRC_PAGES_DIR, p.file)}">${
              p.title
            }</a></li>`
        )
        .join('')}</ul>`;
      divFileList.className = CNAMES.PAGE_LIST;
      setEditor(false);
    });

    btnDraftPage.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      divFileList.innerHTML = `<ul>${drafts.pages
        .map(
          (p) =>
            `<li><a href="${join(NL_DRAFTS_DIR, p.file)}">${p.title}</a></li>`
        )
        .join('')}</ul>`;
      divFileList.className = CNAMES.DRAFT_PAGE_LIST;
      setEditor(false, true);
    });

    btnDraftPost.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      divFileList.innerHTML = `<ul>${drafts.posts
        .map(
          (p) =>
            `<li><a href="${join(NL_DRAFTS_DIR, p.file)}">${p.title}</a></li>`
        )
        .join('')}</ul>`;
      divFileList.className = CNAMES.DRAFT_POST_LIST;
      setEditor(true, true);
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
                    .map(
                      (p) =>
                        `<li><a href="${join(NL_SRC_PAGES_DIR, p.file)}">${
                          p.title
                        }</a></li>`
                    )
                    .join('\n')}</ul></details>`,
                sortDescending
              )}</details>`,
            sortDescending
          )}</details>`,
        sortDescending
      );
      divFileList.className = CNAMES.POST_LIST;
      setEditor(true);
    });

    divFileList.addEventListener('click', async (ev) => {
      ev.stopPropagation();
      if (ev.target.tagName !== 'A') return;
      ev.preventDefault();

      const fileName = ev.target.getAttribute('href');

      const { matter, content } = parse(await fs.readFile(fileName));

      setForm(matter, fileName);
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
  })
  .catch((err) => {
    console.log(err), Neutralino.app.exit(1);
  });
