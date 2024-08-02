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

follow [conventional commits][conv-comm] convention.

The commit messages should be short yet descriptive enough 
so that `git blame` gives a good approximation of the intent of the change.

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
