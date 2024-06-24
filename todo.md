# Todo

> Redis ORM-like thing

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



## Next Todos

- How can you share the model between client/server?
- Concurrency control?
