import { join } from 'node:path'
import { availableParallelism } from 'node:os'
import { Dyno, Table, Plot } from '../../index.js'

const utils = {
  round: num => (Math.round((num + Number.EPSILON) * 100) / 100) || 'no data',
  bytesToMB: bytes => Math.ceil(bytes / 1000 / 1000)
}

const dyno = new Dyno({
  task: join(import.meta.dirname, 'task.js'),
  
  parameters: {
    configurable: {
      TASKS_SECOND: 100,
      THREAD_COUNT: availableParallelism(),
      TEST_SECONDS: 5,
  
      FOO: 10,
      BAR: 20
    },

    BAZ: 30
  },
  
  before: () => {
    console.log('test starting ...')
  },

  after: () => {
    console.log('test ended')
  },
  
  render: function({ runner, threads }) {
    const views = [
      new Table()
      .setHeading('Tasks Sent', 'Tasks Acked', 'Memory (mb)')
      .addRowMatrix([
        [ 
          runner.sent.at(-1).count, 
          runner.acked.at(-1).count, 
          utils.bytesToMB(runner.memory.at(-1).mean) 
        ]
      ]),

      new Table('Threads (mean/ms)')
      .setHeading('thread', 'task', 'fibonacci', 'sleep', 'max backlog')
      .addRowMatrix(Object.keys(threads).map(thread => {
        return [
          thread,
          utils.round(threads[thread]['task']?.at(-1).mean),
          utils.round(threads[thread]['fibonacci']?.at(-1).mean),
          utils.round(threads[thread]['sleep']?.at(-1).mean),
          utils.round(threads[thread]['backlog']?.at(-1).max)
        ]
      })
      .sort((a, b) => b[1] - a[1])),
      
      new Plot('Thread timings timeline', {
        subtitle: 'mean (ms)',
        properties: ['task', 'fibonacci', 'sleep'],
        unit: 'mean'
      })
      .plot(threads[Object.keys(threads).at(-1)])
    ]
    
    console.clear()

    views.forEach(view => console.log(view.toString()))
  }
})

await dyno.start()
