import {
  readJson,
  writeJson,
  join,
  objMapString,
  sortDescending,
  slugify,
} from './utils';

export const form = document.forms[0];

const fill = (input, list) => {
  input.list.innerHTML = list
    .map((name) => `<option value="${name}" />`)
    .join('\n');
};
export const setDataLists = (categories, tags, authors) => {
  fill(form.categories, categories);
  fill(form.tags, tags);
  fill(form.author, authors);
};

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

form.addEventListener('reset', (ev) => {
  form.title.value = '';
  form.date.value = new Date().toISOString().split(':')[0];
  form.categories.value = '';
  form.tags.value = '';
  form.author.value = '';
});

form.addEventListener('submit', async (ev) => {
  ev.preventDefault();
  console.log('submitted by:', ev.submitter.name);

  let valid = true;
  const title = form.title.value;
  debugger;
  if (title.length < 5) {
    showError(form.title, 'Los títulos han de tener al menos 5 caracteres');
    valid = false;
  } else showError(form.title);
  const date = form.date.value;
  if (date.length === 0) {
    showError(form.date, 'Se debe indicar una fecha para el artículo');
    valid = false;
  } else showError(form.date);
  console.log(date);

  if (valid) {
    debugger;
    form.dispatchEvent(
      new CustomEvent(ev.submitter.name, {
        detail: inputs.reduce(
          (data, el) => ({ ...data, [el.name]: el.value }),
          {}
        ),
      })
    );
  }
});
