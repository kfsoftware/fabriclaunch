import ChaincodeProposalTable from '@/components/dashboard/proposals/chaincodes/table'
import ChannelProposalTable from '@/components/dashboard/proposals/channels/table'
import { getChaincodesProposals, getChannelProposals, getTenantBySlug } from '@/lib/logic'

export default async function Page({
	params,
}: {
	params: {
		tenantslug: string
	}
}) {
	const tenant = await getTenantBySlug(params.tenantslug)
	const chaincodes = await getChaincodesProposals(tenant.id)
	return <ChaincodeProposalTable proposals={chaincodes} />
}
