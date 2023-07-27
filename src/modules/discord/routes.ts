import z from 'zod'

import { FastifyInstance } from 'fastify'
import { DiscordProvider } from './provider'

export async function discordProviderRoutes(app: FastifyInstance) {
  app.addHook('onReady', () => {
    DiscordProvider.init()
    console.log('Discord provider ready')
  })

  app.route({
    method: 'POST',
    url: '/providers/discord/sessions/connect',
    handler: async (request, reply) => {
      const schema = z.object({
        account: z.object({
          token: z.string(),
          webhook: z.string(),
        }),
      })

      const payload = schema.parse(request.body)

      try {
        const response = DiscordProvider.connect(payload.account)
        return response
      } catch (error) {
        console.error('Error connecting to Discord:', error)
        return reply.status(500).send('Error connecting to Discord')
      }
    },
  })

  app.route({
    method: 'POST',
    url: '/providers/discord/sessions/:sessionId/webhook',
    handler: async (request, reply) => {
      const schema = z.object({
        sessionId: z.string(),
        webhook: z.string(),
      })

      const payload = schema.parse({
        ...(request.body as any),
        ...(request.params as any),
      })

      try {
        const response = DiscordProvider.addWebhook(payload)
        return response
      } catch (error) {
        console.error('Error connecting to Discord:', error)
        return reply.status(500).send('Error connecting to Discord')
      }
    },
  })

  app.route({
    method: 'POST',
    url: '/providers/discord/sessions/:sessionId/publish',
    handler: async (request, reply) => {
      const schema = z.object({
        sessionId: z.string(),
        channelId: z.string(),
        message: z.string(),
      })

      const payload = schema.parse({
        ...(request.body as any),
        ...(request.params as any),
      })

      try {
        const response = await DiscordProvider.publish(payload)
        return response
      } catch (error) {
        console.error('Error publishing to Discord:', error)
        return reply.status(500).send('Error publishing to Discord')
      }
    },
  })
}
