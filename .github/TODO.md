# Todo

> follows [Moscow prioritisation][moscow]

## Must have

> or must fix

- [x] Consecutive saves increase the saving time linearly
  - Run example in `.github/scratch/index.js`
  - Cannot repro this in `test/perf/append-list/add/5k-nested.spec.js`
  - `fixed:` caused by missing `maxBoards` limit causing board count to
    skyrocket.
- [ ] List deletions?
- [ ] The whole `Node` being disconnected from the `List` is confusing.
- [ ] There is a `for..of` loop that must be pipelined when reviving.
- [ ] [... wtf?](https://github.com/nicholaswmin/automap/blob/9979bba7c88d0a3f8647bd0c60ac00c1a59b6448/src/repository.js#L27)

## Should have

- [ ] Providing/setting a root `id` on the object in `repo.save`

## Could have

- [ ] Sharing the model between client/server
- [ ] Concurrency control

## Wont have

- 0 dependencies feature

## Testing

### General

- [ ] Fix/implement `test.todo` tests
- [ ] Use a single example/test model in both docs and tests

### Performance

- [ ] Add expiration on keys created by integration/performance tests.
- [x] Add performance testing for concurrency
- [x] Use an actual Redis server in performance/integration tests.
- [ ] Expansion of keys to lists when reviving must move outside the repository,
      to the `node.js` module - which also needs renaming to something more
      appropriate/descriptive.
- [x] Lists must be tested against a long time period - as in a lot of
      items added - is it still adding `AppendList` items in `O(1)`?
- [ ] split the benchmarking `Paper` test infra in own module.
  - [ ] Add at least some tests
  - [ ] Ditch the `Paper` model, use a uniform `Building` model or something

### Docs

Top section is unclear still.

[moscow]: https://en.wikipedia.org/wiki/MoSCoW_method
