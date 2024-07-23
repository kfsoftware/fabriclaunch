'use client'
import { TenantDB } from '@/db'
import { createOrganizationInvitation } from '@/lib/logic'
import AutoForm, { AutoFormSubmit } from '@repo/ui/auto-form'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
const inviteOrgSchema = z.object({
	// name: z.string().min(1, 'Name is required').min(4, 'Name must be at least 4 characters'),
	email: z.string().email('Invalid email address'),
	// mspId: z.string(),
})
export default function OnboardingSubmitForm({ tenant }: { tenant: TenantDB }) {
	const router = useRouter()
	const [submitting, setSubmitting] = useState(false)
	const onSubmit = async (values: z.infer<typeof inviteOrgSchema>) => {
		setSubmitting(true)
		try {
			const inv = await createOrganizationInvitation(tenant.id, values.email)
			router.push(`/dashboard/${tenant.slug}/onboarding/${inv.id}/success`)
			toast.success(`New organization invited`)
		} catch (e) {
			toast.error(`Failed to invite organization: ${e.message}`)
		} finally {
			setSubmitting(false)
		}
	}
	return (
		<AutoForm onSubmit={onSubmit} formSchema={inviteOrgSchema} fieldConfig={{}}>
			<AutoFormSubmit disabled={submitting}>Invite</AutoFormSubmit>
		</AutoForm>
	)
}
