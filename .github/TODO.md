# Todo

> follows [Moscow prioritisation][moscow]

## Must have

- [x] Consecutive saves increase the saving time linearly
  - Run example in `.github/scratch/index.js`
  - Cannot repro this in `test/perf/append-list/add/5k-nested.spec.js`
  - `fixed:` caused by missing `maxBoards` limit causing board count to
    skyrocket.
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

## Should have

`@TODO`

## Could have

- [ ] Providing/setting a root `id` on the object in `repo.save`
- [ ] Sharing the model between client/server
- [ ] Concurrency control

## Wont have

- 0 dependencies feature

## Testing

### General

- [ ] Fix/implement `test.todo` tests
- [ ] Use a single example/test model in both docs and tests

### Performance

- [x] Add performance testing for concurrency, something like artillery
      but lighter.
- [ ] Add expiration on keys created by integration/performance tests.
- [x] Do not use `ioredis-mock` in performance/integration tests.
- [ ] Expansion of keys to lists when reviving must move outside the repository,
      to the `node.js` module - which also needs renaming to something more
      appropriate/descriptive.
- [x] Lists must be tested against a long time period - as in a lot of
      items added - is it still adding `AppendList` items in `O(1)`?

### integration

- [x] integration tests should test similar to what the performance tests
      test for verifying they actually do what they do.
- [x] They must also verify the saved data structure/format in Redis

### Docs

Top section is unclear still.

[moscow]: https://en.wikipedia.org/wiki/MoSCoW_method
