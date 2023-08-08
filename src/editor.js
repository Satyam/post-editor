import suneditor from 'suneditor';
import plugins from 'suneditor/src/plugins';
import es from 'suneditor/src/lang/es';
import { dispatch, EVENT } from './events';

const editor = suneditor.create('suneditor', {
  height: '300',
  defaultTag: '',
  textTags: {
    bold: 'b',
    underline: 'u',
    italic: 'i',
    strike: 's',
  },
  mode: 'classic',
  rtl: false,
  // katex: 'window.katex',
  imageGalleryUrl:
    'https://etyswjpn79.execute-api.ap-northeast-1.amazonaws.com/suneditor-demo',
  videoFileInput: false,
  tabDisable: false,
  buttonList: [
    ['undo', 'redo'],
    [/*'font',*/ 'fontSize', 'formatBlock', 'paragraphStyle', 'blockquote'],
    ['bold', 'underline', 'italic', 'strike' /*, 'subscript', 'superscript'*/],
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

export let isChanged = false;

let _contents = '';

editor.onChange = (contents) => {
  let ch = contents !== _contents;
  if (ch !== isChanged) {
    isChanged = ch;
    dispatch(EVENT.EDITOR_CHANGED);
  }
};

export const setEditorContents = (contents) => {
  editor.setContents(contents);
  _contents = editor.getContents();
};

export const getEditorContents = editor.getContents;
export const getEditorImages = editor.getImagesInfo;
