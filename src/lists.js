import { getPages, getPosts, getDrafts } from './data';
import { objMapString, sortDescending } from './utils';

export const pagesList = () => {
  const drafts = getDrafts();

  return `<ul>${getPages()
    .map((p) =>
      drafts.some((d) => d.file === p.file)
        ? `<li class="can-t-edit" title="Está en Borradores">${p.title}</li>`
        : `<li><a href="${p.file}">${p.title}</a></li>`
    )
    .join('')}</ul>`;
};

export const postsList = () => {
  const drafts = getDrafts(true);

  const tree = {};
  getPosts().forEach((p) => {
    const [y, m, d] = p.date.split('-');
    if (!(y in tree)) tree[y] = {};
    if (!(m in tree[y])) tree[y][m] = {};
    if (!(d in tree[y][m])) tree[y][m][d] = [];
    tree[y][m][d].push(p);
  });
  return objMapString(
    tree,
    (y) =>
      `<details><summary>${y}</summary>${objMapString(
        tree[y],
        (m) =>
          `<details><summary>${m}</summary>${objMapString(
            tree[y][m],
            (d) =>
              `<details><summary>${d}</summary><p>${d}/${m}/${y}</p><ul>
              ${tree[y][m][d]
                .map((p) =>
                  drafts.some((d) => d.file === p.file)
                    ? `<li class="can-t-edit" title="Está en Borradores">${p.title}</li>`
                    : `<li><a href="${p.file}">${p.title}</a></li>`
                )
                .join('\n')}</ul></details>`,
            sortDescending
          )}</details>`,
        sortDescending
      )}</details>`,
    sortDescending
  );
};
