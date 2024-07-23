import TenantOnboardingForm from '@/components/onboarding/tenant'
import { currentUser } from '@/lib/auth'
import { redirect } from 'next/navigation'

export default async function Page() {
	const user = await currentUser()
	if (!user) return redirect('/api/auth/signin?callbackUrl=/onboarding')
	return (
		<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
			<TenantOnboardingForm />
		</div>
	)
}
