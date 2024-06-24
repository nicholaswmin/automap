import assert from 'node:assert'
import { test, before, beforeEach } from 'node:test'

import { LazyList } from '../../../src/list.js'
import { Message } from '../../model/index.js'

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
            'm_1': JSON.stringify({ i: 0, json: { id: 'm_1', text: 'Hello' }}),
            'm_2': JSON.stringify({ i: 1, json: { id: 'm_2', text: 'World' }})
          }

          return key && key === 'chatroom:foo:messages' ?
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

    await t.beforeEach(t => {
      list = new LazyList({
        items: 'chatroom:foo:messages',
        construct: item => new Message(item)
      })
    })

    await t.test('list is not initially loaded', async t => {
      assert.ok(list)

      await t.test('has 0 items', t => {
        assert.strictEqual(list.length, 0)
      })

      await t.test('has state loaded = false', t => {
        assert.strictEqual(list.loaded, false)
      })
    })

    await t.test('calling #load without passing a repository', async t => {
      await t.test('throws with a fix-it message', async t => {
        await assert.rejects(async () => {
          return list.load()
        }, {
          message: 'Must pass a repository instance when calling .load()'
        })
      })
    })

    await t.test('calling #load with repo w/o a matching loader', async t => {
      await t.test('throws with a fix-it message', async t => {
        await assert.rejects(async () => {
          return list.load(mockRepos.withoutMatchingLoader)
        }, {
          message: 'Cannot find loader of type: hash in repo'
        })
      })
    })

    await t.test('calling #load with repo with a matching loader', async t => {
      await t.beforeEach(async t => {
        await list.load(mockRepos.withMatchingLoader)
      })

      await t.test('has state loaded = true', t => {
        assert.strictEqual(list.loaded, true)
      })

      await t.test('has 2 items', t => {
        assert.strictEqual(list.length, 2)
      })

      await t.test('both are Message instances', t => {
        assert.strictEqual(list[0].constructor.name, 'Message')
        assert.strictEqual(list[1].constructor.name, 'Message')
      })
    })
  })
})
