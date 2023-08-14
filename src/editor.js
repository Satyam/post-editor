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
  imageGalleryUrl: 'assets/img/gallery.json',
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

export let isEditorChanged = false;

let _contents = '';

editor.onChange = (contents) => {
  let ch = contents !== _contents;
  if (ch !== isEditorChanged) {
    isEditorChanged = ch;
    dispatch(EVENT.EDITOR_CHANGED, isEditorChanged);
  }
};

export const acceptEditorChanges = () => {
  _contents = editor.getContents();
  isEditorChanged = false;
  dispatch(EVENT.EDITOR_CHANGED, false);
};

export const setEditorContents = (contents) => {
  editor.setContents(contents);
  acceptEditorChanges();
};

export const getEditorContents = () => editor.getContents();
export const getEditorImages = () => editor.getImagesInfo();
