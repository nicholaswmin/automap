[![test-workflow][test-badge]][test-workflow]

# :wrench: dyno

A multithreaded benchmarker

## Usage

To run this benchmark you need 2 separate files:

`primary.js`

Mostly sets up the configuration for the test

`task.js`

```js
// primary.js
const dyno = new Dyno({
  task: './task.js',
  // Test parameters
  parameters: await configure({
    TASKS_SECOND: 100,
    THREAD_COUNT: 2,
    DURATION_SECONDS: 5,
    RANDOM_ID: randomId
  }),
  // What to print out
  fields: {
    threads: {
      stats: {
        sortby: 'max backlog',
        labels: {
          logged: [
            ['task.count', 'tasks run'],
            ['memory.mean', 'memory (mean/mb)', Math.round],
            ['backlog.max', 'max backlog']
          ]
        }
      }
    }
  }
})

await dyno.start()
```

The task file, where code that needs to be benchmarked runs.

```js
// task.js
import { thread } from './lib/dyno/index.js'

thread(async parameters => {
  // - task runs here
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
