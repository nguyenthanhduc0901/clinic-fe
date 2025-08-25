import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

export type AutocompleteOption = {
	id: number
	fullName: string
}

type AutocompleteInputProps = {
	label: string
	placeholder?: string
	value?: number
	onChange: (value: number | undefined, option?: AutocompleteOption) => void
	fetchOptions: (params: { page: number; limit: number; q?: string }) => Promise<{ data: any[]; total: number }>
	queryKey: string[]
	mapOption: (item: any) => AutocompleteOption
	disabled?: boolean
}

export function AutocompleteInput({ label, placeholder, value, onChange, fetchOptions, queryKey, mapOption, disabled }: AutocompleteInputProps) {
	const [isOpen, setIsOpen] = useState(false)
	const [searchQuery, setSearchQuery] = useState('')
	const [selected, setSelected] = useState<AutocompleteOption | null>(null)
	const wrapperRef = useRef<HTMLDivElement>(null)

	const debouncedQuery = useDebounce(searchQuery, 250)

	const { data, isLoading } = useQuery({
		queryKey: [...queryKey, debouncedQuery],
		queryFn: () => fetchOptions({ page: 1, limit: 10, q: debouncedQuery || undefined }),
		enabled: isOpen && !selected && (debouncedQuery?.length ?? 0) > 0,
		staleTime: 5 * 60 * 1000,
	})

	useEffect(() => {
		function handleClickOutside(event: MouseEvent) {
			if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
				setIsOpen(false)
			}
		}
		document.addEventListener('mousedown', handleClickOutside)
		return () => document.removeEventListener('mousedown', handleClickOutside)
	}, [])

	useEffect(() => {
		if (!value) {
			setSelected(null)
			setSearchQuery('')
		}
	}, [value])

	const handleSelect = (option: AutocompleteOption) => {
		setSelected(option)
		onChange(option.id, option)
		setIsOpen(false)
		setSearchQuery('')
	}

	const handleClear = () => {
		setSelected(null)
		onChange(undefined, undefined)
		setSearchQuery('')
	}

	const options: AutocompleteOption[] = (data?.data || []).map(mapOption)

	return (
		<div className="relative" ref={wrapperRef}>
			<label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{label}</label>
			<div className="relative">
				<input
					type="text"
					className="rounded-md border px-3 py-2 w-full pr-8"
					placeholder={placeholder}
					value={selected ? selected.fullName : searchQuery}
					onChange={(e) => {
						if (!selected) setSearchQuery(e.target.value)
					}}
					onFocus={() => !selected && setIsOpen(true)}
					disabled={disabled}
				/>
				<div className="absolute inset-y-0 right-0 flex items-center pr-2">
					{selected ? (
						<button type="button" className="h-6 w-6 p-0 text-gray-400 hover:text-gray-600" onClick={handleClear}>
							×
						</button>
					) : (
						<ChevronDownIcon className="h-4 w-4 text-gray-400" />
					)}
				</div>
			</div>
			{isOpen && !selected && (
				<div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-60 overflow-auto">
					{isLoading ? (
						<div className="p-4 text-center text-gray-500">Đang tải...</div>
					) : options.length > 0 ? (
						<div>
							{options.map((opt) => (
								<button
									key={opt.id}
									type="button"
									className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 focus:bg-gray-100 dark:focus:bg-gray-700"
									onClick={() => handleSelect(opt)}
								>
									{opt.fullName}
								</button>
							))}
						</div>
					) : (debouncedQuery?.length ?? 0) > 0 ? (
						<div className="p-4 text-center text-gray-500">Không tìm thấy kết quả</div>
					) : (
						<div className="p-4 text-center text-gray-500">Nhập để tìm kiếm</div>
					)}
				</div>
			)}
		</div>
	)
}

function useDebounce<T>(value: T, delay: number) {
	const [debounced, setDebounced] = useState(value)
	useEffect(() => {
		const id = setTimeout(() => setDebounced(value), delay)
		return () => clearTimeout(id)
	}, [value, delay])
	return debounced
}
