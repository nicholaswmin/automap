# Contribution guidelines

## Versioning

Follows [Semantic Versioning][semver-2]

[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[semver-2]: https://semver.org/

## Code changes

Follows [GitHub flow][github-flow]

### Before commit

Functional tests:

```bash
npm test
npm run integration-test
```

Meta:

```bash
npm audit
npm run lint
```

all of the above should exit with `0`; no errors and no warnings.

## CI Workflows

- Functional unit-tests should be run in the `test` workflow.
- Non-functional tests, i.e `npm audit` should be run in the `meta` workflow.
