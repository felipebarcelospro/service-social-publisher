import axios from 'axios'

import { WebClient } from '@slack/web-api'
import { randomUUID } from 'crypto'

type Session = {
  id: string
  client: WebClient
  auth: {
    token: string
    url: string
  }
}

export class SlackProvider {
  static sessions: Session[] = []

  static connect({
    auth,
  }: {
    auth: {
      token: string
      url: string
    }
  }) {
    const client = new WebClient(auth.token)

    const session = {
      id: randomUUID(),
      auth,
      client,
    }

    this.sessions.push(session)

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

    await axios.post(session.auth.url, {
      channel: channelId,
      text: message,
    })

    return {
      success: true,
    }
  }
}
