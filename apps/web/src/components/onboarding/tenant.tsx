'use client'

import { createTenantServer } from '@/lib/logic'
import AutoForm, { AutoFormSubmit } from '@repo/ui/auto-form'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
const tenantSchema = z.object({
	tenantName: z.string().min(1, 'Name is required').min(4, 'Name must be at least 4 characters').describe('Consortium name'),
})
export default function TenantOnboardingForm() {
	const [submitting, setSubmitting] = useState(false)
	const router = useRouter()
	const onSubmit = async (values: z.infer<typeof tenantSchema>) => {
		setSubmitting(true)
		try {
			const tenant = await createTenantServer(values.tenantName)
			router.push(`/dashboard/${tenant.slug}`)
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
					<CardTitle>Create your consortium</CardTitle>
					<CardDescription>Please fill out the following information</CardDescription>
				</CardHeader>
				<CardContent>
					<AutoForm onSubmit={onSubmit} formSchema={tenantSchema} fieldConfig={{}}>
						<AutoFormSubmit disabled={submitting}>Create</AutoFormSubmit>
					</AutoForm>
				</CardContent>
			</Card>
		</div>
	)
}
