[![test-workflow][test-badge]][test-workflow]

# :wrench: dyno

runs code/tasks on separate threads and logs runtime measurements

## Usage

### Install

```bash
npm i https://github.com/nicholaswmin/automap.git
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

import { task } from '@nicholaswmin/dyno'

task(async parameters => {
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

  await new Promise(res => setTimeout(res, Math.round(Math.random() * 10) ))

  performance.mark('end')
  performance.measure('sleep', 'start', 'end')
})
```

> **note:** Measures must also be declared in the `fields` configuration in the
> primary file. See below:

#### Configuration file

Configure the test parameters and what should be logged in the output:

```js
// primary.js

import { Dyno, configure } from '@nicholaswmin/dyno'

const dyno = new Dyno({
  // path of the task file.
  task: './task.js',
  parameters: await configure({
    // Test parameters

    // tasks per second across all threads
    TASKS_SECOND: 100,
    // total num of threads, ideally = number of CPU cores
    THREAD_COUNT: 8,
    // total test duration
    DURATION_SECONDS: 5,

    // Custom parameters
    //
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
    // General test fields

    // test statistics:
    primary: [
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/bytes)'],
      ['uptime.count', 'uptime seconds']
    ],

    // Per-task fields

    threads: {
      // task statistics:

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

      // custom measures:
      //
      // any measures taken in the task must be declared here.
      measures: {
        labels: {
          // Log:
          // - the overall task duration
          // - the `fibonacci` `min`/`max`/`mean` durations
          // - the `performance.measure('sleep')` max duration
          // ... all rounded to the nearest integer
          logged: [
            ['task.mean'],
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

await dyno.start()
```

### Example output

```js
Test statistics:
┌─────────┬────────────┬─────────────┬─────────────────────┬────────────────┐
│ (index) │ tasks sent │ tasks acked │ memory (mean/bytes) │ uptime seconds │
├─────────┼────────────┼─────────────┼─────────────────────┼────────────────┤
│ 0       │ 426        │ 426         │ 10101.83            │ 8              │
└─────────┴────────────┴─────────────┴─────────────────────┴────────────────┘

Task statistics:
┌─────────┬─────────┬───────────┬────────────────────────┬─────────────┐
│ (index) │ thread  │ tasks run │ memory (mean/bytes)    │ max backlog │
├─────────┼─────────┼───────────┼────────────────────────┼─────────────┤
│ 0       │ '36334' │ 57        │ 10101.83               │ 8           │
│ 1       │ '36333' │ 54        │ 10202.94               │ 10          │
│ 2       │ '36335' │ 54        │ 10331.71               │ 3           │
└─────────┴─────────┴───────────┴────────────────────────┴─────────────┘

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

 Legend: task, fibonacci, sleep

   9.00 ┼╮
   8.47 ┤╰╮
   7.93 ┤ │
   7.40 ┤ │╭╮
   6.87 ┤ │││            ╭╮               ╭─╮──╮╭╮     ╭──
   6.33 ┤╭╮╯╰─╮   ╭──╮╭───╮╭╮──╮╭╮  ╭─────╯╯╰──────────╯
   5.80 ┤││   ╰─╭──╮╭─╯   ╰╯╰───────╯
   5.27 ┤││╭╮ ╭─╯  ╰╯
   4.73 ┤│╰╯╰─╯
   4.20 ┤│
   3.67 ┤│
   3.13 ┤│
   2.60 ┤│
   2.07 ┼╯
   1.53 ┤
   1.00 ┼─────────────────────────────────────────────────
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

> note: tests use the experimental native [`sqlite`][sqlite] module therefore
> they require node version `>= v22.5.1`

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
[sqlite]: https://nodejs.org/api/sqlite.html

[example-code]: .github/example
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
