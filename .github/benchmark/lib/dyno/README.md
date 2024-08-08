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
* [Tests](#tests)
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
// @TODO
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
// @TODO
```

### Output

```js
// @TODO
```

## Advanced example

> **Example:**   
> Benchmark a [`fibonacci()` function][fib] and an `async sleep()` function  
> with detailed timing measurements and a timeline plot

### Run file

```js
// run.js
// @TODO
```

### Task file 

```js
// task.js
// @TODO
```

### Output

```js
// @TODO
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
