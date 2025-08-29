import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { analyzeMedicalText, type TextAnalyzeResponse } from '@/lib/api/ai'

export default function TextAIAnalyzer({
  initialTranscript,
  onInsertSymptoms,
  onInsertDiagnosis,
}: {
  initialTranscript?: string
  onInsertSymptoms: (symptomsCsv: string) => void
  onInsertDiagnosis: (diagnosis: string) => void
}) {
  const [text, setText] = useState<string>(initialTranscript || '')
  const [loading, setLoading] = useState(false)
  const [res, setRes] = useState<TextAnalyzeResponse | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => () => { abortRef.current?.abort() }, [])

  const analyze = async () => {
    if (!text.trim()) { toast.error('Vui lòng nhập transcript'); return }
    try {
      setLoading(true)
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const payload = { text }
      const out = await Promise.race([
        analyzeMedicalText(payload, { signal: abortRef.current.signal }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Quá thời gian (timeout)')), 600_000)),
      ])
      setRes(out as TextAnalyzeResponse)
    } catch (e: any) {
      const status = e?.status
      if (status === 400) toast.error('Thiếu text/texts hoặc dữ liệu rỗng (400)')
      else if (status === 500) toast.error('Model chưa sẵn sàng hoặc thiếu GGUF (500)')
      else toast.error(e?.message || 'Lỗi phân tích AI (text)')
    } finally { setLoading(false) }
  }

  const symptomsCsv = useMemo(() => (res?.json?.symptom || []).join(', '), [res])
  const diagnosis = useMemo(() => res?.json?.diagnosis || '', [res])

  const copy = async (value: string) => {
    try { await navigator.clipboard.writeText(value); toast.success('Đã copy') } catch { toast.error('Copy thất bại') }
  }

  return (
    <div className="mt-2 p-3 rounded-md border bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">AI Text Analyze</div>
        <div className="text-xs text-neutral-500">Không gửi thông tin định danh</div>
      </div>
      <textarea
        className="w-full rounded-md border px-3 py-2 h-28"
        placeholder="Dán transcript (hội thoại) tại đây..."
        value={text}
        onChange={(e)=> setText(e.target.value)}
      />
      <div className="mt-2 flex gap-2">
        <Button type="button" onClick={analyze} loading={loading}>Phân tích AI</Button>
        <Button type="button" variant="ghost" onClick={()=> setRes(null)} disabled={loading}>Xóa kết quả</Button>
      </div>
      {res && (
        <div className="mt-3 space-y-2 text-sm">
          <div>
            <div className="font-medium mb-1">Symptoms</div>
            <div className="flex flex-wrap gap-1 mb-2">
              {(res.json?.symptom || []).map((s, i) => (
                <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary-700 dark:text-primary-300">{s}</span>
              ))}
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={()=> onInsertSymptoms(symptomsCsv)} disabled={!symptomsCsv}>Insert</Button>
              <Button type="button" size="sm" variant="secondary" onClick={()=> copy(symptomsCsv)} disabled={!symptomsCsv}>Copy</Button>
            </div>
          </div>
          <div>
            <div className="font-medium mb-1">Diagnosis</div>
            <div className="rounded-md border p-2 min-h-12 whitespace-pre-wrap">{diagnosis || <span className="text-neutral-500">(trống)</span>}</div>
            <div className="flex gap-2 mt-2">
              <Button type="button" size="sm" onClick={()=> onInsertDiagnosis(diagnosis)} disabled={!diagnosis}>Insert</Button>
              <Button type="button" size="sm" variant="secondary" onClick={()=> copy(diagnosis)} disabled={!diagnosis}>Copy</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


