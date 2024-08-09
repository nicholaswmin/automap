import { run } from '{{entryFile}}'

// use 'performance.timerify' to time a fibonnaci function
run(async function task(parameters) {
  function fibonacci(n) {
    return n < 1 ? 0
          : n <= 2 ? 1
          : fibonacci(n - 1) + fibonacci(n - 2)
  }
  
  const timed_fibonacci = performance.timerify(fibonacci)
  
  // set in parameters in run.js
  for (let i = 0; i < parameters.ITERATIONS; i++)
    timed_fibonacci(parameters.FIB_NUMBER)
})
