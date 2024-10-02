'use client'
import { createTenantServer } from '@/lib/logic'
import AutoForm, { AutoFormSubmit } from '@repo/ui/auto-form'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@repo/ui/dialog'
import { PlusIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
const addTenantSchema = z.object({
	name: z.string().min(1, 'Name is required').min(4, 'Name must be at least 4 characters'),
})

export default function TenantCreateButton() {
	const router = useRouter()
	const [openDialog, setOpenDialog] = useState(false)
	const [submitting, setSubmitting] = useState(false)
	const onSubmit = async (values: z.infer<typeof addTenantSchema>) => {
		setSubmitting(true)
		try {
			await createTenantServer(values.name)
			router.refresh()
			toast.success('Tenant added')
			setOpenDialog(false)
		} catch (e) {
			toast.error(`Failed to add tenant: ${e.message}`)
		} finally {
			setSubmitting(false)
		}
	}
	return (
		<Dialog open={openDialog} onOpenChange={setOpenDialog} >
			<DialogTrigger>
				<div className="flex items-center justify-between">
					<span>Create New Consortium</span>
					<PlusIcon className="h-4 w-4" />
				</div>
			</DialogTrigger>
			<DialogContent style={{
				zIndex: 9999,
			}}>
				<DialogHeader>
					<DialogTitle>Create consortium</DialogTitle>
				</DialogHeader>
				<AutoForm onSubmit={onSubmit} formSchema={addTenantSchema} fieldConfig={{
					name: {
						label: 'Consortium Name',
						description: 'Enter a name for your new consortium',
						inputProps: {
							placeholder: 'My Consortium',
							autoComplete: 'off'
						}
					}
				}}>
					<AutoFormSubmit disabled={submitting}>Create</AutoFormSubmit>
				</AutoForm>
			</DialogContent>
		</Dialog>
	)
}
