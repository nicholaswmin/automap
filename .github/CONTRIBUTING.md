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

follow [GitHub flow][github-flow]

### commit messages

follow [conventional commits][conv-comm] convention.

The commit messages should be short yet descriptive enough   
so that [`git blame`][git-blame] describes the original intent

### before merging to `main`

```bash
npm test
npm run test:integration
npm run test:performance
npm run checks
```

*must* pass, without warnings.

## Authors 

[@nicholaswmin][nicholaswmin]

[todos]: ./TODO.md
[semver]: https://semver.org/
[conv-comm]: https://www.conventionalcommits.org/en/v1.0.0/#summary
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[git-blame]: https://git-scm.com/docs/git-blame

[nicholaswmin]: https://github.com/nicholaswmin
