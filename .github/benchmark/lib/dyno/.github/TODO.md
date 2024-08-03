# Todo

## fix

- [x] simple example in `README` incorrectly logs a `task.mean: 1`
  - its `sleep` function takes `~50 ms` to it should log a mean of `> 50`.
  - works ok, just didn't `await timerifiedFn()` in the `task`
- [ ] finish, error logs are sometimes hidden by `render() console.clear()`
  - `runner` errors must be correctly logged
  - `thread` errors must be correctly logged
  - tests success must be correctly logged

## feat 

- [ ] warmup period
- [ ] event loop measures for each thread
- [ ] implement max backlog limit
- [x] `tasks:run` and `backlog` should ideally be tracked on the `runner`
  - now tracking `finished` and `backlog` on the primary
- [x] log test constants/parameters
- [ ] log to file

## refactor 

- [ ] there is no need for a `Dyno` class. Export a simple function instead.
- [ ] `npx init` should generate the bare-minimum benchmark that includes 
      reasonable features (i.e plot etc)
- [ ] unify all the code examples
- [ ] `runner` and `task` are state machines, think about implementing them
      as such
- [ ] The entire `stats` `tracking`/`observer` infra/language needs to be 
      rethought; what is a `stat`, what is a `measure`, why is it called 
      `tracker`? 
      Must get a simple, non-convoluted domain language about it.
- [ ] the stats tracking can be vastly simplified:
    - only have an `emitter` and an `observer`. Emitters are the same locally 
      or remote. They use a single `Bus` which emits both locally and 
      `process.send`.
      No distinction should be made between primary/runner or thread. The primary
      is a thread in and by itself.

## test

- [ ] fix/implement tests marked as `todo`
- [ ] add tests for `dyno.start()` failure
- [ ] split unit tests & integration tests
- [ ] ensure unit-tests run fast
  - use `mock` timers from `node:test` runner where possible
- [x] setup CodeQL workflow

## build

- [ ] "pull" this into its own project/repository
- [ ] publish to `npm`

## docs

- [ ] fix `npx init` docs after publishing
- [ ] Check if possible to DRY up example code via an `npx` script. 
  Right now theres 3 different & separate code examples:
  - `.github/example/` 
  - `README` docs example 
  - `npx init` sample
