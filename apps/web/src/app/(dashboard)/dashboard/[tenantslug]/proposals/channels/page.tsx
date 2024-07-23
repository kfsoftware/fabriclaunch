import ChannelProposalTable from '@/components/dashboard/proposals/channels/table'
import { getChannelProposals, getTenantBySlug } from '@/lib/logic'

export default async function Page({
	params,
}: {
	params: {
		tenantslug: string
	}
}) {
	const tenant = await getTenantBySlug(params.tenantslug)
	const channels = await getChannelProposals(tenant.id)
	return <ChannelProposalTable proposals={channels} />
}
