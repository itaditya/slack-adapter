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

  test('passes args', async () => {
    const action = jest.fn()
    robot.commands.register({name: 'test', action})

    const command = fixture({command: '/test', text: 'hello world'})
    await request.post('/slack/command').use(slackbot).send(command).expect(200)

    expect(action).toHaveBeenCalledWith(expect.objectContaining({
      name: 'test',
      args: ['hello', 'world'],
      context: expect.objectContaining({team_id: 'T0001'})
    }), expect.any(Function))
  })

  test('does not call command with invalid token', async () => {
    const command = fixture({command: '/echo', token: 'invalid'})
    await request.post('/slack/command').use(slackbot).send(command).expect(500)
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

  test.only('responds with 200 before timeout', async (done) => {
    robot.commands.register({
      name: 'delay',
      action (command) {
        return new Promise((resolve) => {
          setTimeout(() => resolve({text: 'real response'}), 2501)
        })
      }
    })

    nock('https://hooks.slack.com')
      .post('/commands/1234/5678', { text: 'real response' })
      .reply(200, 'ok')

    const command = fixture({command: '/delay'})

    await request.post('/slack/command').use(slackbot).send(command)
      .expect(200, {response_type: 'in_channel'})

    // Wait a little longer for async response to be sent
    // FIXME: figure out a cleaner way to do this
    setTimeout(done, 100)
  })

  // TODO
  // - error handling
})
