const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const toMB = bytes => round(bytes / 1000 / 1000)
const toMillis = num => round(num) + ' ms'

export default { round, toMB, toMillis }
