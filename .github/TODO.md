# Todo

> Follows [MoSCoW prioritisation][moscow]

## Must have

- [ ] Consecutive saves increase the saving time linearly
  - Run example in `.github/scratch/index.js`
  - Cannot repro this in `test/perf/append-list/add/10k-nested-items.spec.js`
- [ ] List deletions?
- [x] There is a bug which causes empty lists to be passed on to `save()`.
  - [x] The `map.js` code is a code smell - that whole `nodeList` thing is a
    complete bullshit thing - unnecessary. Must fix - must make it simpler
  - [x] there are tests that do `list.value.value` to access some value, this
        is not acceptable
  - [x] There is no testing for lists with 0 items - hence why this slipped
        through.
- [x] Instead of using arguments, use inheritance and have 3 lists
  - `List`
  - `LazyList` extends `List`
  - `AppendList` extends `LazyList`
- [x] The repositories must take in regular `ids` and not `entity:id` formats.
- [x] The append list must differentiate between new entries and existing.
- [ ] The whole `Node` being disconnected from the `List` is confusing.
- [ ] There is a `for..of` loop that must be pipelined when reviving.

## Could have

- Sharing the model between client/server
- Concurrency control

## Testing

- [ ] Fix `test.todo` tests
- [ ] Add `LazyList` performance tests
- [ ] Add expiration on keys created by integration/performance tests.
- [ ] Performance tests should probably examine the `standard deviation`
      rather than relying on flaky, env. dependent `min`, `mean`, `max` timings.
- [ ] Not sure if i.e `10k-items.spec.js` naming is correct, maybe `cycles` is
      a more appropriate metric?
- [x] Split unit, integration and performance tests
- [x] Do not use `ioredis-mock` in performance/integration tests.
- [ ] Expansion of keys to lists when reviving must move outside the repository,
      to the `node.js` module - which also needs renaming to something more
      appropriate/descriptive.
- [x] Exiting the tests requires a `--test-force-exit` flag which is not
      ideal - but can live with for now.
- [ ] Test the repository as an integration test
- [x] Lists must be tested against a long time period - as in a lot of
items added - is it still adding `AppendList` items in `O(1)`?


[moscow]: https://en.wikipedia.org/wiki/MoSCoW_method
