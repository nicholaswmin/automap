// Run:
// NODE_ENV=test node --test benchmark/performance-runner/test/index.spec.js

import './runner/to-histograms/marks.spec.js'
import './runner/to-histograms/to-histograms.spec.js'

import './runner/to-timeline/marks.spec.js'
import './runner/to-timeline/to-timeline.spec.js'

import './runner/to-plots/to-plots.spec.js'

import './runner/run/run.spec.js'
import './runner/run/runner.spec.js'

import './plot/update.spec.js'

import './task/task.spec.js'
import './task/run.spec.js'
