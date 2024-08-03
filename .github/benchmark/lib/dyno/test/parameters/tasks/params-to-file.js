// Basic task file
// adds a row to an SQLite3 DB
import { join } from 'node:path'
import fs from 'node:fs'

import { task } from '../../../index.js'

task(async parameters => {
  fs.writeFileSync(
    join(import.meta.dirname, '../temp/params.json'), 
    JSON.stringify(parameters), 
    'utf8'
  )
})
