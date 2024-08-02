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

[`run.js`](#runner-file)

> The *run file*  
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

### Runner file

Configure the test parameters and what should be logged in the output:

```js
// run.js
import { Dyno, Table, Plot, prompt } from '@nicholaswmin/dyno'

// helpers
const toMB = bytes => parseInt(bytes / 1000 / 1000)
const round = num => Math.round((num + Number.EPSILON) * 100) / 100

const dyno = new Dyno({
  task: '.github/example/task.js',
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
  },

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
  })
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
