import {
  readJson,
  writeJson,
  join,
  objMapString,
  sortDescending,
  slugify,
} from './utils';

import { categories, tags, authors } from './files';

export const form = document.forms[0];
const selectedCats = document.getElementById('selectedCats');
const selectedTags = document.getElementById('selectedTags');
let isPost = false;

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
  fillSelect(form.catList, categories);
  fillSelect(form.tagsList, tags);
  fillDataList(form.author, authors);
};

const copySelectedCats = (ev) => {
  const cats = Array.from(form.catList.options)
    .filter((opt) => opt.selected)
    .map((opt) => opt.value);
  if (form.newCat.value.length) cats.unshift(form.newCat.value);

  selectedCats.innerHTML = cats.map((cat) => `<li>${cat}</li>`).join('\n');
};
form.catList.addEventListener('input', copySelectedCats);
form.newCat.addEventListener('input', copySelectedCats);

const copySelectedTags = (ev) => {
  const tags = Array.from(form.tagsList.options)
    .filter((opt) => opt.selected)
    .map((opt) => opt.value);
  if (form.newTag.value.length) tags.unshift(form.newTag.value);

  selectedTags.innerHTML = tags.map((tag) => `<li>${tag}</li>`).join('\n');
};
form.tagsList.addEventListener('input', copySelectedTags);
form.newTag.addEventListener('input', copySelectedTags);

const inputs = Array.from(form.elements).filter(
  (el) => el.tagName !== 'BUTTON'
);

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
  console.log('submitted by:', ev.submitter.name);

  let valid = true;
  const title = form.elements.title.value;
  if (title.length < 5) {
    showError(
      form.elements.title,
      'Los títulos han de tener al menos 5 caracteres'
    );
    valid = false;
  } else showError(form.elements.title);
  const date = form.date.value;
  if (date.length === 0) {
    showError(form.date, 'Se debe indicar una fecha para el artículo');
    valid = false;
  } else showError(form.date);
  console.log(date);

  if (valid) {
    const data = {
      title: form.elements.title.value,
      date: form.elements.date.value,
    };
    if (isPost) {
      data.author = form.elements.author.value;
      data.categories = Array.from(selectedCats.children).map(
        (li) => li.innerHTML
      );
      data.tags = Array.from(selectedTags.children).map((li) => li.innerHTML);
    }
    form.dispatchEvent(
      new CustomEvent(ev.submitter.name, {
        detail: data,
      })
    );
  }
});

export const setForm = (
  post,
  data = {
    title: '',
    date: new Date().toISOString(),
    categories: [],
    tags: [],
    author: 'Roxana Cabut',
  }
) => {
  isPost = post;
  form.className = post ? 'is-post' : 'is-page';

  inputs.forEach((el) => showError(el));

  form.elements.title.value = data.title;
  form.date.value = data.date.split('T')[0];
  console.log(data.date, form.date.value);
  if (post) {
    form.author.value = data.author;
    selectedCats.innerHTML = data.categories
      .map((cat) => `<li>${cat}</li>`)
      .join('\n');
    Array.from(form.catList.options).forEach((opt) => {
      opt.selected = data.categories.includes(opt.value);
    });
    selectedTags.innerHTML = data.tags
      .map((tag) => `<li>${tag}</li>`)
      .join('\n');
    Array.from(form.tagsList.options).forEach((opt) => {
      opt.selected = data.tags.includes(opt.value);
    });
  }
};

form.addEventListener('reset', (ev) => {
  setForm(true);
});
