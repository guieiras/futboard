const POSITION_STATS = {
  'GL': { move: [1, 0, 0, 0], dribble: 0, shoot: [2], pass: [17], steal: [2] },
  'GL+': { move: [1, 0, 0, 0], dribble: 0, shoot: [3], pass: [17], steal: [2] },
  'DL': { move: [0, 0, 1, 0], dribble: 0, shoot: [2, 3, 4], pass: [14], steal: [3] },
  'DL+': { move: [0, 0, 1, 0], dribble: 0, shoot: [3, 4, 5], pass: [14, 17], steal: [3, 4] },
  'DF': { move: [0, 1, 0, 0], dribble: 0, shoot: [1, 2], pass: [11], steal: [5] },
  'DF+': { move: [0, 1, 0, 0], dribble: 0, shoot: [1, 2], pass: [11], steal: [6] },
  'MD': { move: [0, 1, 0, 0], dribble: 0, shoot: [4, 5], pass: [11], steal: [3, 4] },
  'MD+': { move: [0, 0.9, 0.1, 0], dribble: 0, shoot: [5, 6], pass: [11, 14], steal: [3, 4, 5] },
  'MC': { move: [0, 1, 0, 0], dribble: 0, shoot: [4, 5], pass: [14], steal: [2, 3, 4] },
  'MC+': { move: [0, 0.5, 0.5, 0], dribble: 0, shoot: [6], pass: [14, 17], steal: [2, 3] },
  'MCO': { move: [0, 0.8, 0.2, 0], dribble: 0.5, shoot: [4, 5], pass: [14], steal: [1, 2] },
  'MCO+': { move: [0, 0,7, 0.3, 0], dribble: 0.6, shoot: [6, 7], pass: [14, 17], steal: [1, 2] },
  'ML': { move: [0, 0.6, 0.4, 0], dribble: 0.5, shoot: [5, 6], pass: [14], steal: [1, 2] },
  'ML+': { move: [0, 0.4, 0.6, 0], dribble: 0.6, shoot: [6], pass: [14, 17], steal: [1, 2] },
  'AL': { move: [0, 0, 1, 0], dribble: 0.5, shoot: [7, 8], pass: [14], steal: [1] },
  'AL+': { move: [0, 0, 0.2, 0.8], dribble: 0.7, shoot: [8, 9], pass: [14], steal: [1] },
  'AC': { move: [0, 0.5, 0.5, 0], dribble: 0.5, shoot: [8, 9], pass: [14], steal: [1] },
  'AC+': { move: [0, 0, 0.5, 0.5], dribble: 0.6, shoot: [9, 10], pass: [14], steal: [1] },
  'SA': { move: [0, 0, 1, 0], dribble: 0.5, shoot: [8], pass: [14], steal: [1] },
  'SA+': { move: [0, 0, 1, 0], dribble: 0.6, shoot: [9], pass: [14], steal: [1] }
}

export function processTemplate (players, templatePlayers) {
  return players.map((player) => {
    const playerData = templatePlayers.find(({ face }) => face === player.face)

    if (!playerData) return player
    const template = playerData.template || ''

    const handleValue = (fromData, fromTemplate) => fromData === undefined ? fromTemplate : fromData
    const position = handleValue(playerData.position, template.replace(/\++/, ''))
    const star = handleValue(playerData.star, template.includes('+'))
    const templateConfig = position + (star ? '+' : '')

    return {
      name: playerData.name, face: player.face, position, star,
      ...randomizeStats(templateConfig, playerData)
    }
  })
}

export function randomizeStats (template, playerData) {
  const templateConfig = POSITION_STATS[template]
  const handleStat = (value, defaultValue, callback) => value === undefined ? (template ? callback(templateConfig) : defaultValue) : value

  const move = handleStat(playerData.move, 11, ({ move }) => {
    const random = Math.random()

    if (random <= move[0]) return 1
    if (random <= move[0] + move[1]) return 2
    if (random <= move[0] + move[1] + move[2]) return 3
    return 4
  })
  const dribble = handleStat(playerData.dribble, false, ({ dribble }) => Math.random() <= dribble)
  const shoot = handleStat(playerData.shoot, 0, ({ shoot }) => shoot[Math.floor(Math.random() * shoot.length)])
  const pass = handleStat(playerData.pass, 11, ({ pass }) => pass[Math.floor(Math.random() * pass.length)])
  const steal = handleStat(playerData.steal, 0, ({ steal }) => steal[Math.floor(Math.random() * steal.length)])

  return { dribble, move, shoot, pass, steal }
}
