const Commands = require('@probot/commands')
const bodyParser = require('body-parser')

const validate = require('./middleware/validate')

module.exports = robot => {
  // FIXME: pass in as argument
  const options = {
    token: process.env.SLACK_VERIFICATION_TOKEN,
    commandTimeout: 1000 * 2.5
  }

  // FIXME: this will move into Probot once the dust settles
  robot.commands = new Commands()

  const app = robot.route('/slack')

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.post('/command', validate(options.token), async (req, res) => {
    const { command, text, ...context } = req.body

    const respond = (message) => res.json(message)

    const message = await robot.commands.invoke({
      name: command.replace(/^\//, ''),
      args: text.split(' '),
      context,
      respond
    })

    if (message) {
      respond(message)
    }
  })

  // FIXME: remove before shipping
  app.use((err, req, res, next) => {
    robot.log.warn(err)
    res.status(500).send(err.message)
  })
}
