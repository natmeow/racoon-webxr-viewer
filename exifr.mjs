// Explicily import ES Module
import exifr from 'exifr/dist/full.esm.mjs' // to use ES Modules
import XmpMarker from 'xmp-marker'
import fs from 'fs'
import OdsConverter from './ods-converter.mjs'

const xmpMarker = new XmpMarker()

const image = fs.readFileSync('./upload.vr.jpg');
const converter = new OdsConverter()

const _ = (async () => {
  // __dirname +

  // const output = await exifr.parse('./upload.vr.jpg', { tiff: false, xmp: true, exif: false })
  //
  // console.log('output', output)

  // const markers = await xmpMarker.getMarkers('./upload.vr.jpg')
  //
  // markers.forEach(function(marker, index){
  //   console.log('marker #' + index);
  //   console.log('  content: ' + marker.content);
  //   console.log('  timecode: ' + marker.timecode);
  // });

  const arrayBuffer = image;
  converter.convert(arrayBuffer);

})()
