interface APIResponse<T = any> {
  data?: T
  error?: {
    code: string
    message: string
  }
}

class APIError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number,
  ) {
    super(message)
    this.name = "APIError"
  }
}

export class APIClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>

  constructor(baseURL = "/api") {
    this.baseURL = baseURL
    this.defaultHeaders = {
      "Content-Type": "application/json",
    }
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseURL}${endpoint}`

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.defaultHeaders,
        ...options.headers,
      },
      // Add CSRF protection
      credentials: "same-origin",
    }

    try {
      const response = await fetch(url, config)

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        let errorCode = "HTTP_ERROR"

        try {
          const errorData = await response.json()
          if (errorData.error) {
            errorMessage = errorData.error.message || errorMessage
            errorCode = errorData.error.code || errorCode
          }
        } catch {
          // If JSON parsing fails, use default error message
        }

        throw new APIError(errorMessage, errorCode, response.status)
      }

      const data: APIResponse<T> = await response.json()

      if (data.error) {
        throw new APIError(data.error.message, data.error.code, response.status)
      }

      return data.data || (data as T)
    } catch (error) {
      if (error instanceof APIError) {
        throw error
      }

      if (error instanceof TypeError && error.message.includes("fetch")) {
        throw new APIError("Network error. Please check your connection.", "NETWORK_ERROR", 0)
      }

      throw new APIError("An unexpected error occurred.", "UNKNOWN_ERROR", 0)
    }
  }

  async get<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
    const url = params ? `${endpoint}?${new URLSearchParams(params).toString()}` : endpoint

    return this.request<T>(url, { method: "GET" })
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" })
  }
}

export const apiClient = new APIClient()

export function handleAPIError(error: unknown): string {
  if (error instanceof APIError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return "An unexpected error occurred. Please try again."
}
