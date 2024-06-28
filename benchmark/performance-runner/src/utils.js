const round = num => Math.round((num + Number.EPSILON) * 100) / 100
const toMB = bytes => round(bytes / 1000 / 1000)

export default { round, toMB }
