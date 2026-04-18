import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

const eventSourceTargets = {
    "iabilet-romania": "https://www.iabilet.ro/bilete-in-romania/",
    "iticket-events": "https://iticket.md/en/events/iticket",
    "iticket-home": "https://iticket.md/en",
} as const

const eventSourceProxy = (): Plugin => ({
    name: "event-source-proxy",
    configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
            const requestUrl = req.url || ""

            if (!requestUrl.startsWith("/__event-source/")) {
                next()
                return
            }

            const sourceKey = requestUrl
                .slice("/__event-source/".length)
                .split("?")[0] as keyof typeof eventSourceTargets
            const targetUrl = eventSourceTargets[sourceKey]

            if (!targetUrl) {
                res.statusCode = 404
                res.end("Unknown event source")
                return
            }

            try {
                const response = await fetch(targetUrl, {
                    headers: {
                        Accept: "text/html,application/xhtml+xml",
                        "User-Agent": "Mozilla/5.0 Fuse event fetcher",
                    },
                })

                if (!response.ok) {
                    res.statusCode = response.status
                    res.end(`Event source failed: ${response.status}`)
                    return
                }

                res.setHeader("Cache-Control", "public, max-age=300")
                res.setHeader("Content-Type", "text/html; charset=utf-8")
                res.end(await response.text())
            } catch (error) {
                res.statusCode = 502
                res.end(error instanceof Error ? error.message : "Event source failed")
            }
        })
    },
})

// https://vite.dev/config/
export default defineConfig({
    plugins: [eventSourceProxy(), react(), tailwindcss()],
    resolve: {
        alias: {
            "@": path.resolve(__dirname, "./src"),
        },
    },
})
