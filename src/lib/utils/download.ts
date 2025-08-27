import { api } from '@/lib/api/axios'

export function downloadBlob(blob: Blob, filename: string) {
	const url = URL.createObjectURL(blob)
	const a = document.createElement('a')
	a.href = url
	a.download = filename
	document.body.appendChild(a)
	a.click()
	a.remove()
	URL.revokeObjectURL(url)
}

export async function downloadFromApi(url: string, fallbackName: string) {
	const res = await api.get(url, { responseType: 'blob' })
	let filename = fallbackName
	const dispo = res.headers['content-disposition'] as string | undefined
	if (dispo) {
		const match = dispo.match(/filename\*=UTF-8''([^;]+)|filename="?([^";]+)"?/i)
		const name = decodeURIComponent((match?.[1] || match?.[2] || '').trim())
		if (name) filename = name
	}
	downloadBlob(res.data as Blob, filename)
}



