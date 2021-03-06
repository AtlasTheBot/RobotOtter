module.exports.config = {
  name: 'strawpoll',
  invokers: ['strawpoll', 'sp'],
  help: 'Grabs the result of a strawpoll',
  expandedHelp: 'The id is the number after strawpoll.me/',
  usage: ['Get results', 'strawpoll 1234']
}

const fetch = require('node-fetch')
const endOfLine = require('os').EOL

module.exports.events = {}
module.exports.events.message = (bot, message) => {
  let args = bot.sleet.shlex(message.content)

  if (args[1] === undefined)
    return message.channel.send('I need a poll ID to work with.')

  if (Number.isNaN(+args[1]))
    return message.channel.send('Poll IDs are usually only numbers.')

  const url = 'http:\/\/www.strawpoll.me/api/v2/polls/' + args[1]
  const headers = {
    'User-Agent': 'Strawpoll for Terminal (By AtlasTheBot)'
  }

  fetch(url, { headers }).then(async response => {
    if (response.status === 200) {
      message.channel.send(sortVotes(await response.json()))
    } else if (response.status === 404) {
      message.channel.send('There\'s no strawpoll for that ID.')
    } else {
      message.channel.send('Something went wrong while trying to get that poll...')
    }
  })
}

function sortVotes(data) {
  let results = []
  for (let i = 0; i < data.options.length; i++) {
    results[i] = {'title': data.options[i], 'votes': data.votes[i]}
  }

  results = results.sort((a, b) => b.votes - a.votes)
  let sortedByVotes = {}

  for (let thing of results) {
    if (sortedByVotes[thing.votes] === undefined) sortedByVotes[thing.votes] = []
    sortedByVotes[thing.votes].push(thing.title)
  }

  let position = 1
  let totalVotes = data.votes.reduce((a,b)=>a+b)
  let list = '```py\n'

  for (let foo of Object.keys(sortedByVotes).reverse()) {
    list += `[${position}] ${sortedByVotes[foo][0]} # ${foo} vote${foo==1?'':'s'}\n`

    for (let j = 1; j < sortedByVotes[foo].length; j++) {
      list += `  L ${sortedByVotes[foo][j]} # ${foo} vote${foo==1?'':'s'}\n`
    }

    position++
  }

  list += '```'
  return {embed: {author: {name: data.title, url: `http:\/\/www.strawpoll.me/${data.id}`},
          description: list, footer: {text: `${totalVotes} vote${totalVotes==1?'':'s'}`} }}
}
