import os from 'node:os'

import { Dyno, Table, Plot } from './lib/dyno/index.js'
import ioredis from './lib/ioredis/index.js'

const redis = ioredis()
const utils = {
  round: num => (Math.round((num + Number.EPSILON) * 100) / 100) || 'no data',
  bytesToMB: bytes => Math.ceil(bytes / 1000 / 1000)
}

const dyno = new Dyno({
  task: './task.js',
  
  parameters: {
    configurable: {
      TASKS_SECOND: 100,
      THREAD_COUNT: +process.env.WEB_CONCURRENCY || os.availableParallelism(),
      DURATION_SECONDS: 10,
      
      MAX_ITEMS: 100,
      PAYLOAD_KB: 5
    }
  },

  before: () => redis.flushall(),
  after: () => redis.disconnect(),
  
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
          utils.bytesToMB(runner.memory.at(-1).mean) 
        ]
      ]),

      new Table(`Threads (mean/ms), top ${maxThreadCount} of ${threadCount}`)
      .setHeading('thread', 'task', 'save', 'fetch', 'latency', 'max backlog')
      .addRowMatrix(Object.keys(threads).map(thread => {
        return [
          thread,
          utils.round(threads[thread]['task']?.at(-1).mean),
          utils.round(threads[thread]['save']?.at(-1).mean) || 'no data',
          utils.round(threads[thread]['fetch']?.at(-1).mean) || 'no data',
          utils.round(threads[thread]['redis_ping']?.at(-1).mean) || 'no data',
          utils.round(threads[thread]['backlog']?.at(-1).max) || 'no data',
        ]
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, maxThreadCount)),
    
      new Plot('Thread timings timeline', {
        properties: ['task', 'save', 'fetch'],
        subtitle: 'mean (ms)',
        unit: 'mean'
      })
      .plot(threads[Object.keys(threads).at(-1)])
    ]
    
    process.argv.includes('--no-console-clear') ? 0 : console.clear()
    views.forEach(view => console.log(view.toString()))  
  }
})

await dyno.start()
