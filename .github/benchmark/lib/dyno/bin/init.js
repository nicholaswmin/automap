#!/usr/bin/env node

import util from 'node:util'
import * as fs from 'node:fs/promises'

const location = '../../index.js' // or @nicholaswmin/dyno
const folder = './benchmark'
const files = [
  {
    path: `${folder}/run.js`,
    text: 
`
@ TODO
`
  },

  {
    path: `${folder}/task.js`,
    text: 
`
@ TODO
`
  },
  
  {
    path: `${folder}/README.md`,
    text: 
`
# benchmark

A benchmark of [this code][task], run via the [\`dyno\`][dyno-module] module

## Usage

> run the benchmark

\`\`\`bash
node run.js
\`\`\`

[task]: ./task.js
[dyno-module]: https://www.npmjs.com/package/@nicholaswmin/dyno
`
  }
]

try {
  await fs.rm(folder, { recursive: true, force: true })
  await fs.mkdir(folder)

  console.log('created:', folder)

  await Promise.all(
    files.map(file => fs.writeFile(file.path, file.text.trim(), 'utf8')
      .then(() => console.log('created:', file.path)))
  )

  console.log(util.styleText(['greenBright'], 'done!'))
} catch (err) {
  console.log('An error occured.', 'cleaning up ...')

  await fs.rm(folder, { recursive: true, force: true })
  
  throw err 
}
