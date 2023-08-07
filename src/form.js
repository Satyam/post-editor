import { today } from './utils';

import {
  getCategories,
  getTags,
  getAuthors,
  isDraft,
  isPost,
  fileName,
} from './data';

import { dispatch, on } from './events';
import { confirm } from './dialog';

export const form = document.forms[0];

const els = form.elements;

const selectedCats = document.getElementById('selectedCats');
const selectedTags = document.getElementById('selectedTags');

const fillDataList = (input, list) => {
  input.list.innerHTML = list
    .map((name) => `<option value="${name}" />`)
    .join('\n');
};

const fillSelect = (select, list) => {
  select.innerHTML = list
    .map((name) => `<option value="${name}">${name}</option>`)
    .join('\n');
};

export const setDataLists = () => {
  fillSelect(els.catList, getCategories());
  fillSelect(els.tagsList, getTags());
  fillDataList(els.author, getAuthors());
};

const copySelectedCats = (ev) => {
  const cats = Array.from(els.catList.options)
    .filter((opt) => opt.selected)
    .map((opt) => opt.value);
  if (els.newCat.value.length) cats.unshift(els.newCat.value);

  selectedCats.innerHTML = cats.map((cat) => `<li>${cat}</li>`).join('\n');
};
els.catList.addEventListener('input', copySelectedCats);
els.newCat.addEventListener('input', copySelectedCats);

const copySelectedTags = (ev) => {
  const tags = Array.from(els.tagsList.options)
    .filter((opt) => opt.selected)
    .map((opt) => opt.value);
  if (els.newTag.value.length) tags.unshift(els.newTag.value);

  selectedTags.innerHTML = tags.map((tag) => `<li>${tag}</li>`).join('\n');
};
els.tagsList.addEventListener('input', copySelectedTags);
els.newTag.addEventListener('input', copySelectedTags);

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
          data.categories = Array.from(selectedCats.children).map(
            (li) => li.innerHTML
          );
          data.tags = Array.from(selectedTags.children).map(
            (li) => li.innerHTML
          );
        }
        dispatch('save', data);
      }
      break;
    }
    case 'publish': {
      dispatch('publish');
      break;
    }
    case 'discard': {
      if (
        await confirm(
          `¿Desea borrar "${els.title.value}" de fecha ${els.date.value}?`,
          'Confirmación'
        )
      ) {
        dispatch('discard');
      }
      break;
    }
    case 'remove': {
      break;
    }
  }
});

form.addEventListener('reset', (ev) => {
  ev.stopImmediatePropagation();
  dispatch('reset');
});

on('typeChange', () => {
  form.className = isPost ? 'is-post' : 'is-page';
  if (isDraft) form.classList.add('is-draft');
  if (fileName) form.classList.add('can-delete');
});

export const setForm = (
  data = {
    title: '',
    date: today,
    categories: [],
    tags: [],
    author: 'Roxana Cabut',
  }
) => {
  Array.from(els)
    .filter((el) => el.tagName === 'INPUT')
    .forEach((el) => showError(el));

  els.title.value = data.title;
  els.date.value = data.date?.split('T')[0] ?? today;
  if (isPost) {
    els.author.value = data.author;
    selectedCats.innerHTML = data.categories
      .map((cat) => `<li>${cat}</li>`)
      .join('\n');
    Array.from(els.catList.options).forEach((opt) => {
      opt.selected = data.categories.includes(opt.value);
    });
    selectedTags.innerHTML = data.tags
      .map((tag) => `<li>${tag}</li>`)
      .join('\n');
    Array.from(els.tagsList.options).forEach((opt) => {
      opt.selected = data.tags.includes(opt.value);
    });
  }
};
