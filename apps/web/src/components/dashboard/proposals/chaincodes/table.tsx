import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@repo/ui/card'
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@repo/ui/table'
import { Badge } from '@repo/ui/badge'
import { getChaincodesProposals } from '@/lib/logic'
import { HumanDate } from '@/components/utils/HumanDate'
import Link from 'next/link'

export default function ChaincodeProposalTable({ proposals }: { proposals: Awaited<ReturnType<typeof getChaincodesProposals>> }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Chaincode Proposals</CardTitle>
				<CardDescription>View and manage the chaincode proposals for your blockchain network.</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Proposed By</TableHead>
							<TableHead>Channel</TableHead>
							<TableHead>Chaincode</TableHead>
							<TableHead>Code Hash</TableHead>
							<TableHead>Endorsement Policy</TableHead>
							<TableHead>Version</TableHead>
							<TableHead>Sequence</TableHead>
							<TableHead>Created At</TableHead>
							<TableHead>Status</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{proposals.map(({ chaincode_proposal, organization, tenant }) => (
							<TableRow key={chaincode_proposal.id}>
								<TableCell>
									<Link href={`/dashboard/${tenant.slug}/proposals/chaincodes/${chaincode_proposal.slug}`}>{chaincode_proposal.slug}</Link>
								</TableCell>
								<TableCell>{organization?.mspId}</TableCell>
								<TableCell>{chaincode_proposal.channelName}</TableCell>
								<TableCell>{chaincode_proposal.chaincodeName}</TableCell>
								<TableCell title={chaincode_proposal.codeZipHash}>
									<Badge variant="outline">{chaincode_proposal.codeZipHash.slice(0, 6)}...</Badge>
								</TableCell>
								<TableCell>
									<Badge variant="secondary">{chaincode_proposal.endorsementPolicy}</Badge>
								</TableCell>
								<TableCell>{chaincode_proposal.version}</TableCell>
								<TableCell>{chaincode_proposal.sequence}</TableCell>
								<TableCell>
									<HumanDate date={chaincode_proposal.createdAt} />
								</TableCell>
								<TableCell>
									<Badge variant="secondary">{chaincode_proposal.status}</Badge>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}
