import ChaincodeProposalInstructions from '@/components/dashboard/proposals/chaincodes/instructions';
import { currentUser } from '@/lib/auth';
import { getChaincodeProposalBySlug, getNodesForOrganization, getOrgsForUser, getTenantBySlug } from '@/lib/logic';

export default async function Page({ params }: { params: { tenantslug: string; chaincodeslug: string } }) {
	const user = await currentUser()
	const tenant = await getTenantBySlug(params.tenantslug)
	const userOrgs = await getOrgsForUser(user.id, tenant.id)
	const channelProposal = await getChaincodeProposalBySlug(tenant.id, params.chaincodeslug)
	const org = userOrgs.length > 0 ? userOrgs[0].organization : channelProposal.organization
	const nodes = await getNodesForOrganization(tenant.id, org.id)
	const peers = nodes.filter((node) => node.type === 'PEER')
	const orderers = nodes.filter((node) => node.type === 'ORDERER')
	return <ChaincodeProposalInstructions orderers={orderers} peers={peers} proposal={channelProposal} organization={org} />
}
