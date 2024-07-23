import { currentUser } from '@/lib/auth'
import { getOrCreateDefaultTenantForUser, getTenantsByUserId } from '@/lib/logic'
import { redirect } from 'next/navigation'

export default async function TenantSlug() {
	const user = await currentUser()
	if (!user) return redirect('/api/auth/signin?callbackUrl=/dashboard')
	const tenants = await getTenantsByUserId(user.id)
	if (!tenants.length) {
		return redirect(`/onboarding`)
	}
	const selectedTenant = tenants[0]
	return redirect(`/dashboard/${selectedTenant.tenant.slug}`)
}
