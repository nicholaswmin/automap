# Contribution guidelines

## Todos

Todos can be [viewed here][todos].

## Versioning

Follows the [Semantic Versioning specification][semver]

## Code changes

Follows [GitHub flow][github-flow]

## Commit Messages

Follows the [Conventional Commits specification][conv-comm]

## Documentation

Follows [RFC 2119][rfc-2119] guidelines when using words
like "must", "should", "shall not" etc.

### Before commit

```bash
npm test
npm run test:meta
```

which *must* exit with `exit code: 0`, without any errors or warnings.

[todos]: ./TODO.md
[workflows]: ./workflows
[semver]: https://semver.org/
[conv-comm]: https://www.conventionalcommits.org/en/v1.0.0/#summary
[github-flow]: https://docs.github.com/en/get-started/using-github/github-flow
[func-req]: https://en.wikipedia.org/wiki/Functional_requirement
[non-func-req]: https://en.wikipedia.org/wiki/Non-functional_requirement
[rfc-2119]: https://www.ietf.org/rfc/rfc2119.txt
