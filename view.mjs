import EXIF from 'exif-js'

import { ExifImage } from 'exif'
import fs from 'fs'

// const self = {}

const getData = (image) => new Promise((resolve, reject) => {
  EXIF.getData(image, function() {

    resolve(this)

    // var make = EXIF.getTag(this, "Make");
    // var model = EXIF.getTag(this, "Model");
  })
})

// const getTag = async (image, tagName) => {
//   const data = await getData(image)
//
//   const tag = EXIF.getTag(data, tagName)
//
//   return tag
// }

const _ = (async () => {
  // __dirname +
  // const image = fs.readFileSync('./upload.vr.jpg');

  EXIF.enableXmp()

  const image = { src: 'https://firebasestorage.googleapis.com/v0/b/cardboardcameraoculusviewer.appspot.com/o/upload.vr.jpg?alt=media' }

  const data = await getData(image)

  console.log(EXIF.pretty(data))

  // const tag = EXIF.getTag(data, 'Make')
  //
  // console.log('tag', tag)
})()
