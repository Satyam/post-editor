import { readJson, writeJson, join } from './utils';
import { fileName, isPost, isNew } from './state';

const HEXO_DIR = '../roxygrabber/hexo/';
export const DOCUMENT_ROOT = 'resources/';
export const IMG_DIR = 'assets/img/';
// export const HEXO_FILES_LIST = join(HEXO_DIR, 'files.json');
export const SRC_PAGES_DIR = join(HEXO_DIR, 'source/');
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
      changed = true;
    }
  });
  tags.forEach((tag) => {
    if (!info.tags.includes(tag)) {
      info.tags.push(tag);
      changed = true;
    }
  });
  if (!info.authors.includes(author)) {
    info.authors.push(author);
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
  info = await readJson(DRAFTS_INFO);
  INFO_PROPS.forEach((p) => {
    if (!info[p]) info[p] = [];
  });
};
