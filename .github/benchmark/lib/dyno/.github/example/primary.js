
import { Dyno, configure } from '../../index.js'

const dyno = new Dyno({
  // path of the task file.
  // Required.
  task: '.github/example/task.js',
  parameters: await configure({
    // Required:

    // tasks per second across all threads
    TASKS_SECOND: 100,
    // total num of threads, ideally = number of CPU cores
    THREAD_COUNT: 8,
    // total test duration
    DURATION_SECONDS: 5,

    // Optional:
    // Note: you can access these parameters in your task file

    FOO: 2,
    BAR: 5,
    BAZ: {
      // Optional:
      // Declare a parameter as user-configurable on startup.
      // You'll be prompted to tweak it when the test starts:
      value: 10,
      type: Number,
      configurable: true
    }
  }),


  // Declare what should be included in the output, in this format:
  //
  // `[<metric-name>.<metric.unit>, <human-readable-name>, <transformer-function>]`
  //
  // Note:
  // `<metric-unit>` can by any of: `count`, `min`, `max`, `mean`, `stddev`
  // Read more: https://nodejs.org/api/perf_hooks.html#class-histogram
  fields: {
    // General fields:
    // Required

    // General test statistics:
    primary: [
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/bytes)'],
      ['uptime.count', 'uptime seconds']
    ],

    // Per-task fields

    threads: {
      // General task statistics.
      // Optional.
      stats: {
        sortby: 'max backlog',
        labels: {
          logged: [
            // Log:
            // - the tasks run by all threads
            // - memory usage average
            // - number of tasks sent but still unprocessed
            ['task.count', 'tasks run'],
            ['memory.mean', 'memory (mean/bytes)'],
            ['backlog.max', 'max backlog']
          ]
        }
      },

      // Custom task measures.
      // Required.
      // Any measures taken in the task must be declared here.
      measures: {
        labels: {
          // Log:
          // - the overall task duration
          // - the `fibonacci` `min`/`max`/`mean` durations
          // - the `performance.measure('sleep')` max duration
          // ... all rounded to the nearest integer
          logged: [
            ['task.mean', 'task (mean/ms)', Math.round],
            ['fibonacci.min', 'fib() minimum (in ms)', Math.round],
            ['fibonacci.max', 'fib() maximum (in ms)', Math.round],
            ['fibonacci.mean', 'fib() average (in ms)', Math.round],
            ['sleep.max', 'sleep() maximum (in ms)', Math.round]
          ],
          // include these average durations in the plot
          // note: the plot only logs the value 'mean' (average) and this
          // is non-configurable for now
          plotted: [ ['task'], ['fibonacci'], ['sleep'] ]
        }
      }
    }
  }
})

// start the dyno
await dyno.start()
