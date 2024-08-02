import test from 'node:test'

import { Table } from '../../index.js'

test('Views: Table', async t => {
  let table

  t.beforeEach(async () => {
    table = new Table('Foo Table')
      .setHeading('foo', 'bar')
      .addRowMatrix([ [10, 20], [30, 40] ])
  })
  
  await t.test('instantiates', async t => {
    t.assert.ok(table)
  })

  await t.test('#toString()', async t => {
    let result

    t.beforeEach(() => {
      result = table.toString()
    })

    await t.test('returns a result', async t => {
      t.assert.ok(result)

      await t.test('is a string', t => {
        const type = typeof result

        t.assert.ok(typeof result === 'string', `exp: string, got: ${type}`)
      })
      
      await t.test('contains passed title', t => {
        t.assert.ok(result.includes('Foo'), `cannot find: "Foo Table"`)
      })

      await t.test('contains passed headers', t => {
        t.assert.ok(result.includes('foo'), `cannot find header: "foo"`)
        t.assert.ok(result.includes('bar'), `cannot find header: "bar"`)
      })
      
      await t.test('contains passed values', t => {
        t.assert.ok(result.includes('10'), `cannot find value: "10"`)
        t.assert.ok(result.includes('20'), `cannot find value: "20"`)
        t.assert.ok(result.includes('30'), `cannot find value: "30"`)
        t.assert.ok(result.includes('40'), `cannot find value: "40"`)
      })
    })
  })
})
