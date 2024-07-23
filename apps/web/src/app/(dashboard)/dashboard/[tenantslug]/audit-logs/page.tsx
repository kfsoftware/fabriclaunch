import AuditLogsTable from '@/components/dashboard/audit/table'
import { currentUser } from '@/lib/auth'
import { getAuditLogs, getTenantBySlugAndUserId } from '@/lib/logic'

export default async function Page({
	params,
}: {
	params: {
		tenantslug: string
	}
}) {
	const user = await currentUser()
	const tenant = await getTenantBySlugAndUserId(params.tenantslug, user.id)
	const auditLogs = await getAuditLogs(tenant.id)

	return (
		<>
			<AuditLogsTable auditLogs={auditLogs} />
		</>
	)
}
