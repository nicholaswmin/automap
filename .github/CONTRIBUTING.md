# Contribution guidelines

## Issues

Issues for bug reports *must*:

- be tagged as a "bug"
- include a [Minimal, Complete and Verifiable Example][mcve]

## Todos

Remaining todos can be [viewed here][todos].

## Pointers

- Code *must* always be accompanied by unit-tests for all code paths.
- Dependencies *should* be kept to an absolute minimum.  
  Use native functionality where possible.
- Verbosity *should* be kept to a minimum in code, tests and docs.
- Keep it simple. Prefer doing too little, rather than too much.

## Versioning

Follows [Semantic Versioning][semver]

## Code changes

Follows [GitHub flow][github-flow]

### Before commit

```bash
npm run test:precommit
```

*must* exit with `exit code: 0`, without any errors or warnings.

## CI workflows

The CI workflows can be [found here][workflows].

- [Functional tests][func-req] should be run in the `test.yml` workflow.
- [Non-functional tests][non-func-req], i.e `npm audit` should be run in the
  `meta.yml` workflow.

[todos]: ./TODO.md
[workflows]: ./workflows
[semver]: https://semver.org/
[mcve]: https://en.wikipedia.org/wiki/Minimal_reproducible_example
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[func-req]: https://en.wikipedia.org/wiki/Functional_requirement
[non-func-req]: https://en.wikipedia.org/wiki/Non-functional_requirement
