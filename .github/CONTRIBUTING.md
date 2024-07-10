# Contribution guidelines

## Todos

Todos can be [viewed here][todos].

## Versioning

Follows [Semantic Versioning][semver]

## Code changes

Follows [GitHub flow][github-flow]

### Before commit

```bash
npm test
npm run test:meta
```

which *must* exit with `exit code: 0`, without any errors or warnings.

[todos]: ./TODO.md
[workflows]: ./workflows
[semver]: https://semver.org/
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[func-req]: https://en.wikipedia.org/wiki/Functional_requirement
[non-func-req]: https://en.wikipedia.org/wiki/Non-functional_requirement
