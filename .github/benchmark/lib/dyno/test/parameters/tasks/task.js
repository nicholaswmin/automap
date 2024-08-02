// Basic task file
// simply adds a row to an SQLite3 DB

import * as url from 'node:url'
import path from 'node:path'
import fs from 'node:fs'

import { task } from '../../../index.js'

const __dirname = url.fileURLToPath(new URL('.', import.meta.url))
const filepath = path.join(__dirname, '../temp/params.json')

task(async parameters => {
  fs.writeFileSync(filepath, JSON.stringify(parameters), 'utf8')
})
