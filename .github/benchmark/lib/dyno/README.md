[![test-workflow][test-badge]][test-workflow]

# :wrench: dyno

runs code/tasks on separate threads and logs runtime measurements

## Usage

### Install

```bash
npm i https://github.com/nicholaswmin/automap.git
```

### Setup

To run a benchmark you need to create 2 separate files:

`run.js`

> The *run file*  
> Includes test configuration and runs the task file 

`task.js`

> The *task file*

> Includes the actual code under test

then run:

```bash
node run.js
```

## Example

Benchmarking a [`Fibonacci function`][fib] on 8 threads.

> A runnable version of this example can be found [here](#running-example)

### Task file

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
  // 'parameters' configured in the runner are available here

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

> **note:** measures must also be declared in the
> `fields.threads.tabular` field within the
> runner file, otherwise they won't appear in the output.\
> See below:

### Runner file

Configure the test parameters and what should be logged in the output:

```js
// run.js

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
  // where:
  // - `count`: number of times ticked
  // - `min`: minimum recorded value
  // - `max`: maximum recorder value
  // - `mean`: average of recorded values
  // - `stddev`: standard deviation between recorded values
  // 
  fields: {
    // Which parameters to log
    parameters: [
      ['parameters.PAYLOAD_KB', 'PAYLOAD_KB'],
      ['parameters.FOO', 'FOO']
    ],

    // General test fields

    // test statistics:
    runner: [
      ['sent.count', 'tasks sent'],
      ['replies.count', 'tasks acked'],
      ['memory.mean', 'memory (mean/mb)'],
      ['uptime.count', 'uptime seconds']
    ],

    // Per-task/thread fields

    threads: {
      // task/thread statistics:

      //  key by which the results are sorted (max value first, descending)
      sortby: 'task.mean',
      // Log:
      // - the overall task duration
      // - the `fibonacci` `min`/`max`/`mean` durations
      // - the `performance.measure('sleep')` max duration
      // - number of tasks sent but still unprocessed
      // ... all rounded to the nearest integer
      tabular: [
        ['task.mean', 'task (mean/ms)', round],
        ['fibonacci.min', 'fib() minimum (in ms)', Math.round],
        ['fibonacci.max', 'fib() maximum (in ms)', Math.round],
        ['fibonacci.mean', 'fib() average (in ms)', Math.round],
        ['sleep.max', 'sleep() maximum (in ms)', Math.round],
        ['backlog.max', 'max backlog']
      ],
      // include these average durations in the plot
      // note: the plot only logs the value 'mean' (average) and this
      // is non-configurable for now
      plotted: [ ['task'], ['fibonacci'], ['sleep'] ]
    }
  }
})

await dyno.start()
```

### Example output

```js

Runner stats
┌─────────┬────────────┬─────────────┬──────────────────┬────────────────┐
│ (index) │ tasks sent │ tasks acked │ memory (mean/mb) │ uptime seconds │
├─────────┼────────────┼─────────────┼──────────────────┼────────────────┤
│ 0       │ 459        │ 459         │ 9                │ 4              │
└─────────┴────────────┴─────────────┴──────────────────┴────────────────┘

Thread stats
┌─────────┬─────────┬────────────────┬───────────────────────┬───────────────────────┬───────────────────────┬─────────────────────────┬─────────────┐
│ (index) │ thread  │ task (mean/ms) │ fib() minimum (in ms) │ fib() maximum (in ms) │ fib() average (in ms) │ sleep() maximum (in ms) │ max backlog │
├─────────┼─────────┼────────────────┼───────────────────────┼───────────────────────┼───────────────────────┼─────────────────────────┼─────────────┤
│ 0       │ '44195' │ 6              │ 1                     │ 1                     │ 1                     │ 12                      │ 2           │
│ 1       │ '44200' │ 7              │ 1                     │ 1                     │ 1                     │ 12                      │ 2           │
│ 2       │ '44196' │ 6              │ 1                     │ 1                     │ 1                     │ 11                      │ 1           │
└─────────┴─────────┴────────────────┴───────────────────────┴───────────────────────┴───────────────────────┴─────────────────────────┴─────────────┘
... + 5 hidden rows



Task timings (mean/ms)

Legend: task, fibonacci, sleep

  9.00 ┼╮                                                           
  7.86 ┤│                                                           
  6.71 ┤│ ╭╮                                                        
  5.57 ┤╰─╯╰─╮╭╮╭────────────────────────────────────────────────── 
  4.43 ┤     ╰╯╰╯                                                   
  3.29 ┤                                                            
  2.14 ┤                                                            
  1.00 ┼─────────────────────────────────────────────────────────── 
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

log test coverage:

```bash
npm run test:coverage
```

> note: tests use the experimental native [`sqlite`][sqlite] module therefore
> they require node version `>= v22.5.1`

> note: these are slow tests

## Running example

You can run the [Fibonacci example](#example) via:

```bash
npm run example
```

it's code is [available here][example-code].

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
