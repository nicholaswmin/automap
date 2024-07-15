import assert from 'node:assert'
import { test } from 'node:test'

import { LazyList } from '../../../../src/list.js'
import { Person } from '../../../util/model/index.js'

// Mock repository, needed when calling `list.load(repository)
//
// Fetches a couple of message JSONs if passed the correct key:
//
// - `withMatchingLoader` has a matching loader
// - `withoutMatchingLoader` does not, so it should throw

const mockRepos = {
  withMatchingLoader: {
    loaders: {
      hash: {
        get: key =>  {
          const hash = {
            'o_1': JSON.stringify({ i: 0, json: { id: 'o_1' }}),
            'o_2': JSON.stringify({ i: 1, json: { id: 'o_2' }})
          }

          return key && key === 'building:foo:visitors' ?
            Object.keys(hash)
            .map(key => JSON.parse(hash[key]))
            .sort((a, b) => a.i - b.i)
            .map(item => item.json) :
            null
        }
      }
    }
  },
  withoutMatchingLoader: { loaders: { } }
}

test('LazyList', async t => {
  let list

  await t.test('#load', async t => {

    t.beforeEach(() => {
      list = new LazyList({
        from: 'building:foo:visitors',
        type: Person
      })
    })

    await t.test('list is not initially loaded', async t => {
      assert.ok(list)

      await t.test('has 0 items', () => {
        assert.strictEqual(list.length, 0)
      })

      await t.test('has state loaded = false', () => {
        assert.strictEqual(list.loaded, false)
      })
    })

    await t.test('calling #load without passing a repository', async t => {
      await t.test('throws with a fix-it message', async () => {
        await assert.rejects(async () => {
          return list.load()
        }, {
          message: 'Must pass a repository instance when calling .load()'
        })
      })
    })

    await t.test('calling #load with repo w/o a matching loader', async t => {
      await t.test('throws with a fix-it message', async () => {
        await assert.rejects(async () => {
          return list.load(mockRepos.withoutMatchingLoader)
        }, {
          message: 'Cannot find loader of type: hash in repo'
        })
      })
    })

    await t.test('calling #load with repo with a matching loader', async t => {
      t.beforeEach(async () => {
        await list.load(mockRepos.withMatchingLoader)
      })

      await t.test('has state loaded = true', () => {
        assert.strictEqual(list.loaded, true)
      })

      await t.test('has 2 items', () => {
        assert.strictEqual(list.length, 2)
      })

      await t.test('both are "Person" instances', () => {
        assert.strictEqual(list[0].constructor.name, 'Person')
        assert.strictEqual(list[1].constructor.name, 'Person')
      })
    })
  })
})
