[![test-workflow][test-badge]][test-workflow]

# :stopwatch: dyno

run a piece of code on separate threads and log runtime measurements

## Usage

### Install

```bash
npm i https://github.com/nicholaswmin/automap.git
```

### Setup

```bash 
npx init
```

> creates a `./benchmark` folder which contains a runnable, sample benchmark.

A benchmark is comprised of 2 files:

[`run.js`](#runner-file)

> The [runner file](#runner-file)
>
> Declares *test configuration*   
> Edit this file with your own test configuration

[`task.js`](#task-file)

> The [task file](#task-file)
>
> Declares the *code under test*.  
> Edit this file with your own task/code

#### Run the benchmark

> navigate into the created `benchmark` folder:

```bash
cd benchmark
```

> run the benchmark:

```bash
node run.js
```

## Configuration

### Task file

The task file declares the benchmarked *code/task*.

Code declared here runs in its own isolated [V8][v8] process 
`times x THREAD_COUNT`.

Within the task file, custom measures can be taken using
these [PerformanceMeasurement APIs][perf-api]:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]

> **Example:**   
> Benchmark a [`fibonacci()` function][fib] and an `async sleep()` function

```js
// task.js
import { task } from '@nicholaswmin/dyno'

task(async parameters => {
  // 'parameters' configured in the runner are available here

  // function under test
  const fibonacci = n => n < 1 ? 0 : n <= 2
    ? 1 : fibonacci(n - 1) + fibonacci(n - 2)

  // measure using `performance.timerify`
  const timed_fibonacci = performance.timerify(fibonacci)

  timed_fibonacci(parameters.FOO)
  timed_fibonacci(parameters.BAR)
  timed_fibonacci(parameters.BAZ)

  // measure using `performance.measure`
  performance.mark('start')

  await new Promise(res => setTimeout(res, Math.round(Math.random() * 10) ))

  performance.mark('end')
  performance.measure('sleep', 'start', 'end')
})
```

### Runner file

Declares: 

- test parameters
- what should be logged in the output

```js
// run.js

import { join } from 'node:path'
import { availableParallelism } from 'node:os'
import { Dyno, Table, Plot } from '@nicholaswmin/dyno'

const dyno = new Dyno({
  // task file path
  task: join(import.meta.dirname, 'task.js'),

  // Test Parameters
  //
  // All `key`/`value` pairs declared here are available in the task file
  parameters: {
    // user-configurable parameters: 
    // you'll be prompted to edit these on startup, if needed
    configurable: {
      // required:
      TASKS_SECOND: 100,
      THREAD_COUNT: availableParallelism(),
      DURATION_SECONDS: 5,
      
      // optional:
      FOO: 10,
      BAR: 20
    },
    
    // non-configurable
    // optional:
    BAZ: 30
  },
  
  // hooks

  before: async parameters => {
    // runs before the benchmark starts
  },

  after: async parameters => {
    // runs after the benchmark ends
  },
  
  // Build and log an output
  //
  // `render` is called on every measurement capture,
  //  @ max-rate: `~ 15 fps`:
  render: function({ runner, threads }) {
    // Use `Table` & `Plot` to build an output from:
    //
    // - `runner` : last 100 Histograms of the main process per measure
    // - `threads`: last 100 Histograms of each thread per measure, 
    //              i.e: the task itself
    // 
    // Read: https://nodejs.org/api/perf_hooks.html#class-histogram  
    // for a list of available `Histogram` properties
    const views = [
      // Log last Histogram of specific measures, of main/runner
      // 
      // `runner` contains these default measures:
      //
      // - `sent`   : total count of tasks sent to a (random) thread
      // - `acked`  : total count of tasks acknowledged as received
      // - `memory` : `process.memoryUsage().heapUsed` values
      new Table()
      .setHeading('Tasks Sent', 'Tasks Acked', 'Memory (bytes)')
      .addRowMatrix([
        [ 
          runner.sent.at(-1).count, 
          runner.acked.at(-1).count, 
          runner.memory.at(-1).mean
        ]
      ]),

      // Log last Histogram of specific measures, for each thread
      // 
      // Each `threads[<pid>]` contains the last 100 Histograms 
      // for each of these default measures:
      //
      // - `task`   : thread's overall task execution duration
      // - `backlog`: thread's backlog of queued tasks, 
      //              sent to the thread but yet to be executed
      // - `memory` : thread's `process.memoryUsage().heapUsed` values
      // - `gc`     : thread's Garbage Collection cycles durations/count
      // 
      // ... plus any user-captured measures from the task file, 
      //     i.e: `performance.timerify()`, `performance.measure()` etc ...
      new Table('Threads (mean/ms)')
      .setHeading('thread', 'task', 'fibonacci', 'sleep', 'max backlog')
      .addRowMatrix(Object.keys(threads).map(thread => {
        return [
          thread,
          threads[thread]['task']?.at(-1).mean      || 'no data',
          threads[thread]['fibonacci']?.at(-1).mean || 'no data',
          threads[thread]['sleep']?.at(-1).mean     || 'no data',
          threads[thread]['backlog']?.at(-1).max    || 'no data'
        ]
      })
      // sort threads by their 'task.mean' value
      .sort((a, b) => b[1] - a[1])),
      
      // Plot a random threads `histogram.mean` values
      new Plot('Thread timings timeline', {
        subtitle: 'mean (ms)',
        properties: ['task', 'fibonacci', 'sleep'],
        unit: 'mean'
      })
      .plot(threads[Object.keys(threads).at(-1)])
    ]
    
    // log/render the output 

    console.clear()
    views.forEach(view => console.log(view.toString()))
  }
})

await dyno.start()
```

### Example output

```js
+------------+-------------+-------------+
| Tasks Sent | Tasks Acked | Memory (mb) |
+------------+-------------+-------------+
|        308 |         308 |           9 |
+------------+-------------+-------------+

+-------------------------------------------------+
|                Threads (mean/ms)                |
+--------+------+-----------+-------+-------------+
| thread | task | fibonacci | sleep | max backlog |
+--------+------+-----------+-------+-------------+
|  76553 | 7.35 |         1 |  7.37 |           1 |
|  76555 | 6.91 |         1 |     7 |           1 |
|  76557 | 6.91 |         1 |  6.81 |           1 |
|  76554 | 6.39 |         1 |   6.3 |           1 |
|  76558 | 6.33 |         1 |  6.27 |           1 |
|  76556 | 6.18 |         1 |  5.76 |           1 |
|  76551 |  5.3 |         1 |  5.23 |           2 |
|  76552 | 4.93 |         1 |     5 |           1 |
+--------+------+-----------+-------+-------------+


  Thread timings timeline

  -- task  -- fibonacci  -- sleep

  11.00 ┼╮                                             
  10.00 ┼╮                                             
   9.00 ┤│                                             
   8.00 ┤│╮                                            
   7.00 ┤╰───────────────╮────────╮                    
   6.00 ┤                ╰──────────────────────────╮─ 
   5.00 ┤                                           ╰  
   4.00 ┤                                              
   3.00 ┤                                              
   2.00 ┤                                              
   1.00 ┼───────────────────────────────────────────── 

  mean (ms)
```

## Tests

install deps:

```bash
npm ci
```

run tests:

```bash
npm test
```

log test coverage:

```bash
npm run test:coverage
```

> note: tests require node `>= v22.5.1` because they use the 
> experimental [`sqlite`][sqlite] module

> note: due to the benchmarking nature of this module, tests run slow

## Running example

You can run the [fibonacci benchmark](#configuration), using:

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

<!--- General -->

[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://nodejs.org/en/learn/getting-started/the-v8-javascript-engine
[sqlite]: https://nodejs.org/api/sqlite.html

[example-code]: .github/example
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
