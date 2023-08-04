import z from 'zod'

import { FastifyInstance } from 'fastify'
import { TwitterApi } from 'twitter-api-v2'
import { decrypt } from '../../helpers/encrypter'

export async function twitterProviderRoutes(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/providers/twitter/publish',
    handler: async (request, reply) => {
      const schema = z.object({
        caption: z.string(),
        comments: z.array(z.string()).optional(),
        token: z.string(),
      })

      const payload = schema.safeParse(request.body)

      if (!payload.success) {
        return reply.status(400).send(payload.error.message)
      }

      const { caption, comments, token } = payload.data

      const decodedToken = decrypt(token)

      if(!decodedToken) {
        return reply.status(400).send('Invalid token')
      }

      const account = {
        appKey: decodedToken.split(':')[0],
        appSecret: decodedToken.split(':')[1],
        accessToken: decodedToken.split(':')[2],
        accessSecret: decodedToken.split(':')[3],
      }

      const twitterClient = new TwitterApi(account)

      try {
        const response = await twitterClient.v2.tweet({
          text: caption,
        })

        if (comments && comments.length > 0) {
          const tweetId = await response.data.id
          for (const comment of comments) {
            await twitterClient.v2.tweet({
              text: comment,
              reply: {
                in_reply_to_tweet_id: tweetId,
              },
            })
          }
        }

        return response.data
      } catch (error) {
        console.error('Error posting tweet:', error)
        return reply.status(500).send('Error posting tweet')
      }
    },
  })
}
