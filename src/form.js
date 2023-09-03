import { today, onClick } from './utils';

import { getCategories, getTags, getAuthors } from './data';

import { isPost, isNew, fileName, isDraft, isChanged } from './state';

import {
  isEditorChanged,
  getEditorContents,
  setEditorContents,
  acceptEditorChanges,
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
let originalValues = structuredClone(defaultValues);

let categories = [];
let tags = [];

const fillDataList = (input, list) => {
  input.list.innerHTML = list
    .map((name) => `<option value="${name}" />`)
    .join('\n');
};

const li = (value, extra = '') => `<li ${extra}>${value}</li>`;

const refreshCats = () => {
  const list = [];
  const newVal = els.newCat.value;
  const sel = newVal.length ? [li(newVal, 'data-is-new')] : [];
  getCategories().forEach((cat) => {
    if (categories.includes(cat)) sel.push(li(cat));
    else list.push(li(cat));
  });
  catList.innerHTML = list.join('\n');
  selectedCats.innerHTML = sel.join('\n');
};

const refreshTags = () => {
  const list = [];
  const newVal = els.newTag.value;
  const sel = newVal.length ? [li(newVal, 'data-is-new')] : [];
  getTags().forEach((tag) => {
    if (tags.includes(tag)) sel.push(li(tag));
    else list.push(li(tag));
  });
  tagsList.innerHTML = list.join('\n');
  selectedTags.innerHTML = sel.join('\n');
};

const refreshLists = () => {
  refreshCats();
  refreshTags();
};
export const setDataLists = () => {
  els.newCat.value = '';
  els.newTag.value = '';
  refreshLists();

  fillDataList(els.author, getAuthors());
};

const showError = (el, msg) => {
  if (msg) {
    el.parentNode.classList.add('invalid');
    el.nextElementSibling.textContent = msg;
  } else {
    el.parentNode.classList.remove('invalid');
  }
};

const getForm = () => {
  const data = {
    title: els.title.value,
    date: els.date.value,
  };
  if (isPost) {
    data.author = els.author.value;
    data.categories = categories;
    data.tags = tags;
  }
  return data;
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
        dispatch(EVENT.SAVE, {
          matter: getForm(),
          contents: getEditorContents(),
        });
      }
      break;
    }
    case 'publish': {
      dispatch(EVENT.PUBLISH, {
        matter: getForm(),
        contents: getEditorContents(),
      });
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

const checkChanges = () => {
  const ch =
    isEditorChanged ||
    originalValues.title !== els.title.value ||
    (originalValues.date !== els.date.value &&
      isPost &&
      (originalValues.categories.length !== categories.length ||
        originalValues.categories.some((cat) => !categories.includes(cat)) ||
        els.newCat.value.length ||
        originalValues.tags.length !== tags.length ||
        originalValues.tags.some((tag) => !tags.includes(tag)) ||
        els.newTag.value.length ||
        originalValues.author !== els.author.value));
  if (ch !== isChanged) {
    dispatch(EVENT.FORM_CHANGED, ch);
  }
};
export const acceptChanges = () => {
  acceptEditorChanges();
  originalValues = structuredClone({
    categories,
    tags,
    title: els.title.value,
    date: els.date.value,
    author: els.author.value,
  });
  dispatch(EVENT.FORM_CHANGED, false);
};

on(EVENT.EDITOR_CHANGED, checkChanges);

onClick(catList, (target) => {
  categories.push(target.innerText);
  refreshCats();
  checkChanges();
});
onClick(
  selectedCats,
  (li) => {
    if ('isNew' in li.dataset) {
      els.newCat.value = '';
    } else {
      categories = categories.filter((cat) => cat !== li.innerText);
    }
    refreshCats();
    checkChanges();
  },
  'li'
);

onClick(tagsList, (tagEl) => {
  tags.push(tagEl.innerText);
  refreshTags();
  checkChanges();
});

onClick(
  selectedTags,
  (li) => {
    if ('isNew' in li.dataset) {
      els.newTag.value = '';
    } else {
      tags = tags.filter((tag) => tag !== li.innerText);
    }
    refreshTags();
    checkChanges();
  },
  'li'
);

form.addEventListener('input', (ev) => {
  const { name } = ev.target;
  switch (name) {
    case 'newCat':
      refreshCats();
      checkChanges();
      break;
    case 'newTag':
      refreshTags();
      checkChanges();
      break;
    default:
      if (name in originalValues) checkChanges();
      break;
  }
});

on(EVENT.STATE_CHANGED, () => {
  form.className = isPost ? 'is-post' : 'is-page';
  els.save.disabled = !isChanged;
  els.publish.disabled = !fileName || isChanged;
  els.remove.disabled = isNew || fileName === 'index.md';
  els.discard.disabled = !isDraft;
});

export const setForm = (
  data = structuredClone(defaultValues),
  contents = ''
) => {
  originalValues = structuredClone(data);
  if (isChanged) dispatch(EVENT.FORM_CHANGED, false);
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
  checkChanges();
};
