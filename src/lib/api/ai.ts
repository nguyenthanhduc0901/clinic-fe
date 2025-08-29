export type DermAlt = { class: string; confidence: number }
export type DermPredictionResponse = {
  prediction: string
  confidence: number
  all_confidences?: Record<string, number>
  top_alternatives?: DermAlt[]
  recommendation?: string
}

/**
 * Calls AI server to predict dermatology condition from an image Data URI.
 * The image must be a Data URI (e.g., "data:image/jpeg;base64,....").
 */
export async function predictDermatology(imageDataUri: string, opts?: { signal?: AbortSignal }): Promise<DermPredictionResponse> {
  const baseUrl = (import.meta as any).env?.VITE_AI_SERVER_BASE_URL as string | undefined
  if (!baseUrl) {
    throw new Error('Thiếu cấu hình VITE_AI_SERVER_BASE_URL')
  }
  const url = `${baseUrl.replace(/\/$/, '')}/v1/vision/predict`

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageDataUri }),
    signal: opts?.signal,
  })

  if (!res.ok) {
    let message = `AI request thất bại (${res.status})`
    try {
      const data = await res.json()
      message = data?.message || data?.error || message
    } catch {}
    const err: any = new Error(message)
    err.status = res.status
    throw err
  }

  return res.json() as Promise<DermPredictionResponse>
}

export type TextAnalyzeResponse = {
  raw?: string
  json?: {
    symptom?: string[]
    diagnosis?: string
    [k: string]: any
  }
}

export async function analyzeMedicalText(payload: { text?: string; texts?: string[]; raw?: string; json?: any }, opts?: { signal?: AbortSignal }): Promise<TextAnalyzeResponse> {
  const baseUrl = (import.meta as any).env?.VITE_AI_SERVER_BASE_URL as string | undefined
  if (!baseUrl) {
    throw new Error('Thiếu cấu hình VITE_AI_SERVER_BASE_URL')
  }
  const url = `${baseUrl.replace(/\/$/, '')}/v1/text/analyze`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    signal: opts?.signal,
  })
  if (!res.ok) {
    let message = `AI text request thất bại (${res.status})`
    try { const data = await res.json(); message = data?.message || data?.error || message } catch {}
    const err: any = new Error(message)
    err.status = res.status
    throw err
  }
  return res.json() as Promise<TextAnalyzeResponse>
}

// Removed legacy audio upload helper per new Web Speech flow


