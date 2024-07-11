# Contribution guidelines

## Todos

Todos can be [viewed here][todos].

## Versioning

Uses [Semantic Versioning][semver]

## Code changes

Uses [GitHub flow][github-flow]

## Commit Messages

Uses [Conventional Commits][conv-comm]

## Documentation

Follows [RFC 2119][rfc-2119] when using words like
"must", "should", "shall not" etc ...

## Testing

Unit, integration and performance tests *must* be separate.  
The entire unit-test suite *must* run in < 2 seconds, at most.

[Functional code][func-req] *must* have 100% test coverage.

### Before commit

```bash
npm test
npm run test:meta
```

 *must* pass locally, without warnings.

### Before merge

> a pull-request to `main` branch

In addition to the above, these:

```bash
npm run test:integration
npm run test:performance
```

*must* pass both locally and on the CI workflows, without warnings.

[todos]: ./TODO.md
[workflows]: ./workflows
[semver]: https://semver.org/
[conv-comm]: https://www.conventionalcommits.org/en/v1.0.0/#summary
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[func-req]: https://en.wikipedia.org/wiki/Functional_requirement
[non-func-req]: https://en.wikipedia.org/wiki/Non-functional_requirement
[rfc-2119]: https://www.ietf.org/rfc/rfc2119.txt
