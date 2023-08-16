import { readJson, writeJson, join } from './utils';
import { fileName, isPost, isNew } from './state';

export const HEXO_DIR = '../roxygrabber/hexo/';
export const DOCUMENT_ROOT = 'resources/';
export const IMG_DIR = 'assets/img/';
// export const HEXO_FILES_LIST = join(HEXO_DIR, 'files.json');
export const SRC_PAGES_DIR = join(HEXO_DIR, 'source/');
export const DELETED_PAGS_DIR = join(SRC_PAGES_DIR, '_deleted');
export const HEXO_IMG_DIR = join(SRC_PAGES_DIR, IMG_DIR);
export const DRAFTS_DIR = join(DOCUMENT_ROOT, 'drafts/');
const DRAFTS_INFO = join(DRAFTS_DIR, 'info.json');
export const EDITOR_IMG_DIR = join(DOCUMENT_ROOT, IMG_DIR);

let info;

export const getCategories = () => info.categories;
export const getTags = () => info.tags;
export const getAuthors = () => info.authors;
export const getPages = () => info.pages;
export const getPosts = () => info.posts;
export const getDrafts = (post = false) =>
  info.drafts.filter((p) => p.isPost === post);

export const saveInfo = () => writeJson(DRAFTS_INFO, info);

export const removeDraftInfo = async () => {
  info.drafts = info.drafts.filter(
    (data) => !(data.file === fileName && data.isPost === isPost)
  );
  await saveInfo();
};

export const removePostInfo = async () => {
  if (isPost) {
    info.posts = info.posts.filter((data) => data.file !== fileName);
  } else {
    info.pages = info.pages.filter((data) => data.file !== fileName);
  }
  await saveInfo();
};

export const addPostInfo = async (fileInfo) => {
  if (isPost) {
    info.posts.push(fileInfo);
  } else {
    info.pages.push(fileInfo);
  }
  await saveInfo();
};

export const addDraftInfo = async (fileInfo) => {
  const newInfo = {
    ...fileInfo,
    file: fileName,
    isPost,
    isNew,
  };
  if (
    !info.drafts.some((data, index) => {
      if (data.file === fileName && data.isPost === isPost) {
        info.drafts[index] = newInfo;
        return true;
      }
    })
  ) {
    info.drafts.push(newInfo);
  }
  await saveInfo();
};

export const updateProps = async (matter) => {
  const { categories, tags, author } = matter;
  let changed = false;
  categories.forEach((cat) => {
    if (!info.categories.includes(cat)) {
      info.categories.push(cat);
      info.categories.sort();
      changed = true;
    }
  });
  tags.forEach((tag) => {
    if (!info.tags.includes(tag)) {
      info.tags.push(tag);
      info.tags.sort();
      changed = true;
    }
  });
  if (!info.authors.includes(author)) {
    info.authors.push(author);
    info.authors.sort();
    changed = true;
  }

  if (changed) {
    await saveInfo();
  }
  return changed;
};

export const uniqueFileName = (fName) => {
  let newName;
  for (let count = 0, found = false; !found; count++) {
    newName = count ? `${fName}-${count}.md` : `${fName}.md`;
    if (isPost) {
      found = info.posts.every((data) => data.file !== newName);
    } else {
      found = info.pages.every((data) => data.file !== newName);
    }
    found = found && info.drafts.every((data) => data.file !== newName);
  }
  return newName;
};

const INFO_PROPS = [
  'pages',
  'posts',
  'categories',
  'tags',
  'authors',
  'drafts',
];

export const loadInfo = async () => {
  info = Object.assign(
    {
      pages: [],
      posts: [],
      categories: [],
      tags: [],
      authors: [],
      drafts: [],
    },
    await readJson(DRAFTS_INFO)
  );
  ['categories', 'tags', 'authors'].forEach((sel) => {
    info[sel].sort();
  });
};
