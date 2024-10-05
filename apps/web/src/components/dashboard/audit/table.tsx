'use client'

import { HumanDate } from '@/components/utils/HumanDate'
import {
	AuditLogDB,
	ChaincodeApprovedDetails,
	ChaincodeCommittedDetails,
	ChaincodeProposedDetails,
	ChannelApprovedDetails,
	ChannelProposedDetails,
	OrdererCreatedDetails,
	OrdererJoinedDetails,
	PeerCreatedDetails,
	PeerJoinedDetails,
	TenantCreatedDetails,
} from '@/db'
import { getAuditLogs } from '@/lib/logic'
import { Input } from '@repo/ui/input'
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from '@repo/ui/pagination'
import React, { useState } from 'react'

const AuditLogsDetails: React.FC<{ log: AuditLogDB }> = ({ log }) => {
	const renderDetails = () => {
		switch (log.logType) {
			case 'PEER_CREATED':
				const peerCreatedDetails = log.details as PeerCreatedDetails
				return (
					<>
						<p>Peer Name: {peerCreatedDetails.peerName}</p>
						<p>MSP ID: {peerCreatedDetails.mspId}</p>
					</>
				)

			case 'ORDERER_CREATED':
				const ordererCreatedDetails = log.details as OrdererCreatedDetails
				return (
					<>
						<p>Orderer Name: {ordererCreatedDetails.ordererName}</p>
						<p>MSP ID: {ordererCreatedDetails.mspId}</p>
					</>
				)

			case 'CHANNEL_PROPOSED':
				const channelProposedDetails = log.details as ChannelProposedDetails
				return (
					<>
						<p>Channel Name: {channelProposedDetails.channelName}</p>
					</>
				)

			case 'CHANNEL_APPROVED':
				const channelApprovedDetails = log.details as ChannelApprovedDetails
				return (
					<>
						<p>Channel Name: {channelApprovedDetails.channelName}</p>
					</>
				)

			case 'ORDERER_JOINED':
				const ordererJoinedDetails = log.details as OrdererJoinedDetails
				return (
					<>
						<p>Channel Name: {ordererJoinedDetails.channelName}</p>
						<p>Orderers: {ordererJoinedDetails.orderers.join(', ')}</p>
					</>
				)

			case 'PEER_JOINED':
				const peerJoinedDetails = log.details as PeerJoinedDetails
				return (
					<>
						<p>Channel Name: {peerJoinedDetails.channelName}</p>
						<p>Peers: {peerJoinedDetails.peers.join(', ')}</p>
						<p>MSP ID: {peerJoinedDetails.mspId}</p>
					</>
				)

			case 'CHAINCODE_PROPOSED':
				const chaincodeProposedDetails = log.details as ChaincodeProposedDetails
				return (
					<>
						<p>Chaincode Name: {chaincodeProposedDetails.chaincodeName}</p>
						<p>Channel Name: {chaincodeProposedDetails.channelName}</p>
						<p>Sequence: {chaincodeProposedDetails.sequence}</p>
						<p>Version: {chaincodeProposedDetails.version}</p>
					</>
				)

			case 'CHAINCODE_APPROVED':
				const chaincodeApprovedDetails = log.details as ChaincodeApprovedDetails
				return (
					<>
						<p>Chaincode Name: {chaincodeApprovedDetails.chaincodeName}</p>
						<p>Version: {chaincodeApprovedDetails.version}</p>
					</>
				)

			case 'CHAINCODE_COMMITTED':
				const chaincodeCommittedDetails = log.details as ChaincodeCommittedDetails
				return (
					<>
						<p>Chaincode Name: {chaincodeCommittedDetails.chaincodeName}</p>
						<p>Channel Name: {chaincodeCommittedDetails.channelName}</p>
						<p>Version: {chaincodeCommittedDetails.version}</p>
						{chaincodeCommittedDetails.sequence && <p>Sequence: {chaincodeCommittedDetails.sequence}</p>}
					</>
				)
			case 'TENANT_CREATED':
				const tenantCreatedDetails = log.details as TenantCreatedDetails
				return (
					<>
						<p>Tenant Name: {tenantCreatedDetails.tenantName}</p>
					</>
				)

			default:
				return <p>Unknown log type</p>
		}
	}

	return <div className="audit-log-details">{renderDetails()}</div>
}

export default function AuditLogsTable({ auditLogs }: { auditLogs: Awaited<ReturnType<typeof getAuditLogs>> }) {
	const [searchQuery, setSearchQuery] = useState('')
	const [currentPage, setCurrentPage] = useState(1)
	const [logsPerPage] = useState(10)

	const filteredLogs = auditLogs.filter((log) => {
		return (
			log.audit_log.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.organization?.mspId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			log.audit_log.logType.toLowerCase().includes(searchQuery.toLowerCase())
		)
	})
	const indexOfLastLog = currentPage * logsPerPage
	const indexOfFirstLog = indexOfLastLog - logsPerPage
	const currentLogs = filteredLogs.slice(indexOfFirstLog, indexOfLastLog)
	const totalPages = Math.ceil(filteredLogs.length / logsPerPage)

	const handlePageChange = (pageNumber: number) => {
		setCurrentPage(pageNumber)
	}

	const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(e.target.value)
		setCurrentPage(1)
	}
	return (
		<div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
			<div className="mb-6">
				<h1 className="text-2xl font-bold">Audit Logs</h1>
			</div>
			<div className="mb-6">
				<Input
					type="text"
					placeholder="Search logs..."
					value={searchQuery}
					onChange={handleSearch}
					className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
				/>
			</div>
			<div className="overflow-x-auto">
				<table className="w-full table-auto">
					<thead>
						<tr className=" text-left border-gray-200 border-b">
							<th className="px-4 py-3 font-medium">Org</th>
							<th className="px-4 py-3 font-medium">User</th>
							<th className="px-4 py-3 font-medium">Log Type</th>
							<th className="px-4 py-3 font-medium">Details</th>
							<th className="px-4 py-3 font-medium">Performed At</th>
						</tr>
					</thead>
					<tbody>
						{currentLogs.map((log) => (
							<tr key={log.audit_log.id} className="border-b border-gray-200 hover:bg-gray-800">
								<td className="px-4 py-3">{log?.organization?.mspId ?? ''}</td>
								<td className="px-4 py-3">{log.user.name}</td>
								<td className="px-4 py-3">{log.audit_log.logType}</td>
								<td className="px-4 py-3">
									<AuditLogsDetails log={log.audit_log} />
								</td>
								<td className="px-4 py-3">
									<HumanDate date={log.audit_log.createdAt} />
								</td>
							</tr>
						))}
					</tbody>
				</table>
			</div>
			<div className="mt-6 flex justify-end">
				<Pagination>
					<PaginationContent>
						<PaginationItem>
							<PaginationPrevious onClick={() => handlePageChange(currentPage - 1)} />
							{/* disabled={currentPage === 1} */}
						</PaginationItem>

						{[...Array(totalPages)].map((_, index) => {
							const pageNumber = index + 1
							if (pageNumber === 1 || pageNumber === totalPages || (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)) {
								return (
									<PaginationItem key={pageNumber}>
										<PaginationLink onClick={() => handlePageChange(pageNumber)} isActive={currentPage === pageNumber}>
											{pageNumber}
										</PaginationLink>
									</PaginationItem>
								)
							} else if (pageNumber === currentPage - 2 || pageNumber === currentPage + 2) {
								return <PaginationEllipsis key={pageNumber} />
							}
							return null
						})}

						<PaginationItem>
							<PaginationNext onClick={() => handlePageChange(currentPage + 1)} />
							{/* disabled={currentPage === totalPages} */}
						</PaginationItem>
					</PaginationContent>
				</Pagination>
			</div>
		</div>
	)
}
