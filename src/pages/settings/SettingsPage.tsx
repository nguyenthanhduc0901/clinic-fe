import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSetting } from '@/lib/api/settings'
import { toast } from '@/components/ui/Toast'
import { useState, useMemo } from 'react'

export default function SettingsPage() {
	const { data, isLoading, isError } = useQuery({ queryKey: ['settings'], queryFn: () => getSettings() })
	const qc = useQueryClient()
	const [local, setLocal] = useState<Record<string, string>>({})

	const settingsMap = useMemo(() => {
		const map: Record<string, string> = {}
		for (const s of data ?? []) map[s.key] = s.value
		return map
	}, [data])

	function getVal(key: string) {
		return local[key] ?? settingsMap[key] ?? ''
	}

	function setVal(key: string, v: string) {
		setLocal((l) => ({ ...l, [key]: v }))
	}

	const mut = useMutation({
		mutationFn: ({ key, value }: { key: string; value: string }) => updateSetting(key, value),
		onSuccess: () => { toast.success('Lưu thành công'); qc.invalidateQueries({ queryKey: ['settings'] }) },
	})

	async function saveKey(key: string) {
		await mut.mutateAsync({ key, value: getVal(key) })
	}

	return (
		<div className="space-y-3">
			<h1 className="page-title">Settings</h1>
			<div className="card">
				{isLoading && <div>Đang tải...</div>}
				{isError && <div className="text-danger">Tải dữ liệu thất bại</div>}
				{!isLoading && !isError && (
					<div className="space-y-4">
						<section>
							<h2 className="font-medium mb-2">Thông tin phòng khám</h2>
							<div className="space-y-3">
								<div>
									<label className="block text-sm mb-1">clinic_name</label>
									<input className="w-full rounded-md border px-3 py-2" value={getVal('clinic_name')} onChange={(e)=> setVal('clinic_name', e.target.value)} />
									<div className="mt-1 text-right"><button className="btn" onClick={()=> saveKey('clinic_name')} disabled={mut.isPending}>Save</button></div>
								</div>
								<div>
									<label className="block text-sm mb-1">clinic_address</label>
									<textarea className="w-full rounded-md border px-3 py-2" rows={3} value={getVal('clinic_address')} onChange={(e)=> setVal('clinic_address', e.target.value)} />
									<div className="mt-1 text-right"><button className="btn" onClick={()=> saveKey('clinic_address')} disabled={mut.isPending}>Save</button></div>
								</div>
								<div>
									<label className="block text-sm mb-1">clinic_phone</label>
									<input className="w-full rounded-md border px-3 py-2" value={getVal('clinic_phone')} onChange={(e)=> setVal('clinic_phone', e.target.value)} />
									<div className="mt-1 text-right"><button className="btn" onClick={()=> saveKey('clinic_phone')} disabled={mut.isPending}>Save</button></div>
								</div>
								<div>
									<label className="block text-sm mb-1">examination_fee (VND)</label>
									<input className="w-full rounded-md border px-3 py-2" value={getVal('examination_fee')} onChange={(e)=> setVal('examination_fee', e.target.value)} />
									<div className="mt-1 text-right"><button className="btn" onClick={()=> saveKey('examination_fee')} disabled={mut.isPending}>Save</button></div>
								</div>
							</div>
						</section>
					</div>
				)}
			</div>
		</div>
	)
}



