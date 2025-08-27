export function Skeleton({ className = '' }: { className?: string }) {
	return <div className={`animate-pulse rounded-md bg-slate-200 dark:bg-slate-700 ${className}`} />
}

export function SkeletonRow() {
	return (
		<div className="flex items-center gap-2 py-2">
			<Skeleton className="h-4 w-10" />
			<Skeleton className="h-4 w-24" />
			<Skeleton className="h-4 w-32" />
			<Skeleton className="h-4 w-20" />
		</div>
	)
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
	return (
		<div className="space-y-2">
			{Array.from({ length: rows }).map((_, i) => (
				<div key={i} className="grid grid-cols-6 gap-2">
					<Skeleton className="h-4" />
					<Skeleton className="h-4" />
					<Skeleton className="h-4" />
					<Skeleton className="h-4" />
					<Skeleton className="h-4" />
					<Skeleton className="h-4" />
				</div>
			))}
		</div>
	)
}



