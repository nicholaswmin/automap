import test from 'node:test'

test('Dyno: parameters:configurable', async t => {
  t.todo('some parameters are configurable')
  // @TODO 
  // `prompt()` checks for `NODE_ENV === 'test` & always suppresses user prompt 
  // so that must be "fixed" first before writing any tests for this
})
