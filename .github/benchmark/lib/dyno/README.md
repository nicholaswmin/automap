[![test-workflow][test-badge]][test-workflow]

# :wrench: dyno

A multithreaded benchmarker

## Usage

To run a benchmark you need 2 separate files:

`primary.js`

Mostly sets up the configuration for the test:

`task.js`

### Configuration

An example setup, benchmarking a `Fibonacci` function on 4 threads:

```js
// primary.js

import { Dyno, configure } from '@nicholaswmin/dyno'

const dyno = new Dyno({
  // path of the task file
  task: './task.js',
  // Test parameters
  parameters: await configure({
    // required parameters:

    // tasks per second across all threads
    TASKS_SECOND: 100,
    // total num of threads, ideally = number of CPU cores
    THREAD_COUNT: 4,
    // total test duration
    DURATION_SECONDS: 5,

    // optional paramters:

    FOO_PAMETER: {
      // if value of parameter is in the following format,
      // the user will be promted to tweak/edit it on startup
      type: Number,
      value: 20,
      configurable: true
    },
    // non-user-configurable, use as-is:
    BAR_PARAMETER: 50
  }),

  // What to include in the report print-out, in this format:
  // [<metric-name>, <human-readable-name>, <transformer-function>]
  //
  // const fibonacci = n => { ... }
  // performance.timerify(fibonacci)
  //
  // you need to declare it here in this format:
  //
  fields: {
    threads: {
      stats: {
        sortby: 'foo.min',
        labels: {
          logged: [
            ['fibonacci.min', 'fibonacci minimum: (in ms)', Math.round],
            ['fibonacci.max', 'fibonacci maximum: (in ms)', Math.round],
          ]
        }
      }
    }
  }
})

// start the dyno
await dyno.start()
```

The task file, where code that needs to be benchmarked runs.

This file runs in its own process `times x THREAD_COUNT`

```js
// task.js

import { thread } from '@nicholaswmin/dyno'

thread(parameters => {
  // - parameters configured in primary are available here

  // function under test
  const fibonacci = n => n < 1 ? 0 : n <= 2
    ? 1 : fibonacci(n - 1) + fibonacci(n - 2)

  // can be timerified using native `performance.timerify`
  const timed_fibonacci = timerify(fibonacci)

  timed_fibonacci(10)  // recorded a run
  timed_fibonacci(10)  // recorded another run
})
```

### Example output

```console
┌─────────┬────────────┬─────────────┬──────────────────┬────────────────┐
│ (index) │ tasks sent │ tasks acked │ memory (mean/mb) │ uptime seconds │
├─────────┼────────────┼─────────────┼──────────────────┼────────────────┤
│ 0       │ 426        │ 426         │ 11.22            │ 8              │
└─────────┴────────────┴─────────────┴──────────────────┴────────────────┘
┌─────────┬─────────┬───────────┬──────────────────┬─────────────┐
│ (index) │ thread  │ tasks run │ memory (mean/mb) │ max backlog │
├─────────┼─────────┼───────────┼──────────────────┼─────────────┤
│ 0       │ '36334' │ 57        │ 10.83            │ 3           │
│ 1       │ '36333' │ 54        │ 10.94            │ 1           │
│ 2       │ '36335' │ 54        │ 10.71            │ 1           │
└─────────┴─────────┴───────────┴──────────────────┴─────────────┘
┌─────────┬─────────┬────────────────┬───────────────────┬─────────────────┬────────────────┐
│ (index) │ thread  │ task (mean/ms) │ latency (mean/ms) │ fetch (mean/ms) │ save (mean/ms) │
├─────────┼─────────┼────────────────┼───────────────────┼─────────────────┼────────────────┤
│ 0       │ '36333' │ 3.44           │ 1.11              │ 1.54            │ 1.63           │
│ 1       │ '36335' │ 3.44           │ 1                 │ 1.72            │ 1.81           │
│ 2       │ '36334' │ 3.14           │ 1                 │ 1.49            │ 1.63           │
└─────────┴─────────┴────────────────┴───────────────────┴─────────────────┴────────────────┘
.. + 5 hidden threads



 Task timings (mean/ms)

 Legend: task, latency, fetch, save

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

> note: these are slowwww tests

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

## License

[MIT "No Attribution" License][license]

<!--- Badges -->

[test-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/test.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/test:unit.yml

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
