
import { Dyno, configure } from '../../index.js'

const dyno = new Dyno({
  task: '.github/example/task.js',
  parameters: await configure({
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

  fields: {
    primary: [
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/bytes)'],
      ['uptime.count', 'uptime seconds']
    ],

    threads: {
      stats: {
        sortby: 'backlog.max',
        labels: {
          logged: [
            ['task.count', 'tasks run'],
            ['memory.mean', 'memory (mean/bytes)'],
            ['backlog.max', 'max backlog']
          ]
        }
      },

      measures: {
        sortby: 'task.mean',
        labels: {
          logged: [
            ['task.mean', 'task (mean/ms)', Math.round],
            ['fibonacci.min', 'fib() minimum (in ms)', Math.round],
            ['fibonacci.max', 'fib() maximum (in ms)', Math.round],
            ['fibonacci.mean', 'fib() average (in ms)', Math.round],
            ['sleep.max', 'sleep() maximum (in ms)', Math.round]
          ],
          plotted: [ ['task'], ['fibonacci'], ['sleep'] ]
        }
      }
    }
  }
})

await dyno.start()
