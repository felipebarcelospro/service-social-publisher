import z from 'zod'

import { FastifyInstance } from 'fastify'
import { TwitterApi } from 'twitter-api-v2'

export async function twitterProviderRoutes(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/providers/twitter/publish',
    handler: async (request, reply) => {
      const schema = z.object({
        caption: z.string(),
        comments: z.array(z.string()).optional(),
        account: z.object({
          appKey: z.string(),
          appSecret: z.string(),
          accessToken: z.string(),
          accessSecret: z.string(),
        }),
      })

      const payload = schema.safeParse(request.body)

      if (!payload.success) {
        return reply.status(400).send(payload.error.message)
      }

      const { caption, comments } = payload.data

      const twitterClient = new TwitterApi(payload.data.account)

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
