import { today } from './utils';

import { getCategories, getTags, getAuthors } from './data';

import { isPost, isNew, fileName, isDraft } from './state';

import {
  isChanged as editorChanged,
  getEditorContents,
  setEditorContents,
} from './editor';

import { dispatch, on, EVENT } from './events';
import { confirm } from './dialog';

export const form = document.forms[0];

const catList = document.getElementById('catList');
const selectedCats = document.getElementById('selectedCats');
const tagsList = document.getElementById('tagsList');
const selectedTags = document.getElementById('selectedTags');
const els = form.elements;

const defaultValues = {
  title: '',
  date: today,
  categories: [],
  tags: [],
  author: 'Roxana Cabut',
};
const originalValues = Object.assign({}, defaultValues);

let categories = [];
let tags = [];

export let isChanged = false;

const fillDataList = (input, list) => {
  input.list.innerHTML = list
    .map((name) => `<option value="${name}" />`)
    .join('\n');
};

const li = (value) => `<li>${value}</li>`;

const refreshCats = (newVal = '') => {
  const list = [];
  const sel = newVal.length ? [li(newVal)] : [];
  getCategories().forEach((cat) => {
    if (categories.includes(cat)) sel.push(li(cat));
    else list.push(li(cat));
  });
  catList.innerHTML = list.join('\n');
  selectedCats.innerHTML = sel.join('\n');
};
const refreshTags = (newVal = '') => {
  const list = [];
  const sel = newVal.length ? [li(newVal)] : [];
  getTags().forEach((tag) => {
    if (tags.includes(tag)) sel.push(li(tag));
    else list.push(li(tag));
  });
  tagsList.innerHTML = list.join('\n');
  selectedTags.innerHTML = sel.join('\n');
};

const refreshLists = () => {
  refreshCats(els.newCat.value);
  refreshTags(els.newTag.value);
};
export const setDataLists = () => {
  els.newCat.value = '';
  els.newTag.value = '';
  refreshLists();

  fillDataList(els.author, getAuthors());
};

// const copySelectedCats = (ev) => {
//   const cats = Array.from(els.catList.options)
//     .filter((opt) => opt.selected)
//     .map((opt) => opt.value);
//   if (els.newCat.value.length) cats.unshift(els.newCat.value);

//   els.selectedCats.innerHTML = cats.map((cat) => `<li>${cat}</li>`).join('\n');
// };
// els.catList.addEventListener('input', copySelectedCats);
// els.newCat.addEventListener('input', copySelectedCats);

// const copySelectedTags = (ev) => {
//   const tags = Array.from(els.tagsList.options)
//     .filter((opt) => opt.selected)
//     .map((opt) => opt.value);
//   if (els.newTag.value.length) tags.unshift(els.newTag.value);

//   els.selectedTags.innerHTML = tags.map((tag) => `<li>${tag}</li>`).join('\n');
// };
// els.tagsList.addEventListener('input', copySelectedTags);
// els.newTag.addEventListener('input', copySelectedTags);

const showError = (el, msg) => {
  if (msg) {
    el.parentNode.classList.add('invalid');
    el.nextElementSibling.textContent = msg;
  } else {
    el.parentNode.classList.remove('invalid');
  }
};

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  ev.stopImmediatePropagation();
  const action = ev.submitter.name;

  switch (action) {
    case 'save': {
      let valid = true;
      const title = els.title.value;
      if (title.length < 5) {
        showError(els.title, 'Los títulos han de tener al menos 5 caracteres');
        valid = false;
      } else showError(els.title);
      const date = els.date.value;
      if (date.length === 0) {
        showError(els.date, 'Se debe indicar una fecha para el artículo');
        valid = false;
      } else showError(els.date);

      if (valid) {
        const data = {
          title: els.title.value,
          date: els.date.value,
        };
        if (isPost) {
          data.author = els.author.value;
          data.categories = categories;
          data.tags = tags;
        }
        dispatch(EVENT.SAVE, { matter: data, contents: getEditorContents() });
        // TODO: must set isChanged to false;
        // must differentiate between editorIsChanged and formIsChanged
      }
      break;
    }
    case 'publish': {
      dispatch(EVENT.PUBLISH);
      break;
    }
    case 'discard': {
      if (
        await confirm(
          `¿Desea descartar el borrador de "${els.title.value}" de fecha ${els.date.value}?`,
          'Confirmación'
        )
      ) {
        dispatch(EVENT.DISCARD);
      }
      break;
    }
    case 'remove': {
      if (
        await confirm(
          `¿Desea borrar <b>el original y el borrador</b> de <br/>"${els.title.value}" de fecha ${els.date.value}?`,
          'Confirmación'
        )
      ) {
        dispatch(EVENT.REMOVE);
      }

      break;
    }
  }
});

form.addEventListener('reset', (ev) => {
  ev.stopImmediatePropagation();
  dispatch(EVENT.RESET);
});

catList.addEventListener('click', (ev) => {
  categories.push(ev.target.innerText);
  refreshCats();
});
selectedCats.addEventListener('click', (ev) => {
  categories = categories.filter((cat) => cat !== ev.target.innerText);
  refreshCats();
});
tagsList.addEventListener('click', (ev) => {
  tags.push(ev.target.innerText);
  refreshTags();
});
selectedTags.addEventListener('click', (ev) => {
  tags = tags.filter((tag) => tag !== ev.target.innerText);
  refreshTags();
});

form.addEventListener('input', (ev) => {
  const { name, value } = ev.target;
  let ch = false;
  switch (name) {
    case 'newCat':
      refreshCats(value);
      ch =
        originalValues.categories.length !== categories.length ||
        originalValues.categories.some((cat) => !categories.includes(cat));
      break;
    case 'newTag':
      refreshTags(value);
      ch =
        originalValues.tags.length !== tags.length ||
        originalValues.tags.some((tag) => !tags.includes(tag));
      break;
    default:
      if (name in originalValues) ch = originalValues[name] !== value;
      break;
  }
  console.log(name, value, ch, isChanged);
  if (ch !== isChanged) {
    isChanged = ch;
    dispatch(EVENT.FORM_CHANGED, isChanged);
  }
});

on(EVENT.STATE_CHANGED, (arg) => {
  console.log(arg, !isChanged || isDraft, isChanged, isDraft);
  // debugger;
  form.className = isPost ? 'is-post' : 'is-page';
  els.save.disabled = !isChanged || isDraft;
  els.publish.disabled = !fileName || isChanged;
  els.remove.disabled = isNew;
  els.discard.disabled = !isDraft;
});

export const setForm = (data = defaultValues, contents = '') => {
  Object.assign(originalValues, data);
  if (isChanged) dispatch(EVENT.FORM_CHANGED, false);
  isChanged = false;
  console.log(originalValues, data);
  setEditorContents(contents);
  Array.from(els)
    .filter((el) => el.tagName === 'INPUT')
    .forEach((el) => showError(el));

  els.title.value = data.title;
  els.date.value = data.date?.split('T')[0] ?? today;
  if (isPost) {
    els.author.value = data.author;
    categories = data.categories ?? [];
    tags = data.tags ?? [];
    setDataLists();
  }
};
