# Contribution guidelines

## Todos

Remaining todos can be [viewed here][todos].

## Versioning

Follows [Semantic Versioning][semver]

## Code changes

Follows [GitHub flow][github-flow]

### Before commit

```bash
npm test
npm audit
npm run lint
```

all of the above should exit with a **exit code: 0**, without *any* errors
or warnings.

## CI Workflows

- [Functional tests][func-req] should be run in the `test.yml` workflow.
- [Non-functional tests][non-func-req], i.e `npm audit` should be run in the
  `meta.yml` workflow.


[todos]: ./TODO.md
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[semver]: https://semver.org/
[func-req]: https://en.wikipedia.org/wiki/Functional_requirement
[non-func-req]: https://en.wikipedia.org/wiki/Non-functional_requirement
