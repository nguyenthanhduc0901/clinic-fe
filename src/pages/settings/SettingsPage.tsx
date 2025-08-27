import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { getSettings, updateSetting } from '@/lib/api/settings'
import { toast } from '@/components/ui/Toast'
import { useState, useMemo } from 'react'
import { FormField, Input, Textarea } from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import { SkeletonTable } from '@/components/ui/Skeleton'

export default function SettingsPage() {
	const { data, isLoading, isError, refetch } = useQuery({ queryKey: ['settings'], queryFn: () => getSettings() })
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
				{isLoading && <SkeletonTable rows={6} />}
				{isError && (
					<div className="text-danger flex items-center justify-between">
						<span>Tải dữ liệu thất bại</span>
						<Button variant="ghost" onClick={() => refetch()}>Thử lại</Button>
					</div>
				)}
				{!isLoading && !isError && (
					<div className="space-y-4">
						<section>
							<h2 className="font-medium mb-2">Thông tin phòng khám</h2>
							<div className="space-y-3">
								<FormField id="clinic_name" label="clinic_name">
									<Input id="clinic_name" value={getVal('clinic_name')} onChange={(e)=> setVal('clinic_name', e.target.value)} />
									<div className="mt-1 text-right"><Button size="sm" onClick={()=> saveKey('clinic_name')} disabled={mut.isPending}>Save</Button></div>
								</FormField>
								<FormField id="clinic_address" label="clinic_address">
									<Textarea id="clinic_address" rows={3} value={getVal('clinic_address')} onChange={(e)=> setVal('clinic_address', e.target.value)} />
									<div className="mt-1 text-right"><Button size="sm" onClick={()=> saveKey('clinic_address')} disabled={mut.isPending}>Save</Button></div>
								</FormField>
								<FormField id="clinic_phone" label="clinic_phone">
									<Input id="clinic_phone" value={getVal('clinic_phone')} onChange={(e)=> setVal('clinic_phone', e.target.value)} />
									<div className="mt-1 text-right"><Button size="sm" onClick={()=> saveKey('clinic_phone')} disabled={mut.isPending}>Save</Button></div>
								</FormField>
								<FormField id="examination_fee" label="examination_fee (VND)">
									<Input id="examination_fee" value={getVal('examination_fee')} onChange={(e)=> setVal('examination_fee', e.target.value)} />
									<div className="mt-1 text-right"><Button size="sm" onClick={()=> saveKey('examination_fee')} disabled={mut.isPending}>Save</Button></div>
								</FormField>
								<FormField id="max_patients_per_day" label="max_patients_per_day">
									<Input id="max_patients_per_day" type="number" min={0} value={getVal('max_patients_per_day')} onChange={(e)=> setVal('max_patients_per_day', e.target.value)} />
									<div className="mt-1 text-right"><Button size="sm" onClick={()=> saveKey('max_patients_per_day')} disabled={mut.isPending}>Save</Button></div>
								</FormField>
							</div>
						</section>
					</div>
				)}
			</div>
		</div>
	)
}



