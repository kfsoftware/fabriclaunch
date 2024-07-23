import { HumanDate } from '@/components/utils/HumanDate'
import { getChannelProposals } from '@/lib/logic'
import { Badge } from '@repo/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@repo/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import Link from 'next/link'

export default function ChannelProposalTable({ proposals }: { proposals: Awaited<ReturnType<typeof getChannelProposals>> }) {
	return (
		<Card>
			<CardHeader>
				<CardTitle>Channel Proposals</CardTitle>
				<CardDescription>This table displays the channel proposals for your organization.</CardDescription>
			</CardHeader>
			<CardContent>
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Slug</TableHead>
							<TableHead>Channel Name</TableHead>
							<TableHead>Proposed By</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Data</TableHead>
							<TableHead>Created At</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{proposals.map(({ channel_proposal: proposal, tenant, organization }) => (
							<TableRow key={proposal.id}>
								<TableCell>
									<Link href={`/dashboard/${tenant.slug}/proposals/channels/${proposal.slug}`}>
										{proposal.slug}
									</Link>
								</TableCell>
								<TableCell>{proposal.channelName}</TableCell>
								<TableCell>{organization?.mspId}</TableCell>
								<TableCell>
									<Badge variant={proposal.status === 'PROPOSED' ? 'secondary' : proposal.status === 'APPROVED' ? 'default' : 'destructive'}>{proposal.status}</Badge>
								</TableCell>
								<TableCell>{/* <div className="text-sm text-muted-foreground">{JSON.parse(proposal.data).title}</div> */}</TableCell>
								<TableCell>
									<HumanDate date={proposal.createdAt} />
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</CardContent>
		</Card>
	)
}
