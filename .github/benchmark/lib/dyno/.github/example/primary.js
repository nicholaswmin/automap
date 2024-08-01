import { Dyno, configure } from '../../index.js'

const toMB = bytes => parseInt(bytes / 1000 / 1000)

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
    parameters: [
      ['parameters.PAYLOAD_KB', 'PAYLOAD_KB']
    ],

    runner: [
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/mb)', toMB],
      ['uptime.count', 'uptime seconds']
    ],

    threads: {
      sortby: 'backlog.max',
      plotted: [ ['task'], ['fibonacci'], ['sleep'] ],
      tabular: [
        ['task.mean', 'task (mean/ms)', Math.round],
        ['fibonacci.min', 'fib() minimum (in ms)', Math.round],
        ['fibonacci.max', 'fib() maximum (in ms)', Math.round],
        ['fibonacci.mean', 'fib() average (in ms)', Math.round],
        ['sleep.max', 'sleep() maximum (in ms)', Math.round],
        ['backlog.max', 'max backlog']
      ]
    }
  }
})

await dyno.start()
