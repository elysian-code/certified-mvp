interface MonitoringEvent {
  type: "error" | "warning" | "info" | "security"
  message: string
  metadata?: Record<string, any>
  timestamp: string
  userId?: string
  sessionId?: string
}

class MonitoringService {
  private events: MonitoringEvent[] = []
  private maxEvents = 1000

  log(event: Omit<MonitoringEvent, "timestamp">) {
    const fullEvent: MonitoringEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    }

    this.events.push(fullEvent)

    // Keep only recent events
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    const logLevel = event.type === "error" ? "error" : event.type === "warning" ? "warn" : "info"

    console[logLevel](`[MONITORING] ${event.type.toUpperCase()}:`, {
      message: event.message,
      metadata: event.metadata,
      timestamp: fullEvent.timestamp,
      userId: event.userId,
      sessionId: event.sessionId,
    })

    if (process.env.NODE_ENV === "production") {
      this.sendToMonitoringService(fullEvent)
    }
  }

  private async sendToMonitoringService(event: MonitoringEvent) {
    // In production, integrate with services like Sentry, DataDog, etc.
    try {
      // await fetch('/api/monitoring', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(event)
      // })
    } catch (error) {
      console.error("[MONITORING] Failed to send event to monitoring service:", error)
    }
  }

  getRecentEvents(limit = 100): MonitoringEvent[] {
    return this.events.slice(-limit)
  }

  getEventsByType(type: MonitoringEvent["type"], limit = 100): MonitoringEvent[] {
    return this.events.filter((event) => event.type === type).slice(-limit)
  }
}

export const monitoring = new MonitoringService()

export function logSecurityEvent(message: string, metadata?: Record<string, any>, userId?: string) {
  monitoring.log({
    type: "security",
    message,
    metadata,
    userId,
  })
}

export function logError(error: Error, metadata?: Record<string, any>, userId?: string) {
  monitoring.log({
    type: "error",
    message: error.message,
    metadata: {
      ...metadata,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
    },
    userId,
  })
}

export function logWarning(message: string, metadata?: Record<string, any>, userId?: string) {
  monitoring.log({
    type: "warning",
    message,
    metadata,
    userId,
  })
}

export function logInfo(message: string, metadata?: Record<string, any>, userId?: string) {
  monitoring.log({
    type: "info",
    message,
    metadata,
    userId,
  })
}
