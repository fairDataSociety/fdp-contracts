const fs = require('fs')
const path = require('path')

const directory = process.argv[2]

fs.readdir(directory, (err, files) => {
  if (err) {
    throw err
  }

  files.forEach(file => {
    const sufixPos = file.indexOf('.sol')
    if (sufixPos < 0) {
      return
    }

    const newFilename = file.substring(0, sufixPos)

    console.log(path.join(directory, file), '=>', path.join(directory, newFilename))

    fs.rename(path.join(directory, file), path.join(directory, newFilename), err => {
      if (err) {
        throw err
      }
    })
  })
})
