import { HumanDate } from '@/components/utils/HumanDate'
import { getChaincodeProposalBySlug } from '@/lib/logic'
import { Button } from '@repo/ui/button'
import Link from 'next/link'

export default function ChaincodeProposalView({ proposal: { tenant, chaincode_proposal: proposal, organization } }: { proposal: Awaited<ReturnType<typeof getChaincodeProposalBySlug>> }) {
	return (
		<div className="w-full ">
			<div className="flex items-center justify-between mb-8">
				<h1 className="text-2xl md:text-3xl font-bold">Chaincode proposal {proposal.slug}</h1>

				<Button asChild={true} className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring">
					<Link href={`/dashboard/${tenant.slug}/proposals/chaincodes/${proposal.slug}/approve`}>Approve</Link>
				</Button>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
				<div className="bg-card rounded-lg p-6 shadow-sm">
					<h3 className="text-lg font-medium mb-2">Channel name</h3>
					<p className="text-muted-foreground">{proposal.channelName}</p>
				</div>
				<div className="bg-card rounded-lg p-6 shadow-sm">
					<h3 className="text-lg font-medium mb-2">Chaincode name</h3>
					<p className="text-muted-foreground">{proposal.chaincodeName}</p>
				</div>
			</div>
			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
				<div className="bg-card rounded-lg p-6 shadow-sm">
					<h3 className="text-lg font-medium mb-2">Version</h3>
					<p className="text-muted-foreground">{proposal.version}</p>
				</div>
				<div className="bg-card rounded-lg p-6 shadow-sm">
					<h3 className="text-lg font-medium mb-2">Sequence</h3>
					<p className="text-muted-foreground">{proposal.sequence}</p>
				</div>
				<div className="bg-card rounded-lg p-6 shadow-sm">
					<h3 className="text-lg font-medium mb-2">Endorsement policy</h3>
					<p className="text-muted-foreground">{proposal.endorsementPolicy}</p>
				</div>
				<div className="bg-card rounded-lg p-6 shadow-sm">
					<h3 className="text-lg font-medium mb-2">Chaincode code hash</h3>
					<p className="text-muted-foreground">{proposal.codeZipHash}</p>
				</div>
				<div className="bg-card rounded-lg p-6 shadow-sm">
					<h3 className="text-lg font-medium mb-2">Proposed by</h3>
					<p className="text-muted-foreground">
						{organization.mspId} <HumanDate date={proposal.createdAt} />
					</p>
				</div>
			</div>
		</div>
	)
}
