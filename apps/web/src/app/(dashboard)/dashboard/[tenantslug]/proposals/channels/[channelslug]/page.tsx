import ChannelProposalView from '@/components/dashboard/proposals/channels/detail'
import { getChannelProposalBySlug, getTenantBySlug } from '@/lib/logic'

export default async function Page({
	params,
}: {
	params: {
		tenantslug: string
		channelslug: string
	}
}) {
	const tenant = await getTenantBySlug(params.tenantslug)
	const channelProposal = await getChannelProposalBySlug(tenant.id, params.channelslug)
	return <ChannelProposalView proposal={channelProposal} />
}
