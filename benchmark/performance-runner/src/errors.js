import { styleText as style } from 'node:util'

class RunNotEndedError extends Error {
  constructor(message) {
    super(style('red', 'Must end run first via PerformanceRunner.end()'))
  }
}

export default { RunNotEndedError }
