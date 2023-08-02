import { join } from './utils';
import { HEXO_IMG_DIR, EDITOR_IMG_DIR, fileName } from './data';
import editor from './editor';
const fs = Neutralino.filesystem;

export const imagesToEditor = async () => {
  const files = await fs.readDirectory(HEXO_IMG_DIR);
  return Promise.all(
    files.map(async (f) => {
      if (f.type === 'DIRECTORY') return;
      const srcImg = join(HEXO_IMG_DIR, f.entry);
      const srcInfo = await fs.getStats(srcImg);
      const edImg = join(EDITOR_IMG_DIR, f.entry);
      const edInfo = await fs.getStats(edImg).catch(() => ({}));
      if (!edInfo.size || edInfo.modifiedAt < srcInfo.modifiedAt) {
        await fs.copyFile(srcImg, edImg);
      }
    })
  );
};

const imgDataRx =
  /data:(?<mime1>\w+)\/(?<mime2>[\w\+]+);(?<encoding>\w+),(?<data>[^"]*)/gi;

const mime2ext = {
  jpeg: 'jpeg',
  gif: 'gif',
  png: 'png',
  'svg+xml': 'svg',
  tiff: 'tiff',
  webp: 'webp',
};

export const replaceImages = async () => {
  const images = editor.getImagesInfo();
  const folder = join(EDITOR_IMG_DIR, fileName.replace('.md', ''));
  if (images.length) {
    await fs.createDirectory(folder);
  }
  for (const img of images) {
    const matches = img.src.matchAll(imgDataRx);
    for (const match of matches) {
      const { mime1, mime2, encoding, data } = match.groups;
      const ext = mime2ext[mime2];
      if (mime1 !== 'image' || encoding !== 'base64' || !ext) {
        console.log(match);
        debugger;
        return;
      }
      const imageContent = atob(data);
      const buffer = new ArrayBuffer(imageContent.length);
      const view = new Uint8Array(buffer);

      for (let n = 0; n < imageContent.length; n++) {
        view[n] = imageContent.charCodeAt(n);
      }
      const imgFileName = join(folder, img.name);

      await fs.writeBinaryFile(imgFileName, buffer);
      img.element.src = imgFileName.replace(/^resources\//, '');
    }
  }
};

// https://stackoverflow.com/questions/21227078/convert-base64-to-image-in-javascript-jquery

// function base64toBlob(base64Data, contentType) {
//   contentType = contentType || '';
//   var sliceSize = 1024;
//   var byteCharacters = atob(base64Data);
//   var bytesLength = byteCharacters.length;
//   var slicesCount = Math.ceil(bytesLength / sliceSize);
//   var byteArrays = new Array(slicesCount);

//   for (var sliceIndex = 0; sliceIndex < slicesCount; ++sliceIndex) {
//     var begin = sliceIndex * sliceSize;
//     var end = Math.min(begin + sliceSize, bytesLength);

//     var bytes = new Array(end - begin);
//     for (var offset = begin, i = 0; offset < end; ++i, ++offset) {
//       bytes[i] = byteCharacters[offset].charCodeAt(0);
//     }
//     byteArrays[sliceIndex] = new Uint8Array(bytes);
//   }
//   return new Blob(byteArrays, { type: contentType });
// }
