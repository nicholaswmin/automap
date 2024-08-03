# Todo

## fixes

- [ ] finish, error logs are sometimes hidden by `render() console.clear()`
  - `runner` errors must be correctly logged
  - `thread` errors must be correctly logged
  - tests success must be correctly logged

## feat 

- [ ] warmup period
- [ ] event loop measures for each thread
- [x] log test constants/parameters
- [ ] log to file

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
