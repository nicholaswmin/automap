[![test-workflow][test-badge]][test-workflow]

# :wrench: dyno

runs code/tasks on separate threads and logs runtime measurements

## Usage

### Install

```bash
npm i @nicholaswmin/dyno
```

### Setup

To run a benchmark you need 2 separate files:

`primary.js`

> Includes test configuration and runs the task file

`task.js`

> Includes the actual code under test

then run:

```bash
node primary.js
```

### Example

Benchmarking a [`Fibonacci function`][fib] on 8 threads.

You can run this example via:

```bash
npm run example
```

it's code is [available here][example-code].

#### Task file

The task file declares the *task* that needs to be benchmarked.

Code declared here runs in its own isolated [V8][v8]
process `times x THREAD_COUNT`.

Within the task file, measures can be taken using
these [PerformanceMeasurement APIs][perf-api]:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]

```js
// task.js

import { thread } from '@nicholaswmin/dyno'

thread(async parameters => {
  // 'parameters' configured in the primary are available here

  // function under test
  const fibonacci = n => n < 1 ? 0 : n <= 2
    ? 1 : fibonacci(n - 1) + fibonacci(n - 2)

  // can be timerified using `performance.timerify`
  const timed_fibonacci = performance.timerify(fibonacci)

  timed_fibonacci(parameters.FOO)
  timed_fibonacci(parameters.BAR)
  timed_fibonacci(parameters.BAZ)

  // Measure something using `performance.measure`
  performance.mark('start')

  await new Promise(resolve => setTimeout(resolve, 100))

  performance.mark('end')
  performance.measure('sleep', 'start', 'end')
})
```

> **note:** Measures must also be declared in the `fields` configuration in the
> primary file. See below:

#### Configuration file

Configure the test parameters and what needs to be logged in the report

```js
// primary.js

import { Dyno, configure } from '@nicholaswmin/dyno'

const dyno = new Dyno({
  // path of the task file.
  // Required.
  task: './task.js',
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
        // sort by min duration, descending
        sortby: 'foo.min',
        labels: {
          // also include its average duration in the plot
          plotted: [ ['task'], ['fibonacci'] ],
          // Log:
          // - the overall task duration
          // - the `fibonacci` `min`/`max`/`mean` durations
          // - the `performance.measure('sleep')` max duration
          // .. all rounded to nearest integer
          logged: [
            ['task.mean'],
            ['fibonacci.min', 'fib() minimum (in ms)', Math.round],
            ['fibonacci.max', 'fib() maximum (in ms)', Math.round],
            ['fibonacci.mean', 'fib() average (in ms)', Math.round],
            ['sleep.max', 'sleep() maximum (in ms)', Math.round ]
          ]
        }
      }
    }
  }
})

// start the dyno
await dyno.start()
```

### Example output

```console
Test statistics:
┌─────────┬────────────┬─────────────┬──────────────────┬────────────────┐
│ (index) │ tasks sent │ tasks acked │ memory (mean/mb) │ uptime seconds │
├─────────┼────────────┼─────────────┼──────────────────┼────────────────┤
│ 0       │ 426        │ 426         │ 11.22            │ 8              │
└─────────┴────────────┴─────────────┴──────────────────┴────────────────┘

Task statistics:
┌─────────┬─────────┬───────────┬──────────────────┬─────────────┐
│ (index) │ thread  │ tasks run │ memory (mean/mb) │ max backlog │
├─────────┼─────────┼───────────┼──────────────────┼─────────────┤
│ 0       │ '36334' │ 57        │ 10.83            │ 3           │
│ 1       │ '36333' │ 54        │ 10.94            │ 1           │
│ 2       │ '36335' │ 54        │ 10.71            │ 1           │
└─────────┴─────────┴───────────┴──────────────────┴─────────────┘

Task measurements:
┌─────────┬─────────┬────────────────┬───────────────────────┬───────────────────────┬───────────────────────────┐
│ (index) │ thread  │ task (mean/ms) │ fib() minimum (in ms) │ fib() average (in ms) │ sleep() maximum (in ms)   │
├─────────┼─────────┼────────────────┼───────────────────────┼───────────────────────┼───────────────────────────┤
│ 0       │ '36333' │ 3.44           │ 1.11                  │ 1.54                  │ 100.13                    │
│ 1       │ '36335' │ 3.44           │ 1                     │ 1.72                  │ 103.81                    │
│ 2       │ '36334' │ 3.14           │ 1                     │ 1.49                  │ 101.63                    │
└─────────┴─────────┴────────────────┴───────────────────────┴───────────────────────┴───────────────────────────┘
.. + 5 hidden threads


 Task measurement timeline (ms)

 Legend: - task  - fibonacci  - sleep

  12.00 ┼╮
  11.27 ┤│
  10.53 ┤│
   9.80 ┤│
   9.07 ┤│
   8.33 ┤╰╮
   7.60 ┼╮│
   6.87 ┤││
   6.13 ┤│╰╮
   5.40 ┤│ ╰╮
   4.67 ┤╰╮ ╰──╮
   3.93 ┼╮╰╮   ╰──────────╮                                          ╭─
   3.20 ┤╰╮╰─╮            ╰──────────────────────────────────────────╯
   2.47 ┤ ╰─╮╰───────╮
   1.73 ┤   ╰──────────────────────────────────────────────────────────
   1.00 ┼─────────────────────────────────────────────────────────────
```

## Tests

install deps:

```bash
npm ci
```

run unit tests:

```bash
npm test
```

> note: these are slow tests

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

## License

[MIT "No Attribution" License][license]

<!--- Badges -->

[test-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/test.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/test:unit.yml

<!--- General Refs -->

[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://nodejs.org/en/learn/getting-started/the-v8-javascript-engine

[example-code]: ./github/example
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
