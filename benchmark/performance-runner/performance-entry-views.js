import { styleText as style } from 'node:util'
import { utils } from '../../index.js'

const toMillis = num => utils.round(num) + ' ms'

const performanceEntryViews = {
  'net': (ctx, entry) => {
    return {
      type: style(['blue'], 'net'),
      name: 'net',
      value: toMillis(entry.duration)
    }
  },

  'dns': (ctx, entry) => {
    return {
      type: style(['blue'], 'dns'),
      name: 'dns',
      value: toMillis(entry.duration)
    }
  },

  'connect': (ctx, entry) => {
    return {
      type: style(['blue'], 'connect'),
      name: 'connect',
      value: toMillis(entry.duration)
    }
  },

  'fn': (ctx, entry) => {
    const step = entry.detail[0]
    const name = entry.detail[1]

    ctx.table.addRow({
      type:  '---------',
      name:  '---------------',
      value: '--------',
    })

    return {
      type: style(['green', 'underline'], 'cycle'),
      name: style(['green', 'underline'], `${step}:${name}`),
      value: style(['green', 'underline'], toMillis(entry.duration))
    }
  },

  'function': (ctx, entry) => {
    return {
      type: 'function',
      name: entry.name.replace('bound', ''),
      value: toMillis(entry.duration)
    }
  },

  'gc': (ctx, entry) => {
    return {
      type: 'gc',
      name: 'gc',
      value: toMillis(entry.duration)
    }
  },

  'mark': (ctx, entry) => {
    return {
      type:  style(['yellow'], 'mark'),
      name:  style(['yellow'], entry.name),
      value: style(['yellow'], entry.detail ?
        entry.detail.value.toString() :
        entry.duration.toString()
    )}
  },

  'measure': (ctx, entry) => {
    return {
      type:  style(['blue'], 'measure'),
      name:  style(['blue'], entry.name),
      value: style(['blue'], toMillis())
    }
  }
}

export default performanceEntryViews
