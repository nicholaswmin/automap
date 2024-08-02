[![test-workflow][test-badge]][test-workflow]

# :stopwatch: dyno

run a piece of code on separate threads and log runtime measurements

## Usage

### Install

```bash
npm i https://github.com/nicholaswmin/automap.git
```

### Setup

To run a benchmark you need to create 2 separate files:

[`run.js`](#runner-file)

> The *runner file*  
> Includes test configuration and runs the task file 

[`task.js`](#task-file)

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

Configure the test parameters and what should be logged in the output:

```js
// run.js
import { Dyno, Table, Plot, prompt } from '@nicholaswmin/dyno'

const dyno = new Dyno({
  // path of task file
  task: '.github/example/task.js',
  
  // Set the test parameters
  parameters: await prompt({
    // these are required
    TASKS_SECOND: 100,
    THREAD_COUNT: 8,
    DURATION_SECONDS: 5,
    
    // these are optional 
    FOO: 2,
    BAR: 5,

    // this parameter is user configurable
    // you'll be prompted to enter its value when the test starts
    BAZ: {
      // default value
      value: 10,
      type: Number,
      configurable: true
    }
  }),
  
  // before/after hooks
  before: () => {
    console.log('test starting ...')
  },

  after: () => {
    console.log('test ended')
  },
  
  // called on measurement update (max 30 fps)
  render: function({ runner, threads }) {
    // Use provided `Table` & `Plot` to build an output

    const views = [
      // Log general runner stats
      new Table()
        .setHeading('Tasks Sent', 'Tasks Acked', 'Memory (bytes)')
        .addRowMatrix([
          [ 
            runner.sent.at(-1).count, 
            runner.replies.at(-1).count, 
            runner.memory.at(-1).mean
          ]
        ]),

      // Log last stat for each thread
      new Table('Threads (mean/ms)')
        .setHeading('thread', 'task', 'fibonacci', 'sleep', 'max backlog')
        .addRowMatrix(Object.keys(threads).map(thread => {
          return [
            thread,
            threads[thread]['task']?.at(-1).mean || 'no data',
            threads[thread]['fibonacci']?.at(-1).mean || 'no data',
            threads[thread]['sleep']?.at(-1).mean || 'no data',
            threads[thread]['backlog']?.at(-1).max || 'no data'
          ]
        })
        // sort threads by 'task' mean duration
        .sort((a, b) => b[1] - a[1])),
      
      // Plot the mean durations of the last thread
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

run unit tests:

```bash
npm test
```

log test coverage:

```bash
npm run test:coverage
```

> note: tests require node version `>= v22.5.1` because they use the  
> experimental native [`sqlite`][sqlite] module to test thread output
>
> note: due to the benchmarking nature of this module, unit-tests run slow

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
