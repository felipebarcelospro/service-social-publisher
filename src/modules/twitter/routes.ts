import axios from 'axios'
import sharp from 'sharp'
import Twit from 'twit'
import z from 'zod'

import { FastifyInstance } from 'fastify'

export async function twitterProviderRoutes(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/providers/twitter/publish',
    handler: async (request, reply) => {
      const schema = z.object({
        caption: z.string(),
        comments: z.array(z.string()).optional(),
        image: z.object({
          url: z.string(),
          params: z.any().optional(),
        }),
        account: z.object({
          consumer_key: z.string(),
          consumer_secret: z.string(),
        }),
      })

      const payload = schema.safeParse(request.body)

      if (!payload.success) {
        return reply.status(400).send(payload.error.message)
      }

      const { caption, image, comments, account } = payload.data

      const twit = new Twit({
        consumer_key: account.consumer_key,
        consumer_secret: account.consumer_secret,
        access_token: '1547957477718630409-lgMaJJpLzMhoNbG7LSfXniA8o3NQ0m',
        access_token_secret: '7dzTL5F5erZza0VrEzzVTp0hzmTI5Sg82pAJ6uwT3Bnb6',
      })

      try {
        let mediaId

        if (image) {
          // buffer from URL
          reply.log.info('getting image from URL...')
          const outputBuffer = await axios
            .request({
              url: image.url,
              params: image.params,
              responseType: 'arraybuffer',
            })
            .then((r) => Buffer.from(r.data))

          reply.log.info('resizing image...')
          const convertedBuffer = await sharp(outputBuffer)
            .resize(1080, 1080, { fit: 'cover' })
            .jpeg({ quality: 80 }) // Define a qualidade do JPEG para 80% (ajuste conforme necessário)
            .toBuffer()

          const { data } = (await twit.post('media/upload', {
            media_data: convertedBuffer,
          })) as { data: { media_id_string: string } }

          mediaId = data.media_id_string
        }

        const params = { status: caption } as {
          status: string
          media_ids?: string[]
        }

        if (mediaId) {
          params.media_ids = [mediaId]
        }

        const response = (await twit.post('statuses/update', params)) as {
          data: { id_str: string }
        }

        if (comments && comments.length > 0) {
          const tweetId = response.data.id_str
          for (const comment of comments) {
            await twit.post('statuses/update', {
              status: comment,
              in_reply_to_status_id: tweetId,
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
