import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { predictDermatology, type DermPredictionResponse } from '@/lib/api/ai'

export default function DermAIAnalyzer({ onInsertNote }: { onInsertNote: (note: string) => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<DermPredictionResponse | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!file) { setPreview(null); return }
    const reader = new FileReader()
    reader.onload = () => setPreview(reader.result as string)
    reader.onerror = () => toast.error('Không đọc được file ảnh')
    reader.readAsDataURL(file)
    return () => { /* no cleanup for FileReader */ }
  }, [file])

  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort()
  }, [])

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (!f) return
    if (!/^image\/(jpeg|jpg|png)$/i.test(f.type)) {
      toast.error('Chỉ chấp nhận ảnh JPG/PNG')
      return
    }
    setResult(null)
    setFile(f)
  }

  const analyze = async () => {
    if (!preview) { toast.error('Vui lòng chọn ảnh'); return }
    try {
      setLoading(true)
      abortRef.current?.abort()
      abortRef.current = new AbortController()
      const res = await Promise.race([
        predictDermatology(preview, { signal: abortRef.current.signal }),
        new Promise<never>((_, reject) => setTimeout(() => reject(new Error('Quá thời gian (timeout)')), 300_000)),
      ])
      setResult(res as DermPredictionResponse)
    } catch (e: any) {
      const status = e?.status
      if (status === 400) toast.error('Ảnh không hợp lệ hoặc thiếu trường image')
      else if (status === 500) toast.error('Mô hình chưa sẵn sàng hoặc ảnh lỗi (500)')
      else toast.error(e?.message || 'Lỗi phân tích AI')
    } finally {
      setLoading(false)
    }
  }

  const noteText = useMemo(() => {
    if (!result) return ''
    const pred = result.prediction
    const conf = result.confidence?.toFixed(2)
    const a1 = result.top_alternatives?.[0]
    const a2 = result.top_alternatives?.[1]
    const alt = [a1, a2].filter(Boolean).map((a) => `${a!.class} (${a!.confidence.toFixed(2)}%)`).join(', ')
    return `AI(derm): ${pred} (${conf}%). Alt: ${alt}.`
  }, [result])

  return (
    <div className="mt-2 p-3 rounded-md border bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Phân tích da liễu (AI)</div>
        <div className="text-xs text-neutral-500">Không gửi thông tin định danh</div>
      </div>
      <div className="flex gap-3 items-start">
        <div className="w-40">
          {preview ? (
            <img src={preview} alt="Ảnh cần phân tích" className="w-40 h-40 object-cover rounded-md border" />
          ) : (
            <div className="w-40 h-40 flex items-center justify-center rounded-md border text-sm text-neutral-500">Chưa chọn ảnh</div>
          )}
          <label className="mt-2 inline-block">
            <input type="file" accept="image/jpeg,image/png" className="hidden" onChange={handlePick} />
            <Button type="button" variant="secondary" size="sm">Chọn ảnh</Button>
          </label>
        </div>
        <div className="flex-1 space-y-2">
          <div className="flex gap-2">
            <Button type="button" onClick={analyze} loading={loading} disabled={!preview}>Phân tích AI</Button>
            <Button type="button" variant="ghost" disabled={!result} onClick={() => onInsertNote(noteText)}>Chèn vào ghi chú</Button>
          </div>
          {result && (
            <div className="rounded-md border p-2 text-sm">
              <div><span className="font-medium">Kết quả:</span> {result.prediction} <span className="text-neutral-500">({result.confidence.toFixed(2)}%)</span></div>
              {result.top_alternatives?.length ? (
                <div>
                  <span className="font-medium">Gợi ý khác:</span>{' '}
                  {result.top_alternatives.slice(0, 3).map((t, i) => (
                    <span key={i} className="mr-2">{t.class} ({t.confidence.toFixed(2)}%)</span>
                  ))}
                </div>
              ) : null}
              {result.recommendation && (
                <div className="text-neutral-600 dark:text-neutral-300">{result.recommendation}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}


