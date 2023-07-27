import axios from 'axios'
import z from 'zod'

import { FastifyInstance } from 'fastify'

export async function telegramProviderRoutes(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/providers/telegram/publish',
    handler: async (request, reply) => {
      const schema = z.object({
        caption: z.string(),
        account: z.object({
          token: z.string(),
          chatId: z.string(),
        }),
      })

      const payload = schema.safeParse(request.body)

      if (!payload.success) {
        return reply.status(400).send(payload.error.message)
      }

      const { caption, account } = payload.data
      const { chatId, token } = account

      try {
        const response = await axios.post(
          `https://api.telegram.org/bot${token}/sendMessage`,
          {
            chat_id: Number(chatId),
            text: caption,
          },
        )

        return response.data
      } catch (error) {
        console.error('Error sending Telegram message:', error)
        return reply.status(500).send('Error sending Telegram message')
      }
    },
  })

  app.route({
    method: 'POST',
    url: '/providers/telegram/webhook/:botToken',
    handler: async (request, reply) => {
      const { botToken } = request.params as { botToken: string }
      const { message } = request.body as {
        message: { chat: { id: string }; text: string }
      }
      const { chat, text } = message

      if (text === '/start') {
        const chatId = chat.id
        const responseText = `Olá! Seu chatId é ${chatId}. Por favor, acesse o link para configurar o GetFeed: https://getfeed.com.br/auth`

        try {
          await axios.post(
            `https://api.telegram.org/bot${botToken}/sendMessage`,
            {
              chat_id: chatId,
              text: responseText,
            },
          )

          return reply.send()
        } catch (error) {
          console.error('Error sending Telegram message:', error)
          return reply.status(500).send('Error sending Telegram message')
        }
      }

      return reply.send()
    },
  })
}
