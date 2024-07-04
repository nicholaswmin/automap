[![test-workflow][test-workflow-badge]][ci-test]

# :watch: bench

Benchmarking using the [Performance Measurement API][perf-hooks]

- [Install](#install)
- [Usage](#usage)
   * [Running tasks](#running-tasks)
   * [Defining a task](#defining-a-task)
   * [Using the Performance Measure API](#using-the-performance-measure-api)
      + [Using `performance.timerify`](#using-performancetimerify)
      + [Using `performance.measure`](#using-performancemeasure)
      + [Capturing custom values](#capturing-custom-values)
   * [Displaying Results](#displaying-results)
      + [`runner.toHistograms()`](#runnertohistograms)
      + [`runner.toTimeline()`](#runnertotimeline)
      + [`runner.toEntries()`](#runnertoentries)
      + [`runner.toPlots()`](#runnertoplots)
   * [Accessing cycle info](#accessing-cycle-info)
- [Test](#test)
- [Authors](#authors)
- [License](#license)

## Install

```bash
npm i https://github.com/nicholaswmin/bench
```

## Usage

### Running tasks

```js
import { PerformanceRunner } from '@nicholaswmin/bench'

const runner = new PerformanceRunner()

// see below for task definition
await runner.run([taskA, taskB])

// produce a histogram of task durations
runner.toHistograms()
```

### Defining a task


`runner.run(tasks)` accepts an array of tasks, with each task having:

- `name`: Name of the task
- `cycle`: How many times to run the task
- `fn`: The task function

Example with 2 tasks:

```js
const runner = new PerformanceRunner()

await runner.run([
  {
    name: 'Task A',
    cycles: 10,
    fn: function() {
      slowFunctionFoo()
      slowFunctionBar()
    }
  },

  {
    name: 'Task B',
    cycles: 20,
    fn: async function() {
      await slowAsyncFunctionBaz()
    }
  }

  // add more tasks ...
])


// produce a histogram:
runner.toHistograms()

// or a timeline:
// runner.toTimeline()

// or a chart:
// runner.toPlots()
```

A more detailed example:

Hypotheticaly creating and saving a user in a DB,
then producing a *timeline* report:

```js
const runner = new PerformanceRunner()

await runner.run([
  {
    name: 'Task A',
    cycles: 10,
    fn: async () => {
      const user = new User()

      await save(user)
    }
  },

  {
    name: 'Task B',
    cycles: 20,
    fn: async () => {
      const user = new User()

      user.computeFibonacci()

      await save(user)
    }
  }
])

runner.toTimeline()
```

outputs:

```text
┌──────────────┬─────────────────┬───────────┬──────────────────────────┐
│         type │            name │ value     │ detail                   │
├──────────────┼─────────────────┼───────────┼──────────────────────────┤
│              │                 │           │                          │
│      Startup │                 │           │                          │
│              │                 │           │                          │
│          dns │             dns │ 1.05 ms   │ hostname=localhost       │
│          net │             net │ 1.27 ms   │ host=127.0.0.1 port=6379 │
│              │                 │           │                          │
│       Task A │                 │           │                          │
│       Task B │                 │           │                          |
|              |                 │           |                          |
│        cycle │        Task A 1 │ 9.86 ms   │                          │
│     function │            save │ 9.7 ms    │ --                       │
│           gc │              gc │ 0.42 ms   │ kind=1 flags=0           │
│              │                 │           │                          │
│        cycle │        Task A 2 │ 1.36 ms   │                          │
│     function │            save │ 1.31 ms   │ --                       │
│              │                 │           │                          │
│        cycle │        Task A 3 │ 0.8 ms    │                          │
│     function │            save │ 0.67 ms   │ --                       │

... and so on...
```

#### Notes:

- `Task A 2` is the *2nd* cycle of *"Task A"*, which took *1.31ms*
- `gc` is Garbage Collection cycle durations

### Using the Performance Measure API

Ideally, you'll be using the basic utilities from the Measurement API to
capture measurements for specific functions.

The following methods are supported:

- [`performance.timerify`][timerify]
- [`performance.mark`][mark]
- [`performance.measure`][measure]

#### Using `performance.timerify`

You can use [`performance.timerify`][timerify] to wrap functions which
automatically tracks the time spent running that function.

The tracked time is then displayed as part of the output.

##### Example:

Wrapping rapping the `save` and `user.computeFibonacci` functions:

```js
const runner = new PerformanceRunner()

// timerify `repo.save`
const saveTimerified = performance.timerify(repo.save.bind(repo))

await runner.run([
  {
    name: 'Task A',
    cycles: 10,
    fn: async () => {
      const user = new User()

      // use timerified `save`
      await saveTimerified(user)
  },

  {
    name: 'Task B',
    cycles: 20,
    fn: async () => {
      const user = new User()

      // timerify `user.computeFibonacci`
      const fibonacciTimerified = performance.timerify(user.computeFibonacci)

      // use timerified `user.computeFibonacci`
      fibonacciTimerified()

      // use timerified `save`
      await saveTimerified(user)
    }
  }
])

runner.toTimeline()
```

#### Using `performance.measure`

.. or use [`performance.measure`][measure] to capture the time difference
between 2 marks, set via [`performance.mark`][mark].

##### Example

Tracking the time to run `user.computeFibonacci()` using `performance.measure`:

```js
const runner = new PerformanceRunner()

const save = performance.timerify(repo.save.bind(repo))

await runner.run([
  // Task A...
  {
    name: 'Task A',
    cycles: 20,
    fn: async ({ cycle, taskname }) => {
      const user = new User()

      // create a starting mark
      performance.mark('a')

      user.computeFibonacci()

      // create an ending mark
      performance.mark('b')

      // capture the time difference measurement
      performance.measure('a-b', 'a', 'b')

      await save(user)
    }
  }
])

runner.toTimeline()
```

#### Capturing custom values

Use [`performance.mark`][mark] and pass a `value` and `unit` as the `detail`
parameter.

The values are accumulated, calculated and displayed as part of the output.

An example, tracking the size of the `user` object:

```js
{
  name: 'Task A',
  cycles: 5,
  fn: async () => {
    const user = new User('foo')

    const sizeKB = new Blob([JSON.stringify(user)]).size / 1000

    performance.mark('user-size-kb', {
      detail: { value: sizeKB, unit: 'kb' }
    })

    await save(user)
  }
},

{
  name: 'Task B',
  cycles: 10,
  fn: async () => {
    const user = new User('bar')

    const sizeKB = new Blob([JSON.stringify(user)]).size / 1000

    performance.mark('user-size-kb', {
      detail: { value: sizeKB, unit: 'kb' }
    })

    await save(user)
  }
},
```

### Displaying Results

The different ways of visualising the measurements.

#### `runner.toHistograms()`

Produces a [histogram][hgram] with `min`/`mean`/`max` and `percentiles` for
each measurement:

```text
┌──────────────┬───────┬───────────┬───────────┬───────────┬───────────┬───────────┬───────────┬───────────┐
│         name │ count │       min │       max │      mean │      50_% │      75_% │     100_% │ deviation │
├──────────────┼───────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────┼───────────┤
│              │       │           │           │           │           │           │           │           │
│        tasks │       │           │           │           │           │           │           │           │
│              │       │           │           │           │           │           │           │           │
│       Task A │    40 │ 292.55 ms │ 544.74 ms │ 333.63 ms │ 308.81 ms │ 341.31 ms │ 544.21 ms │  56.87 ms │
│       Task B │    25 │   0.14 ms │   9.99 ms │   0.82 ms │   0.32 ms │   0.45 ms │   9.98 ms │    1.9 ms │
│              │       │           │           │           │           │           │           │           │
│     measures │       │           │           │           │           │           │           │           │
│              │       │           │           │           │           │           │           │           │
│       a-to-b │    40 │     30 ms │     32 ms │  31.18 ms │     31 ms │     32 ms │     32 ms │   0.63 ms │
│              │       │           │           │           │           │           │           │           │
│       vitals │       │           │           │           │           │           │           │           │
│              │       │           │           │           │           │           │           │           │
│ loop latency │   224 │   0.65 ms │ 381.94 ms │  82.15 ms │  11.02 ms │  12.66 ms │ 381.68 ms │ 124.87 ms │
└──────────────┴───────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

#### `runner.toTimeline()`

Produces a timeline of the cycles for each task

```text
┌──────────────┬─────────────────┬───────────┬──────────────────────────┐
│         type │            name │ value     │ detail                   │
├──────────────┼─────────────────┼───────────┼──────────────────────────┤
│              │                 │           │                          │
│      Startup │                 │           │                          │
│              │                 │           │                          │
│          dns │             dns │ 1.05 ms   │ hostname=localhost       │
│          net │             net │ 1.27 ms   │ host=127.0.0.1 port=6379 │
│              │                 │           │                          │
│       Task A │                 │           │                          │
│       Task B │                 │           │                          |
|              |                 │           |                          |
│        cycle │        Task A 1 │ 9.86 ms   │                          │
│     function │            save │ 9.7 ms    │ --                       │
│           gc │              gc │ 0.42 ms   │ kind=1 flags=0           │
│              │                 │           │                          │
│        cycle │        Task A 2 │ 1.36 ms   │                          │
│     function │            save │ 1.31 ms   │ --                       │
│              │                 │           │                          │
│        cycle │        Task A 3 │ 0.8 ms    │                          │
│     function │            save │ 0.67 ms   │ --                       │

... and so on ...
```


#### `runner.toEntries()`

Returns an array with all captured [`PerformanceEntry`][perf-entry] items for
each task.


#### `runner.toPlots()`

Draws charts of max durations for each task and their timerified functions:

```text
                                        Task: "A"

durations (ms)       - main task  - fn: user.computeFibonacci  - fn: save
╷
580.00 ┼                                                          ╭───────────
522.00 ┤                   ╭───────────────────╮                  │                    
464.00 ┤                   │                   │                  │                    
406.00 ┤                   │                   │                  │                    
348.00 ┤                   │                   ╰──────────────────╯                    
232.00 ┼-------------------╯
174.00 ┤                     
116.00 ┤                    
58.00  ┤                     
0.00   ┼-----------------------------------------------------------------------
┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬────--
0   0   0   1   1   1   1   1   2   2   2   2   2   3   3   3   3   3   4    
                                           cycles
```

### Accessing cycle info

The `fn` callback is called with an object containing:

- `cycle`: The current cycle
- `taskname`: The task name

An example:

```js
runner.run([
  {
    name: 'Task A',
    cycles: 5,
    fn: async ({ cycle, taskname }) => {
      // logs '5', if this is the last cycle
      console.log(cycle)

      // logs 'Task A'
      console.log(taskname)
    }
  }
])
```

## Test

clean install all deps:

```bash
npm ci
```

run unit tests:

```bash
npm test
```

run unit-tests and produce a test-coverage report:

```bash
npm run test-cov
```

## Authors

[@nicholaswmin][nicholaswmin]

## License

>
> MIT "No attribution" License
>
> Copyright 2024  
> Nicholas Kyriakides
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"),
> to deal in the Software without restriction, including without limitation the
> rights to use, copy, modify, merge, publish, distribute, sublicense,
> and/or sell copies of the Software, and to permit persons to whom the
> Software is furnished to do so.


[test-workflow-badge]: https://github.com/nicholaswmin/bench/actions/workflows/tests.yml/badge.svg
[ci-test]: https://github.com/nicholaswmin/bench/actions/workflows/tests.yml

[perf-hooks]: https://nodejs.org/api/perf_hooks.html
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#performancemeasurename-startmarkoroptions-endmark
[mark]: https://nodejs.org/api/perf_hooks.html#performancemarkname-options
[hgram]: https://en.wikipedia.org/wiki/Histogram
[perf-entry]: https://nodejs.org/api/perf_hooks.html#class-performanceentry
[nicholaswmin]: https://github.com/nicholaswmin
[mit-no-attr]: https://github.com/aws/mit-0
