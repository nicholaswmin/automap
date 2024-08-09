#!/usr/bin/env node

import path from 'node:path'
import { createExample } from './builder/index.js'
import { styleText } from 'node:util'

await createExample({
  srcFolder: './example',
  targetFolder: './benchmark',
  readmeFolder: path.resolve(import.meta.dirname, '../README.md'),
  entrypath: path.resolve(import.meta.dirname, '../index.js'),
  fragments: [
    { target: 'run.js'    },
    { target: 'task.js'   },
    { target: 'README.md' }
  ]
})

console.log(styleText(['green'], `Created example in: ./benchmark`))
