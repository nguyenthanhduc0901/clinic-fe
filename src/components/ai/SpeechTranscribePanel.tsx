import { useEffect, useMemo, useRef, useState } from 'react'
import Button from '@/components/ui/Button'
import { toast } from '@/components/ui/Toast'
import { analyzeMedicalText, type TextAnalyzeResponse } from '@/lib/api/ai'

export default function SpeechTranscribePanel({
  onInsertSymptoms,
  onInsertDiagnosis,
}: {
  onInsertSymptoms: (csv: string) => void
  onInsertDiagnosis: (d: string) => void
}) {
  const [supported, setSupported] = useState<boolean>(false)
  const [isRecording, setIsRecording] = useState<boolean>(false)
  const [lang, setLang] = useState<'vi-VN' | 'en-US'>('vi-VN')
  const [interim, setInterim] = useState<string>('')
  const [finalText, setFinalText] = useState<string>('')
  const [autoRestart, setAutoRestart] = useState<boolean>(true)
  const [duration, setDuration] = useState<number>(0)
  const [analyzing, setAnalyzing] = useState<boolean>(false)
  const [res, setRes] = useState<TextAnalyzeResponse | null>(null)
  const recRef = useRef<any>(null)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSupported(!!SR)
    return () => { if (timerRef.current) window.clearInterval(timerRef.current); try { recRef.current?.stop?.() } catch {} }
  }, [])

  const start = () => {
    const SR: any = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SR) { toast.error('Trình duyệt không hỗ trợ Web Speech API'); return }
    try {
      const rec = new SR()
      rec.lang = lang
      rec.continuous = true
      rec.interimResults = true
      rec.maxAlternatives = 1
      rec.onstart = () => { setIsRecording(true); setInterim(''); startTimer() }
      rec.onresult = (e: any) => {
        let interimText = ''
        let finalChunk = ''
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const r = e.results[i]
          if (r.isFinal) { finalChunk += r[0].transcript }
          else { interimText += r[0].transcript }
        }
        if (interimText) setInterim(interimText)
        if (finalChunk) setFinalText((prev) => (prev ? prev + ' ' : '') + finalChunk.trim())
      }
      rec.onerror = (e: any) => {
        const err = e?.error
        if (err === 'no-speech') toast.error('Không thu được tiếng nói')
        else if (err === 'audio-capture') toast.error('Không tìm thấy micro')
        else if (err === 'not-allowed') toast.error('Bị từ chối quyền micro - hãy cấp quyền')
        else toast.error('Lỗi ghi âm: ' + (err || 'unknown'))
      }
      rec.onend = () => {
        stopTimer()
        setIsRecording(false)
        setInterim('')
        if (autoRestart && recRef.current && !recRef.current._stoppedByUser) {
          // auto restart to keep continuous capture
          setTimeout(() => { try { rec.start() } catch {} }, 300)
        }
      }
      recRef.current = rec
      rec._stoppedByUser = false
      rec.start()
    } catch { toast.error('Không thể bắt đầu ghi') }
  }

  const stop = () => {
    try { if (recRef.current) { recRef.current._stoppedByUser = true; recRef.current.stop() } } catch {}
  }

  const startTimer = () => {
    setDuration(0)
    timerRef.current = window.setInterval(() => setDuration((d) => d + 1), 1000)
  }
  const stopTimer = () => { if (timerRef.current) { window.clearInterval(timerRef.current); timerRef.current = null } }

  const analyze = async () => {
    const text = (finalText + (interim ? ' ' + interim : '')).trim()
    if (!text) { toast.error('Transcript trống'); return }
    try {
      setAnalyzing(true)
      const out = await analyzeMedicalText({ text })
      setRes(out)
    } catch (e: any) {
      toast.error(e?.message || 'Phân tích AI thất bại')
    } finally { setAnalyzing(false) }
  }

  const timeLabel = useMemo(() => {
    const m = Math.floor(duration / 60)
    const s = duration % 60
    return `${m.toString().padStart(2,'0')}:${s.toString().padStart(2,'0')}`
  }, [duration])

  const symptomsCsv = useMemo(() => (res?.json?.symptom || []).join(', '), [res])
  const diagnosis = useMemo(() => res?.json?.diagnosis || '', [res])

  return (
    <div className="mt-2 p-3 rounded-md border bg-white dark:bg-neutral-900">
      <div className="flex items-center justify-between mb-2">
        <div className="font-medium">Web Speech (Realtime)</div>
        <div className="text-xs text-neutral-500">{supported ? 'Supported' : 'Not supported'}</div>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <select className="rounded-md border px-2 py-1 text-sm" value={lang} onChange={(e)=> setLang(e.target.value as 'vi-VN'|'en-US')}>
          <option value="vi-VN">vi-VN</option>
          <option value="en-US">en-US</option>
        </select>
        {!isRecording ? (
          <Button type="button" size="sm" onClick={start} disabled={!supported}>Record</Button>
        ) : (
          <Button type="button" size="sm" variant="danger" onClick={stop}>Stop</Button>
        )}
        <label className="inline-flex items-center gap-1 text-sm">
          <input type="checkbox" checked={autoRestart} onChange={(e)=> setAutoRestart(e.target.checked)} /> Auto-restart
        </label>
        <span className="text-sm text-neutral-600 dark:text-neutral-300">{isRecording ? 'Đang ghi' : 'Đã dừng'} • {timeLabel}</span>
      </div>

      <div className="space-y-2 text-sm">
        <div>
          <div className="font-medium mb-1">Transcript</div>
          <div className="rounded-md border p-2 min-h-12 whitespace-pre-wrap">
            {(finalText || interim) ? (<>
              {finalText}
              {interim && <span className="opacity-60"> {interim}</span>}
            </>) : <span className="text-neutral-500">(trống)</span>}
          </div>
          <div className="flex gap-2 mt-2">
            <Button type="button" size="sm" onClick={analyze} loading={analyzing}>Phân tích AI</Button>
            <Button type="button" size="sm" variant="secondary" onClick={async()=> { try { await navigator.clipboard.writeText((finalText + ' ' + interim).trim()); toast.success('Đã copy transcript') } catch { toast.error('Copy thất bại') } }}>Copy transcript</Button>
          </div>
        </div>
        {res && (
          <div className="space-y-2">
            <div>
              <div className="font-medium mb-1">Symptoms</div>
              <div className="flex flex-wrap gap-1 mb-2">
                {(res.json?.symptom || []).map((s, i) => (
                  <span key={i} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary-700 dark:text-primary-300">{s}</span>
                ))}
              </div>
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={()=> onInsertSymptoms(symptomsCsv)} disabled={!symptomsCsv}>Chèn Triệu chứng</Button>
                <Button type="button" size="sm" variant="secondary" onClick={async()=> { try { await navigator.clipboard.writeText(symptomsCsv); toast.success('Đã copy') } catch { toast.error('Copy thất bại') } }} disabled={!symptomsCsv}>Copy</Button>
              </div>
            </div>
            <div>
              <div className="font-medium mb-1">Diagnosis</div>
              <div className="rounded-md border p-2 min-h-12 whitespace-pre-wrap">{diagnosis || <span className="text-neutral-500">(trống)</span>}</div>
              <div className="flex gap-2 mt-2">
                <Button type="button" size="sm" onClick={()=> onInsertDiagnosis(diagnosis)} disabled={!diagnosis}>Chèn Chẩn đoán</Button>
                <Button type="button" size="sm" variant="secondary" onClick={async()=> { try { await navigator.clipboard.writeText(diagnosis); toast.success('Đã copy') } catch { toast.error('Copy thất bại') } }} disabled={!diagnosis}>Copy</Button>
              </div>
            </div>
          </div>
        )}
      </div>
      {!supported && (
        <div className="text-xs text-neutral-600 dark:text-neutral-300 mt-2">Trình duyệt không hỗ trợ Web Speech API. Bạn có thể dùng “Ghi âm tư vấn” (upload audio) hoặc nhập văn bản thủ công.</div>
      )}
    </div>
  )
}


