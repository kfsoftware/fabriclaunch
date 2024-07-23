'use client'

import { OrganizationInvitationDB } from '@/db'
import { acceptOrganizationInvitation, updateOrganizationInvitation } from '@/lib/logic'
import AutoForm, { AutoFormSubmit } from '@repo/ui/auto-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'

const onboardingDataSchema = z.object({
	orgName: z.string().min(1, 'Name is required').min(4, 'Name must be at least 4 characters'),
	mspId: z
		.string()
		.min(1, 'MSP ID is required')
		.min(4, 'MSP ID must be at least 4 characters')
		.regex(/^[^\s]+MSP$/, 'MSP ID must not contain spaces and must end with MSP'),
})
export default function OnboardingForm({ invitation }: { invitation: OrganizationInvitationDB }) {
	const [submitting, setSubmitting] = useState(false)
	const router = useRouter()
	const onSubmit = async (values: z.infer<typeof onboardingDataSchema>) => {
		setSubmitting(true)
		try {
			await acceptOrganizationInvitation(invitation.token, values.orgName, values.mspId)
			router.push(`/invitation-instructions?token=${invitation.token}`)
		} catch (e: any) {
			toast.error(`Failed to update invitation: ${e.message}`)
		} finally {
			setSubmitting(false)
		}
	}
	return (
		<div className="container mx-auto flex items-center justify-center min-h-screen">
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Invitation form</CardTitle>
					<CardDescription>Please fill out the following information</CardDescription>
				</CardHeader>
				<CardContent>
					<AutoForm onSubmit={onSubmit} formSchema={onboardingDataSchema} fieldConfig={{}}>
						<AutoFormSubmit disabled={submitting}>Submit</AutoFormSubmit>
					</AutoForm>
				</CardContent>
			</Card>
		</div>
	)
}
