import { onClick } from './utils';
const dialogEl = document.getElementById('confirm');
const msgEl = document.getElementById('confirmMsg');
const titleEl = document.getElementById('confirmTitle');

export const confirm = (msg, title = 'Roxy post editor') => {
  msgEl.innerHTML = msg;
  titleEl.innerHTML = title;
  dialogEl.showModal();
  return new Promise((resolve) => {
    dialogEl.addEventListener(
      'close',
      (ev) => {
        resolve(ev.target.returnValue === 'true');
      },
      { once: true }
    );
  });
};

onClick(
  dialogEl,
  (target) => {
    dialogEl.returnValue = target.value;
    dialogEl.close();
  },
  'button'
);
