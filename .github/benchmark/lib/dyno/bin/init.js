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
import { join } from 'node:path'
import { availableParallelism } from 'node:os'
import { Dyno, Table, Plot } from '${location}'

const dyno = new Dyno({
  task: join(import.meta.dirname, 'task.js'),

  parameters: {
    configurable: {
      TASKS_SECOND: 100,
      DURATION_SECONDS: 10,
      THREAD_COUNT: availableParallelism(),
      FOO: 10
    },
    BAR: 20
  },

  render: function({ runner, threads }) {
    const views = [
      new Table()
      .setHeading('Tasks Sent', 'Tasks Acked', 'Memory (MB)')
      .addRowMatrix([
        [ 
          runner.sent.at(-1).count, 
          runner.acked.at(-1).count, 
          Math.round(runner.memory.at(-1).mean / 1000 / 1000)
        ]
      ]),

      new Table('Threads (mean/ms). Showing top 5, sorted by: task.mean')
      .setHeading('thread', 'task', 'sleep', 'max backlog')
      .addRowMatrix(Object.keys(threads).map(thread => {
        return [
          thread,
          Math.round(threads[thread]['task']?.at(-1).mean)   || 'no data',
          Math.round(threads[thread]['sleep']?.at(-1).mean)  || 'no data',
          Math.round(threads[thread]['backlog']?.at(-1).max) || 'no data',
        ]
      })
      .sort((a, b) => b[1] - a[1]).slice(0, 5)),

      new Plot('Thread timeline', {
        properties: ['task', 'sleep'],
        subtitle: 'mean (ms)'
      })
      .plot(threads[Object.keys(threads).at(-1)])
    ]
    
    console.clear()
    views.forEach(view => console.log(view.toString()))
  },
  
  before: async () => {},
  after: async () => {}
})

await dyno.start()
`
  },

  {
    path: `${folder}/task.js`,
    text: 
`
import { task } from '${location}'
  
// eslint-disable-next-line no-unused-vars
task(async parameters => {
  // test parameters available here

  const sleep = () => new Promise(res => setTimeout(res, Math.random() * 10))
  const t_sleep = performance.timerify(sleep)
  
  for (let i = 0; i < 5; i++)
    await t_sleep()
})
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
