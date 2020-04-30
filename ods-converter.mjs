import { EventEmitter  } from 'events';
import jsfx from 'jsfx';
// in browser, use eventemitter3 and jsfx

// Instead of jsdom, there is native DOMParser
import jsdom from 'jsdom';
import whatwg from 'whatwg-url';

import uuid from 'uuid';

console.log('uuid', uuid);
// import { v4 as uuidv4 } from 'uuid/dist/v4.js';
// import { v4 as uuidv4 } from 'uuid/dist/v4.js';

const { JSDOM } = jsdom
const { window: { DOMParser } } = new JSDOM()

console.log('whatwg', whatwg)

const location = 'https://google.com'
const URL = {
  createObjectURL: (_blob) => {
    console.log('blob', _blob)
    const url = `blob:${whatwg.serializeURL(location)}/${uuid.v4()}`;
    return url;
  },
  revokeObjectURL: (_blobUrl) => {
    return;
  }
}

import Blob from 'cross-blob';
// browser have native Blob, but it's ok
// // Global patch (to support external modules like is-blob).
// globalThis.Blob = Blob;

let startParsing;

const width = 640;

const M_SOI = 0xd8;
const M_APP1 = 0xe1;
const M_SOS = 0xda;

const XMP_SIGNATURE = 'http://ns.adobe.com/xap/1.0/';
const EXTENSTION_SIGNATURE = 'http://ns.adobe.com/xmp/extension/';
const EXT_PREFIX_LENGTH = 71;


const TARGET_SIZE = 4096;

function OdsConverter() {
  this.lastWidth = null;
}

OdsConverter.prototype = new EventEmitter();

OdsConverter.prototype.convert = function(arrayBuffer) {
  this.decode_(arrayBuffer);
};

/**
 * Given the last converted Cardboard Camera image, this method returns the
 * best pow-of-two width for the image.
 */
OdsConverter.prototype.getOptimalWidth = function() {
  if (!this.lastWidth) {
    return -1;
  }
  return Math.ceil(Math.log(this.lastWidth)/Math.log(2))
};

OdsConverter.prototype.decode_ = function(arrayBuffer) {
  const scope = this;

  if (!arrayBuffer) {
    return;
  }
  startParsing = Date.now();
  console.log('Started parsing');
  const bytes = new Uint8Array(arrayBuffer);
  const doc = extractXMP(bytes, function(e) {
    scope.emit('error', e);
  });
  if (!doc) {
    // No valid doc, so we quit.
    return;
  }
  const gPano = getObjectMeta(doc, 'GPano');
  const gImage = getObjectMeta(doc, 'GImage');
  const gAudio = getObjectMeta(doc, 'GAudio');
  const image = makeImageFromBinary('image/jpeg', bytes);
  const audio = makeAudio(gAudio.Mime, gAudio.Data);

  image.onload = function () {
    this.setupScene_(gPano, gImage, image, audio);
  }.bind(this);

}

OdsConverter.prototype.setupScene_ = function(gPano, gImage, leftImage, audio) {
  // Ensure the right image is valid.
  if (!gImage.Mime || !gImage.Data) {
    this.emit('error', 'No valid right eye image found in the XMP metadata. This might not be a valid Cardboard Camera image.');
    return;
  }

  const rightImage = makeImage(gImage.Mime, gImage.Data);
  rightImage.onload = function () {
    console.log('Parsing took ' + (Date.now() - startParsing) + ' ms');
    this.buildImage_(leftImage, rightImage, gPano, audio);
  }.bind(this);
}

OdsConverter.prototype.buildImage_ = function(leftImage, rightImage, gPano, audio) {
  const fullWidth = parseInt(gPano['FullPanoWidthPixels']);
  const cropLeft = parseInt(gPano['CroppedAreaLeftPixels']);
  const cropTop = parseInt(gPano['CroppedAreaTopPixels']);
  const cropWidth = parseInt(gPano['CroppedAreaImageWidthPixels']);
  const initialHeadingDeg = parseInt(gPano['InitialViewHeadingDegrees']);

  const ratio = TARGET_SIZE / fullWidth;

  // Handle partial panos.
  const scaleWidth = 1;
  if (cropWidth != fullWidth) {
    scaleWidth = cropWidth / fullWidth;
  }

  // A canvas for the over-under rendering.
  const canvas = document.createElement('canvas');
  canvas.width = TARGET_SIZE;
  canvas.height = TARGET_SIZE;

  // Scaled dimensions for left and right eye images.
  const imageWidth = TARGET_SIZE * scaleWidth;
  const imageHeight = leftImage.height * ratio;

  // Save the original size of the most recently converted image.
  this.lastWidth = canvas.width;

  // Offsets for where to render each image. For partial panos (ie. imageWidth <
  // TARGET_SIZE), render the image centered.
  const offsetX = (TARGET_SIZE - imageWidth) / 2;
  const x = Math.floor(cropLeft * ratio) + offsetX;
  const y = Math.floor(cropTop * ratio);
  const ctx = canvas.getContext('2d');

  // Clear the canvas.
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw the left and right images onto the canvas.
  ctx.drawImage(leftImage, x, y, imageWidth, imageHeight);
  ctx.drawImage(rightImage, x, y + canvas.height/2, imageWidth, imageHeight);

  const halfHeight = Math.floor(canvas.height / 2);
  // Offsets are the offsets for each eye.
  const offsets = [0, halfHeight];

  // Calculate how much to blur the image.
  const blurRadius = imageHeight / 2;

  for (let i = 0; i < offsets.length; i++) {
    const offset = offsets[i];

    // Calculate the dimensions of the actual image.
    const top = offset + y;
    const bottom = offset + y + imageHeight - 1;

    // Repeat the top part.
    repeatImage(canvas, top, offset);

    // Repeat the bottom part.
    repeatImage(canvas, bottom, offset + halfHeight);
  }
  const blurCanvas = blurImage(canvas, blurRadius);

  // Copy the blurred canvas onto the regular one.
  ctx.drawImage(blurCanvas, 0, 0);

  // Re-render the images themselves.
  ctx.drawImage(leftImage, x, y, imageWidth, imageHeight);
  ctx.drawImage(rightImage, x, y + canvas.height/2, imageWidth, imageHeight);

  this.emit('convert', canvas, audio);
}

function repeatImage(canvas, startY, endY) {
  const ctx = canvas.getContext('2d');

  const y = Math.min(startY, endY);
  const height = Math.abs(startY - endY);

  // Repeat the start line through the whole range.
  ctx.drawImage(canvas, 0, startY, canvas.width, 1,
                        0, y, canvas.width, height);

}

function blurImage(canvas, radius) {
  const source = new jsfx.Source(canvas);

  //const blurFilter = new jsfx.filter.Brightness(0.5);
  const blurFilter = new jsfx.filter.Blur(radius);

  const renderer = new jsfx.Renderer();
  renderer.setSource(source)
      .applyFilters([blurFilter])
      .render();

  return renderer.getCanvas();
}

function makeImage(mime, data) {
  const img = new Image();
  img.src = 'data:' + mime + ';base64,' + data;
  return img;
}

function makeImageFile(mime, bytes) {
  const blob = new Blob([bytes], {type: mime});

  fs.writeFileSync('image.jpg', blob.data);
}

function makeImageFromBinary(mime, bytes) {
  const blob = new Blob([bytes], {type: mime});
  const url = URL.createObjectURL(blob);
  const img = new Image();
  img.src = url;
  return img;
}

function makeAudio(mime, data) {
  return 'data:' + mime + ';base64,' + data;
}

function byteToString(bytes, start, end) {
  let s = '';
  start = start || 0;
  end = end || bytes.length;
  for (let i = start; i < end; i++) {
    if (bytes[i]) {
      const c = String.fromCharCode(bytes[i]);
      s += c;
    }
  }
  return s;
}

function getObjectMeta (doc, tag) {
  const meta = {};
  const descriptions = doc.querySelectorAll('Description');
  for (let i = 0; i < descriptions.length; i++) {
    const node = descriptions[i];
    for (let j in node.attributes) {
      const attr = node.attributes[j];
      if (attr.prefix == tag) {
        meta[attr.localName] = attr.value;
      }
    }
  }
  return meta;
}

function extractXMP(bytes, errorCallback) {
  const sections = parseJpeg(bytes, true);
  if (sections === null) {
    errorCallback('No XMP metadata found in specified image file. This might not be a valid Cardboard Camera image.');
    return;
  }
  let xml = '';
  let visitedExtended = false;
  for (let i = 0; i < sections.length; i++) {
    let isXmp = true;
    let isExt = true;
    const section = sections[i];
    for (let j = 0; j < section.data.length; j++) {
      const a = String.fromCharCode(section.data[j]);
      if (isXmp && a != XMP_SIGNATURE[j]) {
        isXmp = false;
      }
      if (isExt && a != EXTENSTION_SIGNATURE[j]) {
        isExt = false;
      }
      if (!isExt || !isXmp) {
        break;
      }
    }

    if (isXmp) {
      const str = byteToString(section.data);
      const re = new RegExp('<x:xmpmeta([\\s\\S]*)</x:xmpmeta>');
      xml = str.match(re)[0];
    }
    else if (isExt) {
      let len = EXT_PREFIX_LENGTH;
      if (visitedExtended) {
        len +=4;
      }
      visitedExtended = true;
      xml += byteToString(section.data, len);
    }
  }
  const parser = new DOMParser();
  const doc = parser.parseFromString('<xml>' + xml + '</xml>', 'text/xml');
  return doc;
}

function binaryToBase64 (bytes) {
  const b64 = [];
  const pageSize = 100000;
  for (let i = 0; i < bytes.length; i += pageSize) {
    b64.push(btoa(String.fromCharCode.apply(null, bytes.subarray(i, i + pageSize))));
  }
  return b64.join('');
}

function parseJpeg (bytes, readMetaOnly) {
  let c;
  let i = 0;
  const read = function() {
    return i < bytes.length ? bytes[i++] : -1;
  };

  if (read() != 0xff || read() != M_SOI) {
    return null;
  }
  const sections = [];
  while((c = read()) != -1) {
    if (c != 0xff) {
      return null;
    }
    while((c = read()) == 0xff) {
    }

    if (c == -1) {
      return null
    }
    const marker = c;
    if (marker == M_SOS) {
      // M_SOS indicates that image data will follow and no metadata after
      // that so read all data at one time.
      if (!readMetaOnly) {
        const section = {
          marker: marker,
          length: -1,
          data: bytes.subarray(i)
        };
        sections.push(section);
      }
      return sections;
    }
    const lh = read();
    const ll = read();
    if (lh == -1 || ll == -1) {
      return null;
    }
    const length = lh << 8 | ll;
    if (!readMetaOnly || c == M_APP1) {
      const section = {
        marker: marker,
        length: length,
        data: bytes.subarray(i, i + length - 2)
      };
      sections.push(section);
    }
    // Move i to end of section.
    i += length - 2;
  }
  return sections;
}

export default OdsConverter
