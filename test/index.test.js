const createProbot = require('probot')
const nock = require('nock')
const supertest = require('supertest')

const slackbot = require('./slackbot')
const fixture = require('./fixtures/command')

const adapter = require('..')

nock.disableNetConnect()
nock.enableNetConnect('127.0.0.1')

process.env.SLACK_VERIFICATION_TOKEN = 'test'

describe('commands', () => {
  let request, robot, probot

  // Expect there are no more pending nock requests
  beforeEach(async () => nock.cleanAll())
  afterEach(() => expect(nock.pendingMocks()).toEqual([]))

  beforeEach(() => {
    probot = createProbot({})
    robot = probot.load(adapter)

    robot.commands.register({
      name: 'echo',
      action (command) {
        return command.args.join(' ')
      }
    })

    request = supertest.agent(probot.server)
  })

  test('receives the commands', async () => {
    const command = fixture({command: '/echo', text: 'hello world'})
    await request.post('/slack/command').use(slackbot).send(command)
      .expect(200, '"hello world"')
  })

  test('does not call command with invalid token', async () => {
    const command = fixture({command: '/echo', token: 'invalid'})
    await request.post('/slack/command').use(slackbot).send(command)
      .expect(500)
  })

  test('allows responding with command.respond', async () => {
    robot.commands.register({
      name: 'progress',
      action (command) {
        command.respond('responded')
      }
    })

    const command = fixture({command: '/progress'})
    await request.post('/slack/command').use(slackbot).send(command)
      .expect(200, '"responded"')
  })

  // TODO
  // - error handling
  // - response_url
  // - timeout
})
