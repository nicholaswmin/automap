[![test-workflow][test-workflow-badge]][ci-test]

# automap
tiny and schemaless Redis ORM-"ish" microframework [WIP]

Serialize an [OOP-y][oop] instance to [Redis][redis] and get it back, properly
instantiated.


[test-workflow-badge]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml/badge.svg
[ci-test]: https://github.com/nicholaswmin/automap/actions/workflows/tests.yml

[oop]: https://en.wikipedia.org/wiki/Object-oriented_programming
[redis]: https://redis.io/

## Test

```bash
npm ci
npm test
```

Runs all unit-tests & produces a code-coverage report


## License

> MIT No Attribution License
>
> Copyright (c) 2024 Nicholas Kyriakides
>
> Permission is hereby granted, free of charge, to *any person* obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so.
