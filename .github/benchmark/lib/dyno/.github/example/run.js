import { Dyno, Table, Plot, prompt } from '../../index.js'

const toMB = bytes => parseInt(bytes / 1000 / 1000)
const round = num => Math.round((num + Number.EPSILON) * 100) / 100

const dyno = new Dyno({
  task: '.github/example/task.js',
  
  parameters: await prompt({
    TASKS_SECOND: 100,
    THREAD_COUNT: 8,
    DURATION_SECONDS: 5,

    FOO: 2,
    BAR: 5,
    BAZ: {
      value: 10,
      type: Number,
      configurable: true
    }
  }),
  
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
            runner.replies.at(-1).count, 
            toMB(runner.memory.at(-1).mean) 
          ]
        ]),

      new Table('Threads (mean/ms)')
        .setHeading('thread', 'task', 'fibonacci', 'sleep', 'max backlog')
        .addRowMatrix(Object.keys(threads).map(thread => {
          return [
            thread,
            round(threads[thread]['task']?.at(-1).mean) || 'no data',
            round(threads[thread]['fibonacci']?.at(-1).mean) || 'no data',
            round(threads[thread]['sleep']?.at(-1).mean) || 'no data',
            round(threads[thread]['backlog']?.at(-1).max) || 'no data'
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
