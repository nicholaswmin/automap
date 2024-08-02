import os from 'node:os'

import { Dyno, Table, Plot, prompt } from './lib/dyno/index.js'
import ioredis from './lib/ioredis/index.js'

const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const toMB = bytes => round(bytes / 1000 / 1000)
const redis = ioredis()

const dyno = new Dyno({
  task: './task.js',

  before: () => {
    return redis.flushall()
  },

  after: () => {
    return redis.disconnect()
  },
  
  render: function({ runner, threads }) {
    const threadCount = Object.keys(threads).length, maxThreadCount = 5

    const views = [
      new Table()
        .setHeading(...Object.keys(this.parameters))
        .addRowMatrix([ Object.values(this.parameters) ]),

      new Table()
        .setHeading('Tasks Sent', 'Tasks Acked', 'Memory (mb)')
        .addRowMatrix([
          [ 
            runner.sent.at(-1).count, 
            runner.replies.at(-1).count, 
            toMB(runner.memory.at(-1).mean) 
          ]
        ]),

      new Table(`Threads (mean/ms), top ${maxThreadCount} of ${threadCount}`)
        .setHeading('thread', 'task', 'save', 'fetch', 'latency', 'max backlog')
        .addRowMatrix(Object.keys(threads).map(thread => {
          return [
            thread,
            round(threads[thread]['task']?.at(-1).mean) || 'no data',
            round(threads[thread]['save']?.at(-1).mean) || 'no data',
            round(threads[thread]['fetch']?.at(-1).mean) || 'no data',
            round(threads[thread]['redis_ping']?.at(-1).mean) || 'no data',
            round(threads[thread]['backlog']?.at(-1).max) || 'no data',
          ]
        })
        .sort((a, b) => b[1] - a[1])
        .slice(0, maxThreadCount)),
    
      new Plot('Thread timings timeline', {
          subtitle: 'mean (ms)',
          properties: ['task', 'save', 'fetch'],
          unit: 'mean'
        })
        .plot(threads[Object.keys(threads).at(-1)])
    ]
    
    console.clear()

    views.forEach(view => console.log(view.toString()))  
  },

  parameters: await prompt({
    TASKS_SECOND: {
      configurable: true,
      type: Number,
      value: 50
    },
    
    THREAD_COUNT: {
      configurable: true,
      type: Number,
      value: process.env.WEB_CONCURRENCY || os.availableParallelism()
    },
    
    DURATION_SECONDS: {
      configurable: true,
      type: Number,
      value: 60
    },
    
    MAX_ITEMS: {
      configurable: false,
      type: Number,
      value: 100
    },
    
    PAYLOAD_KB: 5
  })
})

await dyno.start()
