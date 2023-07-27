import { randomUUID } from 'crypto'
import { ChannelType, Client, GatewayIntentBits } from 'discord.js'

type Session = {
  id: string
  token: string
  client: Client
  webhook?: string | null
}

export class DiscordProvider {
  static sessions: Session[] = []

  static connect({
    token,
    webhook,
  }: {
    token: string
    webhook?: string | null
  }) {
    const client = new Client({
      intents: [
        'Guilds',
        'GuildMessages',
        'GuildMessageReactions',
        GatewayIntentBits.MessageContent,
      ],
    })

    client.login(token)

    const session = {
      id: randomUUID(),
      token,
      client,
      webhook,
    }

    this.sessions.push(session)

    this.initializeSession(session)

    return session
  }

  static async publish({
    sessionId,
    channelId,
    message,
  }: {
    sessionId: string
    channelId: string
    message: string
  }) {
    const session = this.sessions.find((session) => session.id === sessionId)

    if (!session) {
      throw new Error('Session not found')
    }

    const channel = await session.client.channels.fetch(channelId)

    if (
      !channel ||
      !channel.isTextBased ||
      channel.type !== ChannelType.GuildText
    ) {
      throw new Error('Channel not found')
    }

    await channel.send(message)

    return {
      success: true,
    }
  }

  static async addWebhook({
    sessionId,
    webhook,
  }: {
    sessionId: string
    webhook: string
  }) {
    const session = this.sessions.find((session) => session.id === sessionId)

    if (!session) {
      throw new Error('Session not found')
    }

    session.webhook = webhook

    return {
      success: true,
    }
  }

  static initializeSession(session: Session) {
    session.client.on('messageCreate', async (message) => {
      console.log(message)

      if (message.content === '/start') {
        const responseText = `Olá! Seu chatId é ${message.channel.id}.`

        await message.reply(responseText)
      }
    })
  }

  static init() {
    this.sessions.forEach(this.initializeSession)
  }
}
