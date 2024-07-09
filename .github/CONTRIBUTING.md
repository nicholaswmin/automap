# Contribution guidelines

## Versioning

Follows [Semantic Versioning][semver-2]

[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[semver-2]: https://semver.org/

## Code changes

Follows [GitHub flow][github-flow]

### Before commit

Run the following:

```bash
npm test
npm audit
npm run lint
```

all of the above should all exit with `exit-code: 0`

## CI Workflows

- Functional unit-tests should be run in the `test` workflow.
- Non-functional tests, i.e `npm run lint` should be run in the `meta` workflow.
