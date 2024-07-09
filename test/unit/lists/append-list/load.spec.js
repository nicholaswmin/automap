import assert from 'node:assert'
import { test } from 'node:test'

import { AppendList } from '../../../../src/list.js'
import { Message } from '../../../model/index.js'

// Mock repository, needed when calling `list.load(repository)
//
// Fetches a couple of message JSONs if passed the correct key:
//
// - `withMatchingLoader` has a matching loader
// - `withoutMatchingLoader` does not, so it should throw

const mockRepos = {
  withMatchingLoader: {
    loaders: {
      list: {
        get: key => key === 'chatroom:foo:messages' ? [
          { id: 'u_1', text: 'Hello' },
          { id: 'u_2', text: 'World' }
        ] : []
      }
    }
  },
  withoutMatchingLoader: { loaders: { } }
}

test('AppendList', async t => {
  let list

  await t.test('#load', async t => {

    await t.beforeEach(() => {
      list = new AppendList({
        from: 'chatroom:foo:messages',
        type: Message
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
          message: 'Cannot find loader of type: list in repo'
        })
      })
    })

    await t.test('calling #load with repo with a matching loader', async t => {
      await t.beforeEach(async () => {
        await list.load(mockRepos.withMatchingLoader)
      })

      await t.test('has state loaded = true', () => {
        assert.strictEqual(list.loaded, true)
      })

      await t.test('has 2 items', () => {
        assert.strictEqual(list.length, 2)
      })

      await t.test('has no new additions', () => {
        assert.strictEqual(list.additions.length, 0)
      })

      await t.test('both are Message instances', () => {
        assert.strictEqual(list[0].constructor.name, 'Message')
        assert.strictEqual(list[1].constructor.name, 'Message')
      })
    })

    await t.test('calling #load after adding new items', async t => {
      await t.beforeEach(async () => {
        list.push(new Message({ id: 'm_3', text: 'bonjour' }))
        await list.load(mockRepos.withMatchingLoader)
      })

      await t.test('has state loaded = true', () => {
        assert.strictEqual(list.loaded, true)
      })

      await t.test('has 3 items', () => {
        assert.strictEqual(list.length, 3)
      })

      await t.test('the loaded items are added before the new items', () => {
        assert.strictEqual(list[2].id, 'm_3')
      })

      await t.test('there are new additions', async t => {
        assert.strictEqual(list.additions.length, 1)

        await t.test('corresponding to the new items', () => {
          assert.strictEqual(list.additions[0].id, 'm_3')
        })
      })
    })
  })
})
