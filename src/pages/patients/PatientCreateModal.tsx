import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPatient } from '@/lib/api/patients'
import { toast } from '@/components/ui/Toast'

const currentYear = new Date().getFullYear()
type FormValues = {
  fullName: string
  birthYear: number
  gender: 'Nam' | 'Nữ' | 'Khác'
  phone?: string
  address?: string
}
const schema: z.ZodType<FormValues> = z.object({
  fullName: z.string().min(1, 'Họ tên bắt buộc'),
  birthYear: z.coerce.number().int().min(1901).max(currentYear),
  gender: z.enum(['Nam', 'Nữ', 'Khác']),
  phone: z.string().optional(),
  address: z.string().optional(),
})

type Props = { open: boolean; onClose: () => void }

export default function PatientCreateModal({ open, onClose }: Props) {
  const qc = useQueryClient()
  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormValues>({
    resolver: zodResolver(schema as any) as unknown as Resolver<FormValues>,
    defaultValues: { gender: 'Nam' },
  })

  const mutation = useMutation({
    mutationFn: (values: FormValues) => createPatient(values),
    onSuccess: () => {
      toast.success('Tạo bệnh nhân thành công')
      qc.invalidateQueries({ queryKey: ['patients'] })
      reset()
      onClose()
    },
  })

  const onSubmit = (values: FormValues) => mutation.mutate(values)

  return (
    <Modal open={open} onClose={onClose} title="Thêm bệnh nhân">
      <form className="space-y-3" onSubmit={handleSubmit(onSubmit)}>
        <div>
          <label className="block text-sm mb-1">Họ tên</label>
          <input className="w-full rounded-md border px-3 py-2" {...register('fullName')} />
          {errors.fullName && <p className="text-danger text-sm mt-1">{errors.fullName.message}</p>}
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">Năm sinh</label>
            <input className="w-full rounded-md border px-3 py-2" type="number" {...register('birthYear')} />
            {errors.birthYear && <p className="text-danger text-sm mt-1">{errors.birthYear.message}</p>}
          </div>
          <div>
            <label className="block text-sm mb-1">Giới tính</label>
            <select className="w-full rounded-md border px-3 py-2" {...register('gender')}>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
            {errors.gender && <p className="text-danger text-sm mt-1">{errors.gender.message}</p>}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-sm mb-1">SĐT</label>
            <input className="w-full rounded-md border px-3 py-2" {...register('phone')} />
          </div>
          <div>
            <label className="block text-sm mb-1">Địa chỉ</label>
            <input className="w-full rounded-md border px-3 py-2" {...register('address')} />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Hủy</button>
          <button className="btn-primary" disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? 'Đang lưu...' : 'Tạo mới'}
          </button>
        </div>
      </form>
    </Modal>
  )
}


