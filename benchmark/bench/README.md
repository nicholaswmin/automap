[![test-workflow][test-workflow-badge]][ci-test]

# 🛠️ bench

Benchmarking using the [Performance Measurement API][perf-hooks], in
[Node.js][nodejs]

- [Install](#install)
- [Usage](#usage)
   * [Run tasks](#running-tasks)
   * [Define a task](#defining-a-task)
   * [Take measurements](#capturing-measurements)
      + [time durations with `performance.timerify`](#using-performancetimerify)
      + [time durations with `performance.measure`](#using-performancemeasure)
      + [generic values with `performance.mark`](#measuring-arbitrary-values)
   * [Display Results](#displaying-results)
      + [`runner.toTimeline()`](#runnertotimeline)
      + [`runner.toHistograms()`](#runnertohistograms)
      + [`runner.toEntries()`](#runnertoentries)
      + [`runner.toPlots()`](#runnertoplots)
   * [Access cycle info](#accessing-cycle-info)
- [Test](#test)
  * [Unit tests](#run-unit-tests)
  * [Test coverage](#run-test-coverage)
- [Authors](#authors)
- [License](#license)

## Install

```bash
npm i https://github.com/nicholaswmin/bench
```

## Usage

### Running tasks

Run 2 tasks and print a [histogram][hgram] of the durations:

```js
import { PerformanceRunner } from 'bench'

const runner = new PerformanceRunner()

await runner.run([taskA, taskB])

runner.toHistograms()
```

### Defining a task

`runner.run(tasks)` accepts an array of tasks.

Each task is an object with:

| property    | type   	    | description                                     |
|-----------	|-------------|-----------------------------------------------	|
| `name`  	  | `String`   	| Name of the task, required          	          |
| `cycle` 	  | `Number`   	| Number of times the task should run, required 	|
| `fn`    	  | `Function` 	| The task function, required                    	|

#### Example

```js
const runner = new PerformanceRunner()

await runner.run([
  {
    name: 'A',
    cycles: 2,
    fn: function() {
      slowFunctionFoo()
      slowFunctionBar()
    }
  },

  {
    name: 'B',
    cycles: 3,
    fn: async function() {
      await slowAsyncFunctionBaz()
    }
  }
])

runner.toTimeline()
```

This outputs:

- a timeline with each task
- each task's cycles
- their durations in milliseconds

```text   
┌─────────┬──────┬───────────┐
│    type │ name │ value     │
├─────────┼──────┼───────────┤
│ Task: A │      │           │
│         │      │           │
│   cycle │  A 1 │ 501.25 ms │
│         │      │           │
│   cycle │  A 2 │ 250.95 ms │
│         │      │           │
│         │      │           │
│ Task: B │      │           │
│         │      │           │
│   cycle │  B 1 │ 250.55 ms │
│         │      │           │
│   cycle │  B 2 │ 121.10 ms │
│         │      │           │
│   cycle │  B 3 │ 193.12 ms │
│         │      │           │
└─────────┴──────┴───────────┘
```

## Capturing measurements

The total durations of each task cycle and the overall duration of the task
itself are captured automatically.

On top of that, it's likely you'd also want to capture the durations of
*specific* functions or steps within each task, so you can figure out where
most of the time is spent.

In this case, you can use the following [Performance Measurement][perf-hooks]
methods:

- [`performance.timerify`][timerify]
- [`performance.mark`][mark]
- [`performance.measure`][measure]

### Using `performance.timerify`

Use [`performance.timerify`][timerify] to wrap functions and automatically
track the function duration.

The tracked duration is displayed as part of the output.

#### Example

Tracking the duration of `save` and `user.greet` methods:

> Asssume `save` is an existing function which saves users in a database

```js
const runner = new PerformanceRunner()

// timerify `save()`
const saveTimerified = performance.timerify(save)

await runner.run([
  {
    name: 'A',
    cycles: 2,
    fn: async () => {
      const user = new User()

      // use timerified `save()`
      await saveTimerified(user)
    }
  },

  {
    name: 'B',
    cycles: 3,
    fn: async () => {
      const user = new User()

      // timerify `user.greet`
      const greetTimerified = performance.timerify(user.greet)

      // use timerified `user.greet()`
      await greetTimerified()

      // use timerified `save()`
      await saveTimerified(user)
    }
  }
])

runner.toTimeline()
```

which outputs:

```text         
┌──────────┬───────┬───────────┐
│     type │  name │ value     │
├──────────┼───────┼───────────┤
│  Task: A │       │           │
│          │       │           │
│    cycle │   A 1 │  36.36 ms │
│ function │  save │  36.12 ms │
│          │       │           │
│    cycle │   A 2 │ 189.12 ms │
│ function │  save │ 189.09 ms │
│          │       │           │
│  Task: B │       │           │
│          │       │           │
│    cycle │   B 1 │  111.7 ms │
│ function │  save │  40.43 ms │
│ function │ greet │  80.59 ms │
│          │       │           │
│    cycle │   B 2 │ 225.74 ms │
│ function │  save │ 145.08 ms │
│ function │ greet │  90.54 ms │
│          │       │           │
│    cycle │   B 3 │  98.79 ms │
│ function │  save │   8.18 ms │
│ function │ greet │ 161.36 ms │
└──────────┴───────┴───────────┘
```

### Using `performance.measure`

Use [`performance.measure`][measure] to capture the time difference between
2 marks, set via [`performance.mark`][mark].

#### Example

Tracking the duration of `user.greet()` and `save`:

```js
const runner = new PerformanceRunner()

await runner.run([
  {
    name: 'A',
    cycles: 3,
    fn: async ({ cycle, taskname }) => {
      const user = new User()

      // start mark
      performance.mark('a')

      await user.greet()
      await save(user)

      // end mark
      performance.mark('b')

      // measure duration between `a`-`b`
      performance.measure('a-b', 'a', 'b')
    }
  },

  // rest of tasks ...
])

runner.toTimeline()
```

which outputs:

```text
            timeline                 
┌──────────┬───────┬───────────┐
│     type │  name │ value     │
├──────────┼───────┼───────────┤
│  Task: A │       │           │
│          │       │           │
│    cycle │   A 1 │ 111.7 ms  │
|  measure │   a-b │ 120.20 ms │
│          │       │           │
│    cycle │   A 2 │ 225.74 ms │
|  measure │   a-b │ 189.18 ms │
│          │       │           │
│    cycle │   A 3 │  98.79 ms │
|  measure │   a-b │ 120.35 ms │
│          │       │           │
└──────────┴───────┴───────────┘
```

### Measuring arbitrary values

Call [`performance.mark`][mark] and pass in the `detail` parameter an object
with these properties:

| property    | type   	    | description                           |
|-----------	|------------ |-------------------------------------	|
| `value`  	  | `Number`   	| Tracked value, required              	|
| `unit`  	  | `String`   	| Label for value, optional            	|


##### Example

Tracking the memory usage of each cycle, then displaying it in a histogram:

```js
await runner.run([
  {
    name: 'A',
    cycles: 5,
    fn: async () => {
      const user = new User('foo')

      await save(user)

      performance.mark('memory-usage', {
        detail: {
          value: process.memoryUsage().heapUsed / 1000 / 1000,
          unit: 'mb'
        }
      })
    }
  },

  {
    name: 'B',
    cycles: 10,
    fn: async () => {
      const user = new User('foo')

      await save(user)

      performance.mark('memory-usage', {
        detail: {
          value: process.memoryUsage().heapUsed / 1000 / 1000,
          unit: 'mb'
        }
      })
    }
  }
])

runner.toHistograms()
```

which outputs:

```text
┌──────────────┬───────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┐
│         name │ count │     min │     max │    mean │    50 % │    99 % │ dev │
├──────────────┼───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│        tasks │       │         │         │         │         │         │     │
│              │       │         │         │         │         │         │     │
│       Task A │     5 │ 0.04 ms │ 0.29 ms │ 0.17 ms │ 0.04 ms │ 0.29 ms │ 0   |
│       Task B │    10 │ 0.05 ms │ 0.07 ms │ 0.06 ms │ 0.05 ms │ 0.07 ms │ 0   │
│              │       │         │         │         │         │         │     │
│        entry │       │         │         │         │         │         │     │
│              │       │         │         │         │         │         │     │
│ memory-usage │    15 │ 11.2 mb │ 36.3 mb │ 22.1 mb │ 21.2 mb │   19 mb │ 12  │
└──────────────┴───────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘
```

### Displaying results

The different ways of visualising measurements.

#### `runner.toTimeline()`

Produces a detailed breakdown of the timeline of the cycles for each task:

```text
┌──────────┬───────┬───────────┐
│     type │  name │ value     │
├──────────┼───────┼───────────┤
│  Task: A │       │           │
│          │       │           │
│    cycle │   A 1 │ 36.36 ms  │
│ function │  save │ 36.12 ms  │
│          │       │           │
│    cycle │   A 2 │ 200.10 ms │
│ function │  save │ 189.09 ms │
│          │       │           │
│  Task: B │       │           │
│          │       │           │
│    cycle │   B 1 │  90.03 ms │
│ function │  save │  40.43 ms │
│ function │ greet │  80.60 ms │
│          │       │           │
│    cycle │   B 2 │ 235.08 ms │
│ function │  save │ 145.08 ms │
│ function │ greet │  90.00 ms │
│          │       │           │
│    cycle │   B 3 │ 164.00 ms │
│ function │  save │ 100.00 ms │
│ function │ greet │  64.00 ms │
└──────────┴───────┴───────────┘
```

#### `runner.toHistograms()`

Produces a [histogram][hgram] with `min`/`mean`/`max` and `percentiles` for
each measurement:

```text
┌──────────────┬───────┬─────────┬─────────┬─────────┬─────────┬─────────┬─────┐
│         name │ count │     min │     max │    mean │    50 % │    99 % │ dev │
├──────────────┼───────┼─────────┼─────────┼─────────┼─────────┼─────────┼─────┤
│        tasks │       │         │         │         │         │         │     │
│              │       │         │         │         │         │         │     │
│       Task A │     5 │ 0.04 ms │ 0.29 ms │ 0.17 ms │ 0.04 ms │ 0.29 ms │ 0   |
│       Task B │    10 │ 0.05 ms │ 0.07 ms │ 0.06 ms │ 0.05 ms │ 0.07 ms │ 0   │
│              │       │         │         │         │         │         │     │
│        entry │       │         │         │         │         │         │     │
│              │       │         │         │         │         │         │     │
│ memory-usage │    15 │ 11.2 mb │ 36.3 mb │ 22.1 mb │ 21.2 mb │   19 mb │ 12  │
└──────────────┴───────┴─────────┴─────────┴─────────┴─────────┴─────────┴─────┘
```

#### `runner.toEntries()`

Returns an array with all emitted [`PerformanceEntry`][perf-entry] entries
for each task.

#### `runner.toPlots()`

Draws ASCII charts of max durations of each cycle and any timerified functions:

```text
                                Task: "B"

durations (ms)                                   - main task - fn:save
╷
457.00 ┤                                               ╭──────────────                
416.80 ┤                               ╭───────────────╯                              
376.60 ┼───────────────╮               │                                              
336.40 ┤               │               │                                              
296.20 ┤               ╰───────────────╯                                              
256.00 ┤                                                                              
215.80 ┤                                                              
175.60 ┤                               ╭─────────────────────────────╮                
135.40 ┤               ╭───────────────╯                             │                
95.20  ┤               │                                             │                
55.00  ┼───────────────╯                                             |
┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬───┬
0   0   1   1   1   1   2   2   2   2   3   3   3   3   4   4   4   4   5     
                                                                   cycles
```

### Accessing cycle info

| property    | type   	    | description                                     |
|-----------	|-------------|-----------------------------------------------	|
| `cycle` 	  | `Number`   	| The current cycle, like `i` in a `for` loop   	|
| `taskname`  | `String`   	| The task name                                 	|


```js
runner.run([
  {
    name: 'A',
    cycles: 3,
    fn: async ({ cycle, taskname }) => {
      console.log(cycle)
      // '1' if it's the first cycle
      // '2' if it's the second cycle
      // '3' if it's the third & last cycle

      console.log(taskname)
      // 'Task A'
    }
  },

])
```

## Test

#### Install deps:

```bash
npm ci
```

#### Run unit tests:

```bash
npm test
```

#### Run test coverage:

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
