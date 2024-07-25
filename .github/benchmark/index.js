import cluster from 'node:cluster'

import constants from './process/constants/constants.js'
import primary from './process/primary.js'
import worker from './process/worker.js'

cluster.isPrimary
  ? primary(cluster, await constants(cluster))
  : worker()
