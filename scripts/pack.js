const zip = require('cross-zip')
const path = require('path')

zip.zipSync(path.resolve(__dirname, '../kuroshiro.bobplugin/'), path.join(process.cwd(), '/kuroshiro.bobplugin.zip'))