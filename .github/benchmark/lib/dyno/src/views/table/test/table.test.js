import test from 'node:test'
import Table from '../index.js'

test('#view:Table', async t => {
  let table = null, rows = [
    { 'foo': 0,   'bar': 30, 'baz': 30 },
    { 'foo': NaN, 'bar': undefined, 'baz': 40 },
    { 'foo': 25,  'bar': 35, 'baz': 10 },
    { 'foo': 35,  'bar': 40, 'baz': 30 }
  ]

  t.beforeEach(() => {
    table = new Table('Foo Table', rows)
  })

  await t.test('an array is provided as rows', async t => {
    await t.test('sets a table', async t => {
      await t.test('has a table property', async () => {
        t.assert.ok(table.table)
      })

      await t.test('with title set as table title', async t => {
        t.assert.strictEqual(table.table.title, 'Foo Table')
      })

      await t.test('with row keys as headings', async t => {
        t.assert.deepStrictEqual(table.table.heading, ['foo', 'bar', 'baz'])
      })
      
      await t.test('NaN values are rendered as "n/a"', async t => {
        t.assert.strictEqual(table.table.rows[1][0], 'n/a')
      })

      await t.test('undefined values are rendered as "n/a"', async t => {
        t.assert.strictEqual(table.table.rows[1][1], 'n/a')
      })

      await t.test('with row values as rows', async t => {
        t.assert.deepStrictEqual(table.table.rows, [
          [0, 30, 30],
          ['n/a', 'n/a', 40],
          [25, 35, 10],
          [35, 40, 30]
        ])
      })
    })
  })

  await t.test('#render', async t => {   
    await t.test('rows are empty', async t => {
      t.beforeEach(() => {
        table = new Table('Foo Table', [])
      })

      await t.test('returns a "no rows" string', async t => {
        t.assert.strictEqual(typeof table.render(false), 'string')
        t.assert.strictEqual(table.render(false), 'no rows')
      })
    })

    await t.test('has rows', async t => {
      await t.test('returns an ASCII table', async t => {
        t.assert.strictEqual(typeof table.render(false), 'string')
  
        t.assert.ok(
          table.render(false).includes('Foo Table'), 
          'render() output does not include title "Foo Table"'
        )
      })
      
      t.todo('renders an ASCII table in stdout', async () => {
        // a bit tricky to test stdout output, ignoring for now
      })
    })
  })
})
