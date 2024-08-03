[![test-workflow][test-badge]][test-workflow] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

run multithreaded benchmarks

* [Install](#install)
* [Quickstart](#quickstart)
* [Configuration](#configuration)
* [Simple example](#simple-example)
  + [Run file](#run-file)
  + [Task file](#task-file)
  + [Output](#output)
* [Advanced example](#advanced-example)
  + [Run file](#run-file-1)
  + [Task file](#task-file-1)
  + [Output](#output-1)
  + [Run example](#run-example)
* [Tests](#tests)
* [Authors](#authors)
* [License](#license)

## Install

```bash
npm i @nicholaswmin/dyno
```

## Quickstart

Create a sample, runnable benchmark

```bash 
npx init
```

> Use the sample benchmark as a starting point by editing `run.js` & `task.js`

### Run

> navigate into the created `benchmark` folder:

```bash
cd benchmark
```

> run it:

```bash
node run.js
```

## Configuration

A benchmark is comprised of 2 files:

[`run.js`](#run-file-1)

> The [run file](#run-file-1)
>
> Declares *test configuration*   

[`task.js`](#task-file-1)

> The [task file](#task-file-1)
>
> Declares the *code under test*.  

> The [Advanced Example](#advanced-example) includes detailed code comments
> on configuration, parameters, output etc ...

## Simple example

> Benchmark a `sleep()` function using [`performance.timerify`][timerify] on 
> 4 threads

### Run file

Declares: 

- test parameters  
- what measurements should be logged and how

Sets up the benchmark & internally controls the spawned threads.

```js
// run.js
import { join } from 'node:path'
import { Dyno, Table } from '@nicholaswmin/dyno'

const dyno = new Dyno({
  // declare the task file
  task: join(import.meta.dirname, 'task.js'),
  
  // declare the test parameters
  parameters: {
    configurable: {
      // required
      TASKS_SECOND: 100,
      TEST_SECONDS: 10,
      THREAD_COUNT: 4,
      
      // optional
      // don't set these too high, 
      // or each thread  will take too long to execute  
      // & immediately build a massive backlog
      SLEEP_CYCLES: 5,
      SLEEP_DURATION_MS: 4
    }
  },
  
  // render measurement output
  render: function({ runner, threads }) {
    const table = new Table('Threads (mean/ms)')
      .setHeading('thread', 'task', 'sleep', 'memory use (KB)', 'max backlog')
      .addRowMatrix(Object.keys(threads).map(thread => {
        return [
          thread,
          Math.round(threads[thread]['task']?.at(-1).mean)          || 'n/a',
          Math.round(threads[thread]['sleep']?.at(-1).mean)         || 'n/a',
          Math.round(threads[thread]['memory']?.at(-1).mean / 1000) || 'n/a',
          Math.round(threads[thread]['backlog']?.at(-1).max)        || 'n/a'
        ]
      }))

    console.clear()
    console.log(table.toString())
  }
})

await dyno.start()
```

### Task file

Declares: 

- The benchmarked *code/task*

The task file is run in its own isolated [V8 process][v8] 
`times x THREAD_COUNT`, concurrently, on separate threads.

Custom measurements can be taken using the following 
[Performance Measurement APIs][perf-api]:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]

```js
// task.js
import { task } from '@nicholaswmin/dyno'

task(async parameters => {
  const sleep = ms => new Promise(res => setTimeout(res, ms))
  const timerified_sleep = performance.timerify(sleep)
  
  for (let i = 0; i < parameters.SLEEP_CYCLES; i++)
    await timerified_sleep(parameters.SLEEP_DURATION_MS)
})
```

### Output

```js
+--------------------------------------------------------+
|                   Threads (mean/ms)                    |
+--------+------+-------+------------------+-------------+
| thread | task | sleep | used memory (KB) | max backlog |
+--------+------+-------+------------------+-------------+
|   9605 |   23 |     5 |             6677 |           3 |
|   9606 |   23 |     5 |             6672 |           4 |
|   9607 |   23 |     5 |             6653 |           5 |
|   9608 |   23 |     5 |             6500 |           1 |
+--------+------+-------+------------------+-------------+
```

## Advanced example

> **Example:**   
> Benchmark a [`fibonacci()` function][fib] and an `async sleep()` function  
>
> Include detailed timing measurements and a timeline plot

### Run file

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
  // All `key`/`value` pairs declared here 
  // are available in the task file
  parameters: {
    // user-configurable: 
    // you'll be prompted to edit these 
    // on startup, if needed
    configurable: {
      // required:
      TASKS_SECOND: 100,
      TEST_SECONDS: 5,
      THREAD_COUNT: availableParallelism(),

      // optional:
      FOO: 10,
      BAR: 20
    },
    
    // non-configurable,
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

### Task file 

```js
// task.js
import { task } from '@nicholaswmin/dyno'

task(async parameters => {
  // 'parameters' are configured in the run file 
  // are available here

  // function under test
  const fibonacci = n => n < 1 ? 0 : n <= 2
    ? 1 : fibonacci(n - 1) + fibonacci(n - 2)

  // use `performance.timerify`
  const timed_fibonacci = performance.timerify(fibonacci)

  timed_fibonacci(parameters.FOO)
  timed_fibonacci(parameters.BAR)
  timed_fibonacci(parameters.BAZ)

  // use `performance.measure`
  performance.mark('start')

  await new Promise(res => setTimeout(res, Math.round(Math.random() * 10) ))

  performance.mark('end')
  performance.measure('sleep', 'start', 'end')
})
```

### Output

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

### Run example

The above example can be run by:

```bash
npm run example
```

It's code is [available here][example-code].

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

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

## License

[MIT "No Attribution" License][license]

<!--- Badges -->

[test-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/test.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/test:unit.yml

[codeql-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml/badge.svg
[codeql-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml

<!--- General -->

[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/
[sqlite]: https://nodejs.org/api/sqlite.html
[cluster]: https://nodejs.org/api/cluster.html#cluster
[cluster-primary]: https://nodejs.org/api/cluster.html#how-it-works
[example-code]: .github/example
[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
