import { readJson, writeJson, join } from './utils';

const fs = Neutralino.filesystem;

const HEXO_DIR = '../roxygrabber/hexo/';
export const DOCUMENT_ROOT = 'resources/';
// export const HEXO_FILES_LIST = join(HEXO_DIR, 'files.json');
export const SRC_PAGES_DIR = join(HEXO_DIR, 'source/');
export const HEXO_IMG_DIR = join(SRC_PAGES_DIR, 'assets/img/');
export const DRAFTS_DIR = join(DOCUMENT_ROOT, 'drafts/');
const DRAFTS_INFO = join(DRAFTS_DIR, 'info.json');
export const EDITOR_IMG_DIR = join(DOCUMENT_ROOT, 'assets/img/');

export let fileName;
export let isPost = false;
export let isDraft = false;

let info;

export const setFileName = (fn = null) => (fileName = fn);

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

export const setMdType = (post = false, draft = false) => {
  isPost = post;
  isDraft = draft;
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
