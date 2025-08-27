import Modal from '@/components/ui/Modal'
import { useForm } from 'react-hook-form'
import type { Resolver } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { createPatient } from '@/lib/api/patients'
import { toast } from '@/components/ui/Toast'
import { FormField, Input } from '@/components/ui/Input'
import Button from '@/components/ui/Button'

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
        <FormField id="fullName" label="Họ tên" error={errors.fullName?.message as any}>
          <Input id="fullName" {...register('fullName')} invalid={!!errors.fullName} describedBy={errors.fullName ? 'fullName-error' : undefined} />
        </FormField>
        <div className="grid grid-cols-2 gap-2">
          <FormField id="birthYear" label="Năm sinh" error={errors.birthYear?.message as any}>
            <Input id="birthYear" type="number" {...register('birthYear', { valueAsNumber: true })} invalid={!!errors.birthYear} describedBy={errors.birthYear ? 'birthYear-error' : undefined} />
          </FormField>
          <FormField id="gender" label="Giới tính" error={errors.gender?.message as any}>
            <select id="gender" className="w-full rounded-md border px-3 py-2" {...register('gender')}>
              <option value="Nam">Nam</option>
              <option value="Nữ">Nữ</option>
              <option value="Khác">Khác</option>
            </select>
          </FormField>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <FormField id="phone" label="SĐT" error={errors.phone?.message as any}>
            <Input id="phone" {...register('phone')} />
          </FormField>
          <FormField id="address" label="Địa chỉ" error={errors.address?.message as any}>
            <Input id="address" {...register('address')} />
          </FormField>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Hủy</Button>
          <Button disabled={isSubmitting || mutation.isPending}>
            {mutation.isPending ? 'Đang lưu...' : 'Tạo mới'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}


