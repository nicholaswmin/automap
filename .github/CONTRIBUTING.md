# Contribution guidelines

## Versioning

Follows [Semantic Versioning][semver-2]

[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[semver-2]: https://semver.org/

## Code changes

Follows [GitHub flow][github-flow]

### Before commit

```bash
npm test
npm audit
npm run lint
```

all of the above should exit with `0`; no errors and no warnings.

## CI Workflows

- Functional unit-tests should be run in the `test` workflow.
- Non-functional tests, i.e `npm run lint` should be run in the `meta` workflow.
