import suneditor from 'suneditor';
import plugins from 'suneditor/src/plugins';
import es from 'suneditor/src/lang/es';
import parse from './parse';

const sectionInitial = document.getElementById('initial');
const btnNew = document.getElementById('new');
const btnEdit = document.getElementById('edit');
const btnExit = document.getElementById('exit');
const sectionEditor = document.getElementById('editor');
const inputTitle = document.getElementById('title');
const inputDate = document.getElementById('date');
const inputCats = document.getElementById('categories');
const inputTags = document.getElementById('tags');
const inputAuthor = document.getElementById('author');
const radioIsPage = document.getElementById('isPage');
const btnSave = document.getElementById('save');
const btnReturn = document.getElementById('return');

function onWindowClose() {
  Neutralino.app.exit();
}

btnExit.addEventListener('click', (ev) => {
  Neutralino.app.exit();
});

btnNew.addEventListener('click', (ev) => {
  sectionInitial.style.display = 'none';
  sectionEditor.style.display = 'block';
});

btnReturn.addEventListener('click', (ev) => {
  sectionInitial.style.display = 'block';
  sectionEditor.style.display = 'none';
});
Neutralino.init();

Neutralino.events.on('windowClose', onWindowClose);

const editor = suneditor.create('suneditor', {
  defaultTag: '',
  textTags: {
    bold: 'b',
    underline: 'u',
    italic: 'i',
    strike: 's',
  },
  mode: 'classic',
  rtl: false,
  katex: 'window.katex',
  imageGalleryUrl:
    'https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo',
  videoFileInput: false,
  tabDisable: false,
  buttonList: [
    ['undo', 'redo'],
    ['font', 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
    ['bold', 'underline', 'italic', 'strike', 'subscript', 'superscript'],
    ['fontColor', 'hiliteColor'],
    ['textStyle', 'removeFormat'],
    ['outdent', 'indent'],
    ['align', 'horizontalRule', 'list'],
    [
      // 'lineHeight',
      // 'table',
      'link',
      'image',
      // 'video',
      // 'audio',
      // 'math',
      // 'imageGallery',
      // 'fullScreen',
      // 'showBlocks',
      // 'codeView',
      // 'preview',
      // 'print',
      // 'save',
      // 'template',
    ],
  ],
  plugins: plugins,
  lang: es,
});

btnSave.addEventListener('click', (ev) => {
  console.log(editor.getContents());
});

editor.onChange = function (contents, core) {
  console.log('onChange', contents);
};

editor.onImageUploadBefore = (files, info, core, uploadHandler) => {
  // https://github.com/JiHong88/suneditor/discussions/1109
  console.log('-------image --------');
  console.log({ files, info });
  return true;
  // return Boolean || return (new FileList) || return undefined;
};

btnEdit.addEventListener('click', async (ev) => {
  ev.stopImmediatePropagation();
  const entries = await Neutralino.os.showOpenDialog('Abrir un post o página', {
    defaultPath: '../roxygrabber/hexo/source',
    multiSelections: false,
    filters: [
      { name: 'post (.md)', extensions: ['md'] },
      { name: 'All files', extensions: ['*'] },
    ],
  });
  const { matter, content } = parse(
    await Neutralino.filesystem.readFile(entries[0])
  );
  inputTitle.value = matter.title;
  inputDate.value = matter.date;
  inputCats.value = matter.categories ?? '';
  inputTags.value = matter.tags ?? '';
  inputAuthor.value = matter.author ?? '';
  editor.setContents(content);
  sectionInitial.style.display = 'none';
  sectionEditor.style.display = 'block';
});
