import fs from 'node:fs'
import path from 'node:path'
import { loadEnv, type Plugin } from 'vite'

/**
 * Kjører Vercel-funksjonene under /api i Vite-dev-serveren.
 *
 * Vite kan ingenting om /api – der ligger Vercel sine serverless-funksjoner,
 * som normalt bare finnes i `vercel dev` eller i et deploy. Uten dette svarer
 * `npm run dev` med 404 på POST /api/plan/bestill, og hele betalings- og
 * kodeflyten er umulig å prøve lokalt.
 *
 * Bare i dev (`apply: 'serve'`). I produksjon er det Vercel som kjører dem.
 */
export default function apiDev(): Plugin {
  return {
    name: 'minio-api-dev',
    apply: 'serve',

    /**
     * Vite eksponerer bare VITE_*-variabler, og bare til klienten – ikke i
     * process.env. Serverfunksjonene leser process.env (FIREBASE_SERVICE_ACCOUNT,
     * VIPPS_*, RESEND_API_KEY …), så .env må inn dit manuelt. Uten dette svarer
     * endepunktene «… mangler i miljøet» selv når verdien står i .env.
     */
    config(_, { mode }) {
      const env = loadEnv(mode, process.cwd(), '')
      for (const [nokkel, verdi] of Object.entries(env)) {
        if (process.env[nokkel] === undefined) process.env[nokkel] = verdi
      }
    },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next()

        const pathname = req.url.split('?')[0]
        // /api/plan/bestill → <rot>/api/plan/bestill.ts
        const fil = path.resolve(server.config.root, `${pathname.replace(/^\//, '')}.ts`)
        if (!fil.startsWith(path.resolve(server.config.root, 'api')) || !fs.existsSync(fil)) {
          return next()
        }

        try {
          // Vercel parser JSON-kroppen selv; Connect gjør det ikke.
          const biter: Buffer[] = []
          for await (const bit of req) biter.push(bit as Buffer)
          const raw = Buffer.concat(biter).toString('utf8')

          const vreq = req as typeof req & { body?: unknown; query?: Record<string, string> }
          vreq.body = raw ? JSON.parse(raw) : {}
          vreq.query = Object.fromEntries(new URL(req.url, 'http://localhost').searchParams)

          // Vercel sin res har .status()/.json()/.send(); Node sin har ikke.
          const vres = res as typeof res & {
            status: (kode: number) => typeof vres
            json: (data: unknown) => typeof vres
            send: (data: string) => typeof vres
          }
          vres.status = (kode) => { res.statusCode = kode; return vres }
          vres.json = (data) => {
            if (!res.headersSent) res.setHeader('Content-Type', 'application/json; charset=utf-8')
            res.end(JSON.stringify(data))
            return vres
          }
          vres.send = (data) => { res.end(data); return vres }

          const mod = await server.ssrLoadModule(fil)
          const handler = mod.default as (a: unknown, b: unknown) => Promise<void>
          if (typeof handler !== 'function') {
            throw new Error(`${pathname} har ingen default-eksportert handler.`)
          }
          await handler(vreq, vres)
        } catch (e) {
          const melding = e instanceof Error ? e.message : 'Ukjent feil'
          server.config.logger.error(`[api-dev] ${pathname}: ${melding}`)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json; charset=utf-8')
          }
          res.end(JSON.stringify({ error: melding }))
        }
      })
    },
  }
}
