const request = require('request')
const bodyParser = require('body-parser')
const Commands = require('@probot/commands')
const timeout = require('connect-timeout')

const validate = require('./middleware/validate')

module.exports = robot => {
  // FIXME: pass in as argument
  const options = {
    token: process.env.SLACK_VERIFICATION_TOKEN,
    commandTimeout: 1000 * 2.5,
    ackResponse: {response_type: 'in_channel'}
  }

  // FIXME: this will move into Probot once the dust settles
  robot.commands = new Commands()

  const app = robot.route('/slack')

  app.use(bodyParser.json())
  app.use(bodyParser.urlencoded({ extended: true }))

  app.post('/command',
    timeout(options.commandTimeout, {respond: false}),
    validate(options.token),
    receiveCommand
  )

  async function receiveCommand (req, res) {
    const { command, text, ...context } = req.body

    const respond = async (message) => {
      if (res.headersSent) {
        const options = {
          url: context.response_url,
          body: message,
          json: true
        }

        await new Promise((resolve, reject) => {
          request.post(options, function (error, response, body) {
            error ? reject(error) : resolve(response)
          })
        })
      } else {
        return res.json(message)
      }
    }

    req.on('timeout', () => {
      req.log('Command taking too long. Switching to delayed response.')

      // Ack the command
      respond(options.ackResponse)
    })

    const message = await robot.commands.invoke({
      name: command.replace(/^\//, ''),
      args: text.split(' '),
      context,
      respond
    })

    if (message) {
      return respond(message)
    }
  }

  // FIXME: remove before shipping
  app.use((err, req, res, next) => {
    robot.log.warn({err})
    res.status(500)
  })
}
