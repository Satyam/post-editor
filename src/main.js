import EditorJS from '@editorjs/editorjs';
import edjsParser from 'editorjs-parser';
//const parser = new edjsParser(config, customParsers, embedMarkup);
// https://github.com/miadabdi/editorjs-parser

const edjsHTML = require('editorjs-html')();
// const html = edjsHTML.parse(editorjs_clean_data);
// https://github.com/pavittarx/editorjs-html

// This is just a sample app. You can structure your Neutralinojs app code as you wish.
// This example app is written with vanilla JavaScript and HTML.
// Feel free to use any frontend framework you like :)
// See more details: https://neutralino.js.org/docs/how-to/use-a-frontend-library

const sectionInitial = document.getElementById('initial');
const btnNew = document.getElementById('new');
const btnEdit = document.getElementById('edit');
const sectionEditor = document.getElementById('editor');
const btnSave = document.getElementById('save');

function onWindowClose() {
  Neutralino.app.exit();
}

Neutralino.init();

Neutralino.events.on('windowClose', onWindowClose);

const editor = new EditorJS({
  /**
   * Id of Element that should contain the Editor
   */
  holderId: 'editorjs',

  /**
   * Available Tools list.
   * Pass Tool's class or Settings object for each Tool you want to use
   */
  tools: {
    header: {
      class: Header,
      inlineToolbar: true,
    },
    // ...
  },

  data: {},
});

editor.isReady
  .then(() => {})
  .catch((reason) => {
    console.error(`Editor.js initialization failed because of ${reason}`);
  });
