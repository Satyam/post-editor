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

dialogEl.addEventListener('click', (ev) => {
  if (ev.target.tagName === 'BUTTON') {
    dialogEl.returnValue = ev.target.value;
    dialogEl.close();
  }
});
