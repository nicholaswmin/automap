# Todo

## fix

- [ ] simple example in `README` incorrectly logs a `task.mean: 1`
  - its `sleep` function takes `~50 ms` to it should log a mean of `> 50`.
- [ ] finish, error logs are sometimes hidden by `render() console.clear()`
  - `runner` errors must be correctly logged
  - `thread` errors must be correctly logged
  - tests success must be correctly logged

## feat 

- [ ] warmup period
- [ ] event loop measures for each thread
- [ ] `tasks run` and `backlog` should ideally be tracked on the `runner`
- [x] log test constants/parameters
- [ ] log to file

## refactor 

- [ ] there is no need for a `Dyno` class. Export a simple function instead.
- [ ] `npx init` should generate the bare-minimum benchmark that includes 
      reasonable features (i.e plot etc)
- [ ] unify all the code examples

## test

- [ ] fix/implement tests marked as `todo`
- [ ] add tests for `dyno.start()` failure
- [ ] split unit tests & integration tests
- [ ] ensure unit-tests run fast
  - use `mock` timers from `node:test` runner where possible
- [ ] setup CodeQL workflow

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
