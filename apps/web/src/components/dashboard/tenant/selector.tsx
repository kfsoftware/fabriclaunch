import { currentUser } from '@/lib/auth'
import { getTenantBySlugAndUserId, getTenantsByUserId } from '@/lib/logic'

import { cookies } from 'next/headers'
import TenantDropdown from './dropdown'
export default async function TenantSelector({ tenantSlug }: { tenantSlug: string }) {
	const user = await currentUser()
	if (!user) return null
	const tenants = await getTenantsByUserId(user.id)
	if (!tenants.length) return null
	const tenant = await getTenantBySlugAndUserId(tenantSlug, user.id)

	return (
		<div className="relative">
			<TenantDropdown tenant={tenant} tenants={tenants} selectedTenantSlug={tenantSlug} />
		</div>
	)
}
