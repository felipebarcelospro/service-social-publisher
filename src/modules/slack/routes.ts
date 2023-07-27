import z from 'zod'

import { FastifyInstance } from 'fastify'
import { SlackProvider } from './provider'

export async function slackProviderRoutes(app: FastifyInstance) {
  app.addHook('onReady', () => {
    console.log('Slack provider ready')
  })

  app.route({
    method: 'POST',
    url: '/providers/slack/sessions/connect',
    handler: async (request, reply) => {
      const schema = z.object({
        account: z.object({
          token: z.string(),
          url: z.string(),
        }),
      })

      const payload = schema.parse(request.body)

      try {
        const response = SlackProvider.connect({
          auth: payload.account,
        })
        return response
      } catch (error) {
        console.error('Error connecting to slack:', error)
        return reply.status(500).send('Error connecting to slack')
      }
    },
  })

  app.route({
    method: 'POST',
    url: '/providers/slack/sessions/:sessionId/publish',
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
        const response = await SlackProvider.publish(payload)
        return response
      } catch (error) {
        console.error('Error publishing to slack:', error)
        return reply.status(500).send('Error publishing to slack')
      }
    },
  })
}
