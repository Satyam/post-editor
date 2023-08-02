import editor from './editor';
import { join, objMapString, sortDescending, slugify, today } from './utils';
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
  getDraftPages,
  getDraftPosts,
  isDraft,
  isPost,
  setMdType,
  saveInfo,
  setFileName,
  fileName,
  addDraftInfo,
} from './data';
import { imagesToEditor } from './images';

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
  btnDraftPage.disabled = !getDraftPages().length;
  btnDraftPost.disabled = !getDraftPosts().length;
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
    });

    on('draft', async (matter) => {
      matter.updated = today;
      setMdType(isPost, true);
      if (isPost) {
        matter.layout = 'post';
        if (!fileName)
          setFileName(`${matter.date}-${slugify(matter.title)}.md`);
      } else {
        matter.layout = 'page';
        if (!fileName) setFileName(`${slugify(matter.title)}.md`);
      }
      await saveMD(matter, editor.getContents());
      await addDraftInfo({ title: matter.title, date: today });
      setDraftButtons();
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
      setMdType(false);
      setFileName();
      setForm();
    });

    btnNewPost.addEventListener('click', (ev) => {
      main.className = CNAMES.EDIT;
      editor.setContents('');
      setMdType(true);
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
        `<ul>${getDraftPages()
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
        `<ul>${getDraftPosts()
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

    editor.onImageUploadBefore = (files, info, core, uploadHandler) => {
      // https://github.com/JiHong88/suneditor/discussions/1109
      console.log('-------image onImageUploadBefore ');
      console.log(JSON.stringify({ files, info }, null, 2));
      return true;
      // return Boolean || return (new FileList) || return undefined;
    };

    //stackoverflow.com/questions/35940290/how-to-convert-base64-string-to-javascript-file-object-like-as-from-file-input-f
    https: editor.onImageUpload = async (
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
    console.log(err);
    window.close();
    Neutralino.app.exit(1);
  });

// // https://stackoverflow.com/questions/68248551/base64-to-image-file-convertion-in-js

// export function getFileFromBase64(string64:string, fileName:string) {
//   const trimmedString = string64.replace('dataimage/jpegbase64', '');
//   const imageContent = atob(trimmedString);
//   const buffer = new ArrayBuffer(imageContent.length);
//   const view = new Uint8Array(buffer);

//   for (let n = 0; n < imageContent.length; n++) {
//     view[n] = imageContent.charCodeAt(n);
//   }
//   const type = 'image/jpeg';
//   const blob = new Blob([buffer], { type });
//   return new File([blob], fileName, { lastModified: new Date().getTime(), type });
// }

//---------------------------
// https://stackoverflow.com/questions/38658654/how-to-convert-a-base64-string-into-a-file/38659875

// data:image/jpeg;base64,/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAMCAgICA...

function base64ImageToBlob(str) {
  // extract content type and base64 payload from original string
  var pos = str.indexOf(';base64,');
  var type = str.substring(5, pos);
  var b64 = str.substr(pos + 8);

  // decode base64
  var imageContent = atob(b64);

  // create an ArrayBuffer and a view (as unsigned 8-bit)
  var buffer = new ArrayBuffer(imageContent.length);
  var view = new Uint8Array(buffer);

  // fill the view, using the decoded base64
  for (var n = 0; n < imageContent.length; n++) {
    view[n] = imageContent.charCodeAt(n);
  }

  // convert ArrayBuffer to Blob
  var blob = new Blob([buffer], { type: type });

  return blob;
}

// https://stackoverflow.com/questions/21227078/convert-base64-to-image-in-javascript-jquery

function base64toBlob(base64Data, contentType) {
  contentType = contentType || '';
  var sliceSize = 1024;
  var byteCharacters = atob(base64Data);
  var bytesLength = byteCharacters.length;
  var slicesCount = Math.ceil(bytesLength / sliceSize);
  var byteArrays = new Array(slicesCount);

  for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
    var begin = sliceIndex * sliceSize;
    var end = Math.min(begin + sliceSize, bytesLength);

    var bytes = new Array(end - begin);
    for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
      bytes[i] = byteCharacters[offset].charCodeAt(0);
    }
    byteArrays[sliceIndex] = new Uint8Array(bytes);
  }
  return new Blob(byteArrays, { type: contentType });
}

// new Regex(@"data:(?<mime>[\w/\-\.]+);(?<encoding>\w+),(?<data>.*)", RegexOptions.Compiled);
// {
//   "tag": "IMG",
//   "index": 0,
//   "state": "create",
//   "info": {
//     "src": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAABEoAAAStCAAAAAB2bOEGAAA+NXpUWHRSYXc
// .....
// o2mb+N3HZ+EBbONohu66wdVm1FzFrVmiPpNC6u2Ha/mSq5agBANkyDbtH03EyVIlC3lYj+B8Uh81qmOr4aAAAAAElFTkSuQmCC",
//     "index": 0,
//     "name": "posterizada.png",
//     "size": 103044,
//     "element": {}
//   },
//   "remainingFilesCount": 0
// }
