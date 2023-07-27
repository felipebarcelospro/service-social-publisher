import fastify from 'fastify'

import { ZodError } from 'zod'
import { instagramProviderRoutes } from './modules/instagram/routes'
import { telegramProviderRoutes } from './modules/telegram/routes'
import { twitterProviderRoutes } from './modules/twitter/routes'

const app = fastify({
  logger: true,
})

app.register(twitterProviderRoutes)
app.register(telegramProviderRoutes)
app.register(instagramProviderRoutes)

// app.register(discordProviderRoutes)
// app.register(slackProviderRoutes)

app.setErrorHandler((error, request, reply) => {
  console.log(error)

  if (error instanceof ZodError) {
    reply.status(400).send({
      status: 400,
      success: false,
      error: error.errors,
    })

    return
  }

  reply.status(500).send({
    status: 500,
    success: false,
    error: error.message,
  })
})

const start = async () => {
  try {
    await app.listen({ port: 3000 })
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }
}

start()
