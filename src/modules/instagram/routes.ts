import axios from 'axios'
import sharp from 'sharp'
import z from 'zod'

import { FastifyInstance } from 'fastify'
import { IgApiClient } from 'instagram-private-api'
import { decrypt } from '../../helpers/encrypter'

export async function instagramProviderRoutes(app: FastifyInstance) {
  app.route({
    method: 'POST',
    url: '/providers/instagram/publish',
    handler: async (request, reply) => {
      const ig = new IgApiClient()

      const schema = z.object({
        image: z.object({
          url: z.string(),
          params: z.any().optional(),
        }),
        caption: z.string(),
        comments: z.array(z.string()).optional(),
        token: z.string(),
      })

      

      const payload = schema.safeParse(request.body)

      if (!payload.success) {
        return reply.status(400).send(payload.error.message)
      }

      const { image, caption, comments, token } = payload.data

      const decodedToken = decrypt(token)

      if(!decodedToken) {
        return reply.status(400).send('Invalid token')
      }

      const account = {
        username: decodedToken.split(':')[0],
        password: decodedToken.split(':')[1],
      }

      async function login() {
        ig.state.generateDevice(account.username)
        await ig.account.login(account.username, account.password)
      }

      await login()

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

      reply.log.info('publishing image...')
      const publishResult = await ig.publish.photo({
        file: convertedBuffer,
        caption,
      })

      reply.log.info('image published!')
      if (comments && comments.length > 0) {
        const mediaId = publishResult.media.pk

        for (const comment of comments) {
          reply.log.info(`commenting: ${comment}`)
          await ig.media.comment({
            mediaId,
            text: comment,
          })
        }
      }

      return publishResult
    },
  })
}
