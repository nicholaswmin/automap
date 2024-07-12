# Guidelines

## Todos

[View todos][todos].

## Testing

Unit tests, integration tests and performance tests *must* be kept separate.  

## Versioning

follows [Semantic Versioning][semver]

## Code changes

follows [GitHub flow][github-flow]

### commit messages

follows [conventional commits][conv-comm]

### before commit

```bash
npm test
npm run checks
```

*must* pass locally

### before merging to `main`

In addition to the above:

```bash
npm run test:integration
npm run test:performance
```

*must* also pass, both locally and on CI.

[todos]: ./TODO.md
[semver]: https://semver.org/
[conv-comm]: https://www.conventionalcommits.org/en/v1.0.0/#summary
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[non-func-req]: https://en.wikipedia.org/wiki/Non-functional_requirement
