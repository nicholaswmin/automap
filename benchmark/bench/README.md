[![test-workflow][test-workflow-badge]][ci-test]

# 🛠️ bench

Benchmarking using the [Performance Measurement API][perf-hooks], in
[Node.js][nodejs]

- [Installation](#install)
- [Usage](#usage)
   * [Running tasks](#running-tasks)
   * [Defining a task](#defining-a-task)
   * [Measuring](#capturing-measurements)
      + [durations with `performance.timerify`](#using-performancetimerify)
      + [durations with `performance.measure`](#using-performancemeasure)
      + [arbitrary values with `performance.mark`](#measuring-arbitrary-values)
   * [Displaying Results](#displaying-results)
      + [`runner.toHistograms()`](#runnertohistograms)
      + [`runner.toTimeline()`](#runnertotimeline)
      + [`runner.toEntries()`](#runnertoentries)
      + [`runner.toPlots()`](#runnertoplots)
   * [Accessing cycle info](#accessing-cycle-info)
- [Test](#test)
  * [Unit tests](#unit-tests)
  * [Test coverage](#run-test-coverage)

- [Authors](#authors)
- [License](#license)

## Install

```bash
npm i https://github.com/nicholaswmin/bench
```

## Usage

### Running tasks

```js
import { PerformanceRunner } from 'bench'

const runner = new PerformanceRunner()

// run 2 tasks
await runner.run([taskA, taskB])

// Print a duration histogram
runner.toHistograms()
```

### Defining a task

`runner.run(tasks)` accepts an array of tasks.

Each task is an object with:

- `name` : `String`  : Name of the task
- `cycle`: `Number`  : Number of times the task should run
- `fn`   : `Function`: The task function

#### Example

```js
const runner = new PerformanceRunner()

await runner.run([
  {
    name: 'Task A',
    cycles: 2,
    fn: function() {
      slowFunctionFoo()
      slowFunctionBar()
    }
  },

  {
    name: 'Task B',
    cycles: 10,
    fn: async function() {
      await slowAsyncFunctionBaz()
    }
  }

  // add more tasks ...
])

runner.toTimeline()
```

outputs a timeline with each task, the task cycles and their durations:

```text
┌──────────────┬─────────────────┬───────────┬──────────────────────────┐
│         type │            name │ value     │ detail                   │
├──────────────┼─────────────────┼───────────┼──────────────────────────┤
│       Task A │                 │           │                          │
|              |                 │           |                          |
│        cycle │        Task A 1 │ 9.86 ms   │                          │
│              │                 │           │                          │
│        cycle │        Task A 2 │ 9.36 ms   │                          │
│              │                 │           │                          │
│        cycle │        Task A 3 │ 9.1 ms    │                          │
│              |                 |           |                          |
|       Task B │                 │           │                          │
|              |                 │           |                          |
│        cycle │        Task B 1 │ 8.12 ms   │                          │
│              │                 │           │                          │
│        cycle │        Task B 2 │ 8.51 ms   │                          │
│              │                 │           │                          │
... and so on...
```

In the above Example

`Task A 2`:

is the *2nd* cycle of `"Task A"` which took *9.36 ms*

`Task B 1`:

is the *1st* cycle of `"Task B"` which took *8.12 ms*

## Capturing measurements

Ideally you'll be using the [Measurement API][perf-hooks] methods to capture
measurements of specific functions within each task.

The following [Performance Measurement][perf-hooks] methods are supported:

- [`performance.timerify`][timerify]
- [`performance.mark`][mark]
- [`performance.measure`][measure]

### Using `performance.timerify`

Use [`performance.timerify`][timerify] to wrap functions and automatically
track the function duration.

The tracked duration is displayed as part of the output.

#### Example

Tracking the duration of `saveInDB` and `user.greet` methods:

> Asssume `saveInDB` is an existing function which saves users in a database

```js
const runner = new PerformanceRunner()

// timerify `saveInDB()`
const saveInDBTimerified = performance.timerify(saveInDB)

await runner.run([
  {
    name: 'Task A',
    cycles: 2,
    fn: async () => {
      const user = new User()

      // use timerified `saveInDB()`
      await saveInDBTimerified(user)
  },

  {
    name: 'Task B',
    cycles: 5,
    fn: async () => {
      const user = new User()

      // timerify `user.greet`
      const userGreetTimerified = performance.timerify(user.greet)

      // use timerified `user.greet()`
      userGreetTimerified()

      // use timerified `saveInDB()`
      await saveInDBTimerified(user)
    }
  }
])

runner.toTimeline()
```

which outputs a timeline:

```text
┌──────────────┬─────────────────┬───────────┬──────────────────────────┐
│         type │            name │ value     │ detail                   │
├──────────────┼─────────────────┼───────────┼──────────────────────────┤
│       Task A │                 │           │                          │
|              |                 │           |                          |
│        cycle │        Task A 1 │ 9.86 ms   │                          │
│     function │            save │ 9.80 ms   │                          │
│              │                 │           │                          │
│        cycle │        Task A 2 │ 9.10 ms   │                          │
│     function │            save │ 8.90 ms   │                          │
|              |                 |           |                          |
|       Task B |                 |           |                          |
|              |                 |           |                          |
|     function |                 |           |                          |
│        cycle │        Task B 1 │ 8.12 ms   │                          │
│     function │      user.greet │ 5.10 ms   │                          │
│     function │            save │ 2.90 ms   │                          │
│              │                 │           │                          │
... and so on...
```

### Using `performance.measure`

Use [`performance.measure`][measure] to capture the time difference between
2 marks, set via [`performance.mark`][mark].

#### Example

Tracking the duration of `user.greet()` and `saveInDB`:

```js
const runner = new PerformanceRunner()

await runner.run([
  {
    name: 'Task A',
    cycles: 20,
    fn: async ({ cycle, taskname }) => {
      const user = new User()

      // start mark
      performance.mark('a')

      user.greet()

      await saveInDB(user)

      // end mark
      performance.mark('b')

      // capture time difference between `a` & `b`
      performance.measure('a-b', 'a', 'b')
    }
  },

  // rest of tasks ...
])

runner.toTimeline()
```

which outputs:

```text
┌──────────────┬─────────────────┬───────────┬──────────────────────────┐
│         type │            name │ value     │ detail                   │
├──────────────┼─────────────────┼───────────┼──────────────────────────┤
│       Task A │                 │           │                          │
|              |                 │           |                          |
│        cycle │        Task A 1 │ 9.86 ms   │                          │
│      measure │          a-to-b │ 5.10 ms   │                          │
│              │                 │           │                          │
│        cycle │        Task A 2 │ 8.10 ms   │                          │
│      measure │          a-to-b │ 4.35 ms   │                          │
|              |                 |           |                          |
|              |                 |           |                          |
|       Task B |                 |           |                          |
|              |                 |           |                          |
│        cycle │        Task B 1 │ 8.12 ms   │                          │
│      measure │          a-to-b │ 6.20 ms   │                          │
│              │                 │           │                          │
│        cycle │        Task B 2 │ 8.12 ms   │                          │
│      measure │          a-to-b │ 4.10 ms   │                          │
│              │                 │           │                          │
... and so on...
```

Generally speaking, you should prefer using `performance.timerify(fn)`
over this method.

### Measuring arbitrary values

Call [`performance.mark`][mark] and pass in the `detail` parameter an object
with these properties:

- `value`: `Number`: The tracked value, required
- `unit` : `String`: Used as a label, optional

##### Example

Tracking the memory usage of each cycle, then displaying it in a histogram:

```js
await runner.run([
{
  name: 'Task A',
  cycles: 5,
  fn: async () => {
    const memory = process.memoryUsage()
    const user = new User('foo')

    await saveInDB(user)

    performance.mark('memory-usage', {
      detail: {
        value: Math.ceil(memory.heapUsed / 1000 / 1000),
        unit: 'mb'
      }
    })
  }
},

{
  name: 'Task B',
  cycles: 10,
  fn: async () => {
    const memory = process.memoryUsage()
    const user = new User('bar')

    await saveInDB(user)

    performance.mark('memory-usage', {
      detail: {
        value: Math.ceil(memory.heapUsed / 1000 / 1000),
        unit: 'mb'
      }
    })
  }
])

runner.toHistograms()
```

which outputs:

```text
┌──────────────┬───────┬─────────┬─────────┬─────────┬─────────┬─────────┬───────────┬
│         name │ count │     min │     max │    mean │    50 % │    99 % │ deviation │
├──────────────┼───────┼─────────┼─────────┼─────────┼─────────┼─────────┼───────────┼
│        tasks │       │         │         │         │         │         │           │
│              │       │         │         │         │         │         │           │
│       Task B │    10 │ 0.04 ms │ 0.29 ms │ 0.17 ms │ 0.04 ms │ 0.29 ms │ 0.13 ms   │
│       Task A │     5 │ 0.05 ms │ 0.07 ms │ 0.06 ms │ 0.05 ms │ 0.07 ms │ 0.01 ms   │
│              │       │         │         │         │         │         │           │
│        entry │       │         │         │         │         │         │           │
│              │       │         │         │         │         │         │           │
│ memory-usage │    15 │ 11.2 mb │ 36.3 mb │ 22.1 mb │ 21.2 mb │   19 mb │   12 mb   │
└──────────────┴───────┴─────────┴─────────┴─────────┴─────────┴─────────┴───────────┴
```

### Displaying Results

The different ways of visualising measurements.

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
└──────────────┴───────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┴───────────┘
```

#### `runner.toTimeline()`

Produces a timeline of the cycles for each task

```text
┌──────────────┬─────────────────┬───────────┬──────────────────────────┐
│         type │            name │ value     │ detail                   │
├──────────────┼─────────────────┼───────────┼──────────────────────────┤
│       Task A │                 │           │                          │
|              |                 │           |                          |
│        cycle │        Task A 1 │ 9.86 ms   │                          │
│     function │            save │ 2.40 ms   │                          │
│              │                 │           │                          │
│        cycle │        Task A 2 │ 9.1 ms    │                          │
│     function │            save │ 3.12 ms   │                          │
|              |                 |           |                          |
|              |                 |           |                          |
|       Task B |                 |           |                          |
|              |                 |           |                          |
│        cycle │        Task B 1 │ 8.12 ms   │                          │
│     function │      user.greet │ 5.10 ms   │                          │
│     function │            save │ 2.90 ms   │                          │
│              │                 │           │                          │

... and so on ...
```

#### `runner.toEntries()`

Returns an array with all emitted [`PerformanceEntry`][perf-entry] entries
for each task.

#### `runner.toPlots()`

Draws ASCII charts of the max durations for each task and any timerified
functions:

```text
                                        Task: "A"

durations (ms)                      - main task  - fn: user.greet  - fn: save
╷
580.00 ┼                                                          ╭───────────
522.00 ┤                   ╭───────────────────╮                  │                    
464.00 ┤                   │                   │                  │                    
406.00 ┤                   │                   │                  │                    
348.00 ┤                   │                   ╰──────────────────╯                    
232.00 ┼-------------------╯
174.00 ┤                   │  
116.00 ┤                   │
58.00  ┤                   │  
0.00   ┼-----------------------------------------------------------------------
┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬────--
0   0   0   1   1   1   1   1   2   2   2   2   2   3   3   3   3   3   4    
                                                                         cycles
```

### Accessing cycle info

The `fn` callback is called with an object containing:

- `cycle`: The current cycle
- `taskname`: The task name

```js
runner.run([
  {
    name: 'Task A',
    cycles: 5,
    fn: async ({ cycle, taskname }) => {
      console.log(cycle)
      // '1' assuming it's the first cycle
      // '5' assuming it's the last cycle

      console.log(taskname)
      // 'Task A'
    }
  }
])
```

## Test

#### Install deps:

```bash
npm ci
```

#### Run Unit Tests:

```bash
npm test
```

#### Run test-coverage:

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
[nodejs]: https://nodejs.org/en
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#performancemeasurename-startmarkoroptions-endmark
[mark]: https://nodejs.org/api/perf_hooks.html#performancemarkname-options
[hgram]: https://en.wikipedia.org/wiki/Histogram
[perf-entry]: https://nodejs.org/api/perf_hooks.html#class-performanceentry
[nicholaswmin]: https://github.com/nicholaswmin
[mit-no-attr]: https://github.com/aws/mit-0
