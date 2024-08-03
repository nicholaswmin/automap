[![test-workflow][test-badge]][test-workflow] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

run multithreaded benchmarks

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

#### Run

> navigate into the created `benchmark` folder:

```bash
cd benchmark
```

> start the benchmark:

```bash
node run.js
```

## Examples 

### Simple 

> Benchmark a `sleep()` function using [`performance.timerify`][timerify]

#### Runner file

Declares: 

- test parameters  
- what measurements should be logged and how

This file is run once.   
Sets up the benchmark & internally controls the spawned threads.

```js
// run.js
import { join } from 'node:path'
import { Dyno, Table } from '@nicholaswmin/dyno'

const dyno = new Dyno({
  task: join(import.meta.dirname, 'task.js'),

  parameters: {
    configurable: {
      TASKS_SECOND: 100,
      THREAD_COUNT: 4,
      TEST_SECONDS: 5,

      FOO: 20,
      BAR: 50
    }
  },

  render: function({ runner, threads }) {
    const table = new Table('Threads (mean/ms)')
      .setHeading('thread', 'task', 'sleep', 'max backlog', 'memory use (KB)')
      .addRowMatrix(Object.keys(threads).map(thread => {
        return [
          thread,
          Math.round(threads[thread]['task']?.at(-1).mean) || 'n/a',
          Math.round(threads[thread]['sleep']?.at(-1).mean) || 'n/a',
          Math.round(threads[thread]['backlog']?.at(-1).max) || 'n/a',
          Math.round(threads[thread]['memory']?.at(-1).mean / 1000) || 'n/a'
        ]
      }))

    console.clear()
    console.log(table.toString())
  }
})

await dyno.start()
```

#### Task file

Declares: 

- The benchmarked *code/task*

The task file is run in its own isolated [V8 process][v8] 
`times x THREAD_COUNT`, concurrently, on separate threads.

Within the task file, custom measurements can be taken using
the following [Performance Measurement APIs][perf-api]:

- [`performance.timerify`][timerify]
- [`performance.measure`][measure]

```js
// task.js
import { task } from '@nicholaswmin/dyno'

task(async parameters => {
  // parameters are specified in the runner file
  const sleep = ms => new Promise(res => setTimeout(res, ms))
  const timerified_sleep = performance.timerify(sleep)
  
  for (let i = 0; i < parameters.FOO; i++)
    timerified_sleep(parameters.BAR)
})
```

### Example output

```js
+---------------------------------------------------------+
|                    Threads (mean/ms)                    |
+--------+------+-------+-------------+-------------------+
| thread | task | sleep | max backlog | memory usage (KB) |
+--------+------+-------+-------------+-------------------+
|   7218 |   59 |    52 |           6 |              6871 |
|   7219 |   54 |    52 |           4 |              6935 |
|   7220 |   54 |    52 |           1 |              6870 |
|   7221 |   53 |    51 |           3 |              6888 |
+--------+------+-------+-------------+-------------------+
```

## Advanced

`@TODO`

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

You can run the [fibonacci benchmark](#advanced), using:

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
