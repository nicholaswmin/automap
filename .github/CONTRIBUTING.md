# Guidelines

## Todos

[View todos][todos].

## Testing

Unit tests, integration tests and performance tests *must* be kept separate.

The integration & performance tests don't need to run fast, nor run locally,
but unit tests should run in *milliseconds*.

## Versioning

follows [Semantic Versioning][semver]

## Code changes

follows [GitHub flow][github-flow]

### commit messages

follows [conventional commits][conv-comm]

### before merging to `main`

```bash
npm test
npm run test:integration
npm run test:performance
npm run checks
```

*must* pass, without warnings.

[todos]: ./TODO.md
[semver]: https://semver.org/
[conv-comm]: https://www.conventionalcommits.org/en/v1.0.0/#summary
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
