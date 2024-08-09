[![test-workflow][test-badge]][test-workflow] [![codeql-workflow][codeql-badge]][codeql-workflow]

# :stopwatch: dyno

run multithreaded benchmarks

* [Install](#install)
* [Quickstart](#quickstart)
* [Configuration](#configuration)
* [Example](#example)
  + [Run file](#run-file)
  + [Task file](#task-file)
  + [Output](#output)
* [Tests](#tests)
* [Scripts](#scripts)
* [Authors](#authors)
* [License](#license)

## Install

```bash
npm i @nicholaswmin/dyno
```

## Quickstart

Create a runnable sample benchmark

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

## Example

> Benchmark a `fibonnacci()` function using [`performance.timerify`][timerify] 
> on 4 threads

### Run file

Declares: 

- test parameters  
- what measurements should be logged and how

Sets up the benchmark & internally controls the spawned threads.

```js
// run.js
import { join } from 'node:path'
import { dyno, Table } from '{{entryFile}}'

await dyno({
  task: join(import.meta.dirname, 'task.js'),
  parameters: {
    // required test parameters
    CYCLES_PER_SECOND: 10, 
    CONCURRENCY: 4, 
    DURATION_MS: 5 * 1000,
    
    // custom parameters,
    // passed on to 'task.js'
    FIB_NUMBER: 35,
    ITERATIONS: 3
  },

  render: function(threads) {
    // render output in table format
    const pid  = process.pid.toString()
    const pids = Object.keys(threads)
    
    // primary output, mainly logs stats on cycles sent/finished etc..
    // 'sent', 'done', 'backlog', 'uptime' are provided by default
    const main = threads[pid]
      const views = [
        new Table('Tasks')
        .setHeading('sent', 'done', 'backlog', 'uptime (secs)')
        .addRowMatrix([
          [
            main.sent?.count                      || 'n/a',
            main.done?.count                      || 'n/a',
            (main.sent?.count - main.done?.count) || 0,
            main.uptime?.count                    || 'n/a'
          ]
        ]),
        
        // task output, logs stats and user-taken measurements from 'task.js' 
        // on task durations etc ...
        new Table('Task')
        .setHeading(
          'thread id', 
          'task (ms)', 
          'fibonacci (ms)'
        ).addRowMatrix(
        
        // - 'task' is provided by default
        // - 'fibonacci' is a custom measurement taken in 'task.js'
        Object.keys(threads)
        .filter(_pid => _pid !== pid)
        .map(pid => {
          return [
            pid,
            Math.round(threads[pid]['task']?.mean)       || 'n/a',
            Math.round(threads[pid]['fibonacci']?.mean)  || 'n/a'
          ]
      })
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5))
    ]
      
    // render the table
    console.clear()
    views.forEach(view => console.log(view.toString()))  
  }
})
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
import { run } from '{{entryFile}}'

// use 'performance.timerify' to time a fibonnaci function
run(async function task(parameters) {
  function fibonacci(n) {
    return n < 1 ? 0
          : n <= 2 ? 1
          : fibonacci(n - 1) + fibonacci(n - 2)
  }
  
  const timed_fibonacci = performance.timerify(fibonacci)
  
  // set in parameters in run.js
  for (let i = 0; i < parameters.ITERATIONS; i++)
    timed_fibonacci(parameters.FIB_NUMBER)
})
```

### Output

```js
+---------------------------------------+
|                 Tasks                 |
+------+------+---------+---------------+
| sent | done | backlog | uptime (secs) |
+------+------+---------+---------------+
|   66 |   59 |       7 |             7 |
+------+------+---------+---------------+

+----------------------------------------+
|                  Task                  |
+-----------+-----------+----------------+
| thread id | task (ms) | fibonacci (ms) |
+-----------+-----------+----------------+
|     27991 |       303 |             52 |
|     27990 |       299 |             52 |
|     27988 |       275 |             52 |
|     27989 |       259 |             52 |
+-----------+-----------+----------------+
```

## Tests

install deps:

```bash
npm ci
```

unit & integration tests:

```bash
npm test
```

test coverage:

```bash
npm run test:coverage
```

## Scripts 

create runnable example:

```bash
npx init
```

insert/update README example:

```bash
npm run example:update:readme
```

## Authors

Nicholas Kyriakides, [@nicholaswmin][nicholaswmin]

## License

[MIT "No Attribution" License][license]

<!--- Badges -->

[test-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/test.yml/badge.svg
[test-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/test:unit.yml

[codeql-badge]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml/badge.svg
[codeql-workflow]: https://github.com/nicholaswmin/dyno/actions/workflows/codeql.yml

<!--- Content -->

[perf-api]: https://nodejs.org/api/perf_hooks.html#performance-measurement-apis
[timerify]: https://nodejs.org/api/perf_hooks.html#performancetimerifyfn-options
[measure]: https://nodejs.org/api/perf_hooks.html#class-performancemeasure
[fib]: https://en.wikipedia.org/wiki/Fibonacci_sequence
[v8]: https://v8.dev/

<!--- Basic -->

[nicholaswmin]: https://github.com/nicholaswmin
[license]: ./LICENSE
