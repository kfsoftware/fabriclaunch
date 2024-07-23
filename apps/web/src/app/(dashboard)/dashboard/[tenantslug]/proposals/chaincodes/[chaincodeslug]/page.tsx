import ChaincodeProposalView from '@/components/dashboard/proposals/chaincodes/detail'
import { getChaincodeProposalBySlug, getTenantBySlug } from '@/lib/logic'

export default async function Page({
	params,
}: {
	params: {
		tenantslug: string
		chaincodeslug: string
	}
}) {
	const tenant = await getTenantBySlug(params.tenantslug)
	const channelProposal = await getChaincodeProposalBySlug(tenant.id, params.chaincodeslug)
	return <ChaincodeProposalView proposal={channelProposal} />
}
