// task.js

import { thread } from '../../index.js'

thread(async parameters => {
  // 'parameters' configured in the primary are available here

  // function under test
  const fibonacci = n => n < 1 ? 0 : n <= 2
    ? 1 : fibonacci(n - 1) + fibonacci(n - 2)

  // can be timerified using `performance.timerify`
  const timed_fibonacci = performance.timerify(fibonacci)

  timed_fibonacci(parameters.FOO)
  timed_fibonacci(parameters.BAR)
  timed_fibonacci(parameters.BAZ)

  // Measure something using `performance.measure`
  performance.mark('start')

  await new Promise(resolve => setTimeout(resolve, 100))

  performance.mark('end')
  performance.measure('sleep', 'start', 'end')
})
