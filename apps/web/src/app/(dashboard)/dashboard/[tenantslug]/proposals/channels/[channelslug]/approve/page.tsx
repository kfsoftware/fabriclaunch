import ChannelProposalInstructions from '@/components/dashboard/proposals/channels/instructions'
import { currentUser } from '@/lib/auth'
import { getChannelProposalBySlug, getNodesForOrganization, getOrgsForUser, getTenantBySlug } from '@/lib/logic'

export default async function Page({ params }: { params: { tenantslug: string; channelslug: string } }) {
	const user = await currentUser()
	const tenant = await getTenantBySlug(params.tenantslug)
	const userOrgs = await getOrgsForUser(user.id, tenant.id)
	const channelProposal = await getChannelProposalBySlug(tenant.id, params.channelslug)
	const org = userOrgs.length > 0 ? userOrgs[0].organization : channelProposal.organization
	const nodes = await getNodesForOrganization(tenant.id, org.id)
	const peers = nodes.filter((node) => node.type === 'PEER')
	const orderers = nodes.filter((node) => node.type === 'ORDERER')
	return <ChannelProposalInstructions orderers={orderers} peers={peers} proposal={channelProposal} organization={org} />
}
