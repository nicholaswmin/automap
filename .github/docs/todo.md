# Todo

> Redis ORM-like thing

## Critical

- [x] There is a bug which causes empty lists to be passed on to `save()`.
  - [x] The `map.js` code is a code smell - that whole `nodeList` thing is a
    complete bullshit thing - unnecessary. Must fix - must make it simpler
  - [x] there are tests that do `list.value.value` to access some value, this
        is not acceptable
  - [ ] There is no testing for lists with 0 items - hence why this slipped
        through.

- [x] Instead of using arguments, use inheritance and have 3 lists
  - `List`
  - `LazyList` extends `List`
  - `AppendList` extends `LazyList`
- [ ] The repositories must take in regular `ids` and not `entity:id` formats.
- [x] The append list must differentiate between new entries and existing.
- [ ] The whole `Node` being disconnected from the `List` is confusing.
- [ ] There is a `for..of` loop that must be pipelined when reviving.

## Testing Todos

- [ ] Expansion of keys to lists when reviving must move outside the repository,
      to the `node.js` module - which also needs renaming to something more
      appropriate/descriptive.
- [x] Exiting the tests requires a `--test-force-exit` flag which is not
      ideal - but can live with for now.

### General

- [ ] Lists must be tested against a long time period - as in a lot of
items added - is it still adding `AppendList` items in `O(1)`?

## Next Todos

- How can you share the model between client/server?
- Concurrency control?
