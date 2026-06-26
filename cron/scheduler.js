// Standalone cron scheduler — runs as separate Docker service
// Calls the /api/discover/refresh endpoint every 6 hours

const https = require("http")

const APP_URL = process.env.APP_URL || "http://app:8080"
const CRON_SECRET = process.env.CRON_SECRET || "jobos-cron-secret"
const INTERVAL_HOURS = parseFloat(process.env.REFRESH_INTERVAL_HOURS || "6")
const INTERVAL_MS = INTERVAL_HOURS * 60 * 60 * 1000

async function triggerRefresh() {
  console.log(`[CRON ${new Date().toISOString()}] Triggering job refresh...`)
  
  const url = new URL(`${APP_URL}/api/discover/refresh`)
  
  return new Promise((resolve, reject) => {
    const req = https.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-cron-secret": CRON_SECRET,
          "Cookie": "", // will use cron secret auth
        },
      },
      (res) => {
        let data = ""
        res.on("data", chunk => data += chunk)
        res.on("end", () => {
          try {
            const json = JSON.parse(data)
            console.log(`[CRON] Refresh complete:`, json)
          } catch {
            console.log(`[CRON] Response:`, data.slice(0, 200))
          }
          resolve(null)
        })
      }
    )
    req.on("error", err => {
      console.error(`[CRON] Error:`, err.message)
      resolve(null) // Don't reject — just log and continue
    })
    req.setTimeout(300000, () => {
      console.log("[CRON] Request timed out after 5 minutes")
      req.destroy()
      resolve(null)
    })
    req.end()
  })
}

async function main() {
  console.log(`[CRON] Scheduler started. Refresh interval: ${INTERVAL_HOURS}h`)
  
  // Wait 60 seconds for app to start, then do initial fetch
  setTimeout(async () => {
    await triggerRefresh()
    
    // Then repeat every N hours
    setInterval(triggerRefresh, INTERVAL_MS)
  }, 60000)
}

main().catch(console.error)
