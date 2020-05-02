
export const getImageURL = (storage, path) => {
  return storage.ref(path).getDownloadURL()
}

export const getQueryParam = (queryString, param) => {
  const { value } = queryString
        .slice(1).split('&')
        .map(pair => {
          const [ key, value ] = pair.split('=')

          return { key, value }
        })
        .find(({ key }) => key === param)

  return value
}

export const download = (filename, url) => {
  const link = document.createElement('a')

  link.download = filename;
  link.href = url;

  link.click();

  return link
  // createLink(audio, getConvertedFilename(filename, '.mp4')).click();
}

export const crop = (canvas, a, b) => {
  const ctx = canvas.getContext('2d');

  // get the image data you want to keep.
  const imageData = ctx.getImageData(a.x, a.y, b.x, b.y);


  // create a new cavnas same as clipped size and a context
  var newCan = document.createElement('canvas');
  newCan.width = b.x - a.x;
  newCan.height = b.y - a.y;
  var newCtx = newCan.getContext('2d');

  // put the clipped image on the new canvas.
  newCtx.putImageData(imageData, 0, 0);

  return newCan

  // create a new cavnas same as clipped size and a context
  var newCan = document.createElement('canvas');
  newCan.width = b.x - a.x;
  newCan.height = b.y - a.y;
  var newCtx = newCan.getContext('2d');

  // put the clipped image on the new canvas.
  newCtx.putImageData(imageData, 0, 0);

  return newCan;
}

export const appendImage = (assets, image, name, type) => {
  const id = `${name}-${type}`
  const img = document.createElement('img')

  img.src = image
  img.id = id

  assets.appendChild(img)

  return id
}

export const showImage = (sky, name, type) => {
  sky.setAttribute('src', `#${name}-${type}`)
// image360right.setAttribute('src', `#${name}-right`)
// image360left.src = `#${name}-left`
// image360right.src = `#${name}-right`
}