import DatabaseMap from '@/components/dashboard/NodesMap'
import { currentUser } from '@/lib/auth'
import { getOrganizations, getOrganizationsWithNodes, getTenantBySlugAndUserId } from '@/lib/logic'
import { Card } from '@repo/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@repo/ui/table'
import Link from 'next/link'
import { redirect } from 'next/navigation'
// show all the organizations and channels joined
// show all the peers and orderers per org
// show map of the nodes and their locations
export default async function Page({
	params,
}: {
	params: {
		tenantslug: string
	}
}) {
	const user = await currentUser()
	if (!user) {
		return redirect(`/api/auth/signin?callbackUrl=/dashboard/${params.tenantslug}`)
	}
	const tenant = await getTenantBySlugAndUserId(params.tenantslug, user.id)
	if (!tenant) {
		return redirect(`/onboarding`)
	}
	const nodesWithOrg = await getOrganizationsWithNodes(params.tenantslug, user.id)
	const peers = nodesWithOrg.filter(({ node }) => node.type === 'PEER')
	const orderers = nodesWithOrg.filter(({ node }) => node.type === 'ORDERER')
	const differentRegions = peers.reduce((acc, curr) => {
		if (!acc.includes(curr.node.region)) {
			acc.push(curr.node.region)
		}
		return acc
	}, [] as string[])
	// get different orgs
	const orgs = await getOrganizations(params.tenantslug, user.id)
	return (
		<div className="min-h-screen bg-[#0a0e14] text-white p-6">
			<div className="flex justify-between items-center mb-6">
				<div className="flex items-center space-x-2">
					<h1 className="text-2xl font-bold">Organizations</h1>
				</div>
				<div className="flex space-x-8">
					<div className="text-center">
						<div className="text-lg font-semibold">{orgs.length}</div>
						<div className="text-sm text-muted-foreground">Organizations</div>
					</div>
					<div className="text-center">
						<div className="text-lg font-semibold">{peers.length}</div>
						<div className="text-sm text-muted-foreground">Peers</div>
					</div>
					<div className="text-center">
						<div className="text-lg font-semibold">{orderers.length}</div>
						<div className="text-sm text-muted-foreground">Orderers</div>
					</div>
					<div className="text-center">
						<div className="text-lg font-semibold">{differentRegions.length}</div>
						<div className="text-sm text-muted-foreground">Regions</div>
					</div>
				</div>
			</div>
			<div className="grid grid-cols-3 gap-6 mb-6 min-h-[350px]  " style={{}}>
				<Card className="bg-[#161b22] p-4 col-span-3">
					<DatabaseMap nodes={nodesWithOrg} />
				</Card>
			</div>
			<Card className="bg-[#161b22] p-4">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>MSP ID</TableHead>
							<TableHead>Peers</TableHead>
							<TableHead>Orderers</TableHead>
							<TableHead>Channels</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{orgs.map((org) => {
							const peers = nodesWithOrg.filter(({ node, organization }) => organization.id === org.id && node.type === 'PEER')
							const orderers = nodesWithOrg.filter(({ node, organization }) => organization.id === org.id && node.type === 'ORDERER')
							const peersPerRegion = peers.reduce(
								(acc, curr) => {
									if (!acc[curr.node.region]) {
										acc[curr.node.region] = 0
									}
									acc[curr.node.region]++
									return acc
								},
								{} as Record<string, number>
							)
							const orderersPerRegion = orderers.reduce(
								(acc, curr) => {
									if (!acc[curr.node.region]) {
										acc[curr.node.region] = 0
									}
									acc[curr.node.region]++
									return acc
								},
								{} as Record<string, number>
							)
							return (
								<TableRow key={org.id}>
									<TableCell>
										{/* <Link href={`/dashboard/orgs/${org.id}`}>{org.mspId}</Link> */}
										{org.mspId}
									</TableCell>
									<TableCell>
										{Object.entries(peersPerRegion).map(([key, value]) => (
											<div key={key}>
												{key}: {value}
											</div>
										))}
									</TableCell>
									<TableCell>
										{Object.entries(orderersPerRegion).map(([key, value]) => (
											<div key={key}>
												{key}: {value}
											</div>
										))}
									</TableCell>
									<TableCell>0</TableCell>
								</TableRow>
							)
						})}
					</TableBody>
				</Table>
			</Card>
		</div>
	)
}
