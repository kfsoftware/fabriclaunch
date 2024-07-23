'use server'
import { OpenAPI, main_Organization, postApiBlockDecode, postApiChannelGenesis } from '@/channel-mgmt-client'
import {
	ChaincodeApprovedDetails,
	ChaincodeCommittedDetails,
	ChaincodeProposedDetails,
	ChannelApprovedDetails,
	ChannelProposalData,
	ChannelProposedDetails,
	ChannelReadyDetails,
	NodeDB,
	OrdererCreatedDetails,
	OrdererJoinedDetails,
	OrganizationDB,
	OrganizationInvitationDB,
	PeerCreatedDetails,
	PeerJoinedDetails,
	TenantDB,
	accountsTable,
	chaincodeProposalApprovalTable,
	chaincodeProposalTable,
	channelProposalApprovalTable,
	channelProposalTable,
	db,
	nodesTable,
	organizationInvitationsTable,
	organizationsTable,
	tenantsTable,
	userOrganizationTable,
	userRequestLogin,
	userTenantTable,
	usersTable,
} from '@/db'
import { and, desc, eq, gt, lt } from 'drizzle-orm'
import { encode } from 'next-auth/jwt'
import slugify from 'slugify'
import { currentUser } from './auth'
import { getCoordsForCode } from './geo'

import { EXTERNAL_PUBLIC_URL } from '@/constants'
import { auditLogTable } from '@/db'
import ChaincodeProposalEmail from '@/emails/ChaincodeProposalEmail'
import ChannelProposalEmail from '@/emails/ChannelProposalEmail'
import InvitationEmail from '@/emails/InvitationEmail'
import { render } from 'jsx-email'
import { v4 } from 'uuid'
import { sendEmail } from './email'

export async function getTokensToRenew() {
	const dateInSeconds = Math.floor(Date.now() / 1000)
	const deltaToRenew = dateInSeconds + 4 * 60 * 60
	const accountsToRenew = await db
		.select()
		.from(accountsTable)
		.where(and(eq(accountsTable.provider, 'github'), lt(accountsTable.expires_at, deltaToRenew)))
	return accountsToRenew
}

export const getNodeByName = async (tenantId: string, orgId: string, name: string) => {
	const nodes = await db
		.select()
		.from(nodesTable)
		.where(and(eq(nodesTable.tenantId, tenantId), eq(nodesTable.orgId, orgId), eq(nodesTable.name, name)))
	if (nodes.length === 0) {
		return null
	}
	const node = nodes[0]
	return node
}

export const getUserByEmail = async (email: string) => {
	const users = await db.select().from(usersTable).where(eq(usersTable.email, email))
	const user = users[0]
	return user
}

export const getUserById = async (id: string) => {
	const users = await db.select().from(usersTable).where(eq(usersTable.id, id))
	const user = users[0]
	return user
}


// Add these types
export type AuditLogDetails = {
	PEER_CREATED: PeerCreatedDetails
	ORDERER_CREATED: OrdererCreatedDetails
	CHANNEL_PROPOSED: ChannelProposedDetails
	CHANNEL_APPROVED: ChannelApprovedDetails
	CHANNEL_READY: ChannelReadyDetails
	ORDERER_JOINED: OrdererJoinedDetails
	PEER_JOINED: PeerJoinedDetails
	CHAINCODE_PROPOSED: ChaincodeProposedDetails
	CHAINCODE_APPROVED: ChaincodeApprovedDetails
	CHAINCODE_COMMITTED: ChaincodeCommittedDetails
}

export const getAuditLogs = async (tenantId: string) => {
	const logs = await db
		.select()
		.from(auditLogTable)
		.where(eq(auditLogTable.tenantId, tenantId))
		.innerJoin(usersTable, eq(auditLogTable.userId, usersTable.id))
		.innerJoin(organizationsTable, eq(auditLogTable.orgId, organizationsTable.id))
		.innerJoin(tenantsTable, eq(auditLogTable.tenantId, tenantsTable.id))
		.orderBy(desc(auditLogTable.createdAt))
	return logs
}
// Add this function
export const createAuditLog = async <T extends keyof AuditLogDetails>(tenantId: string, userId: string, orgId: string, logType: T, details: AuditLogDetails[T]) => {
	const [auditLogId] = await db
		.insert(auditLogTable)
		.values({
			tenantId,
			details,
			logType,
			userId,
			orgId,
		})
		.returning({
			id: auditLogTable.id,
		})

	const [auditLog] = await db.select().from(auditLogTable).where(eq(auditLogTable.id, auditLogId.id))

	return auditLog
}

// login remotely from the cli
// fabriclaunch login
// generate new login request with redirect uri (local web server by CLI)
// after login, redirect the user back to the CLI with the token
// the CLI can then store the token in the local db and use it for future requests
const secret = process.env.AUTH_SECRET as string
export const getLoginRequestByCode = async (code: string) => {
	const userRequests = await db.select().from(userRequestLogin).where(eq(userRequestLogin.code, code))
	if (userRequests.length === 0) {
		return null
	}
	const userRequest = userRequests[0]
	return userRequest
}
export const createLoginRequestCLI = async (redirectUri: string) => {
	// create a new login request
	const [userRequestId] = await db
		.insert(userRequestLogin)
		.values({
			redirectUri,
			expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes
			// generate 6 code for the user to enter
			code: Math.floor(100000 + Math.random() * 900000).toString(),
		})
		.returning({
			id: userRequestLogin.id,
		})
	const [userRequest] = await db.select().from(userRequestLogin).where(eq(userRequestLogin.id, userRequestId.id))
	return userRequest
}

export const acceptLoginRequestCLI = async (id: string) => {
	const user = await currentUser()
	if (!user) {
		throw new Error('User not found')
	}
	const userRequests = await db.select().from(userRequestLogin).where(eq(userRequestLogin.id, id))
	const userRequest = userRequests[0]
	if (!userRequest) {
		throw new Error('User request not found')
	}
	// update the user request

	const token = {
		sub: user.id,
		email: user.email,
		exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 7, // 7 days
	}
	const salt = 'authjs.session-token'
	const encodedToken = await encode({
		secret,
		token,
		salt,
	})
	await db
		.update(userRequestLogin)
		.set({
			status: 'accepted',
			userId: user.id,
			token: encodedToken,
		})
		.where(eq(userRequestLogin.id, id))
	console.log('Encoded token', encodedToken)
	const redirectUri = `${userRequest.redirectUri}?token=${encodedToken}`
	return redirectUri
}

export const getLoginRequestCLI = async (id: string) => {
	const userRequests = await db.select().from(userRequestLogin).where(eq(userRequestLogin.id, id))
	const userRequest = userRequests[0]
	if (!userRequest) {
		return null
	}
	return userRequest
}
const DEFAULT_TENANT_NAME = 'default'
export const createTenant = async (name: string, userId: string) => {
	const slug = slugify(name, { lower: true })
	const [tenantId] = await db
		.insert(tenantsTable)
		.values({
			creatorId: userId,
			slug,
			name,
		})
		.returning({
			id: tenantsTable.id,
		})
	// insert the user into the userTenantTable
	const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId.id))
	await db.insert(userTenantTable).values({
		userId,
		tenantId: tenant.id,
		role: 'ADMIN',
	})
	return tenant
}
export const createTenantServer = async (name: string) => {
	const user = await currentUser()
	if (!user) {
		throw new Error('User not found')
	}
	return createTenant(name, user.id)
}
export const getOrCreateDefaultTenantForUser = async (userId: string) => {
	const tenants = await db
		.select()
		.from(tenantsTable)
		.where(and(eq(tenantsTable.creatorId, userId), eq(tenantsTable.name, DEFAULT_TENANT_NAME)))
	if (tenants.length > 0) {
		return tenants[0]
	}
	const slug = slugify(DEFAULT_TENANT_NAME, { lower: true })
	const [tenantId] = await db
		.insert(tenantsTable)
		.values({
			creatorId: userId,
			slug,
			name: DEFAULT_TENANT_NAME,
		})
		.returning({
			id: tenantsTable.id,
		})
	const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId.id))
	// also add the user to the tenant
	await db.insert(userTenantTable).values({
		userId,
		tenantId: tenant.id,
		role: 'ADMIN',
	})
	return tenant
}

// UI tasks:
// 1. Create org based on mspId
// 2. Create peer based on org id
// 3. Create orderer based on org id
// 4. Create channel config based on orgs, peers and orderers
//    - Add orgs, peers and orderers to the channel config
//    - Add application config: (max message count, max message size, etc.)
//    - Add consensus params: (batch size, batch timeout, etc.)
// 5. Upload channel update based on the channel config
// 6. Create chaincode based on the orgs, peers and orderers

// add organization by msp id, tls and sign CA cert
// add peer by org id, tls, sign certs and URL
// add orderer by org id, tls, sign certs and URL
export const getTenantsByUserId = async (userId: string) => {
	const tenants = await db.select().from(tenantsTable).innerJoin(userTenantTable, eq(tenantsTable.id, userTenantTable.tenantId)).where(eq(userTenantTable.userId, userId))
	return tenants
}
export const isUserAllowedToTenantAndOrg = async (userId: string, tenantId: string, mspId: string) => {
	// check if the user is in the userTenantTable
	const userTenants = await db
		.select()
		.from(userTenantTable)
		.where(and(eq(userTenantTable.userId, userId), eq(userTenantTable.tenantId, tenantId)))
	if (userTenants.length > 0) {
		return true
	}
	// check if the user is in the userOrganizationTable for the mspId and tenantId
	const userOrgs = await db
		.select()
		.from(userOrganizationTable)
		.innerJoin(organizationsTable, eq(userOrganizationTable.organizationId, organizationsTable.id))
		.innerJoin(tenantsTable, eq(organizationsTable.tenantId, tenantsTable.id))
		.where(and(eq(userOrganizationTable.userId, userId), eq(organizationsTable.tenantId, tenantId), eq(organizationsTable.mspId, mspId)))
	if (userOrgs.length > 0) {
		return true
	}
	return false
}

export const isUserAllowedToTenant = async (userId: string, tenantId: string) => {
	// check if the user is in the userTenantTable
	const userTenants = await db
		.select()
		.from(userTenantTable)
		.where(and(eq(userTenantTable.userId, userId), eq(userTenantTable.tenantId, tenantId)))
	if (userTenants.length > 0) {
		return true
	}
	// check if the user is in the userOrganizationTable for the mspId and tenantId
	const userOrgs = await db
		.select()
		.from(userOrganizationTable)
		.innerJoin(organizationsTable, eq(userOrganizationTable.organizationId, organizationsTable.id))
		.innerJoin(tenantsTable, eq(organizationsTable.tenantId, tenantsTable.id))
		.where(and(eq(userOrganizationTable.userId, userId), eq(organizationsTable.tenantId, tenantId)))
	if (userOrgs.length > 0) {
		return true
	}
	return false
}

export const getTenantBySlugAndUserId = async (slug: string, userId: string) => {
	const tenants = await db
		.select()
		.from(tenantsTable)
		.where(and(eq(tenantsTable.slug, slug)))

	if (tenants.length === 0) {
		return null
	}
	const isAllowed = await isUserAllowedToTenant(userId, tenants[0].id)
	if (isAllowed) {
		return tenants[0]
	}
	return null
}
export const getOrganizations = async (tenantSlug: string, userId: string) => {
	const tenant = await getTenantBySlugAndUserId(tenantSlug, userId)
	if (!tenant) {
		throw new Error('Tenant not found')
	}
	const orgs = await db.select().from(organizationsTable).where(eq(organizationsTable.tenantId, tenant.id))
	return orgs
}

export const getNodesForOrganization = async (tenantId: string, orgId: string) => {
	const nodes = await db
		.select()
		.from(nodesTable)
		.where(and(eq(nodesTable.tenantId, tenantId), eq(nodesTable.orgId, orgId)))
	return nodes
}

export const getOrganizationsWithNodes = async (tenantSlug: string, userId: string) => {
	const tenant = await getTenantBySlugAndUserId(tenantSlug, userId)
	if (!tenant) {
		throw new Error('Tenant not found')
	}
	const nodes = await db
		.select()
		.from(organizationsTable)
		.where(and(eq(organizationsTable.tenantId, tenant.id)))
		.innerJoin(nodesTable, and(eq(organizationsTable.id, nodesTable.orgId), eq(nodesTable.tenantId, tenant.id)))
	return nodes
}
export const getOrganizationByMSPID = async (tenantId: string, mspId: string) => {
	const orgs = await db
		.select()
		.from(organizationsTable)
		.where(and(eq(organizationsTable.mspId, mspId), eq(organizationsTable.tenantId, tenantId)))
	if (orgs.length === 0) {
		return null
	}
	const org = orgs[0]
	return org
}
export const getOrganization = async (tenantId: string, orgId: string) => {
	const orgs = await db
		.select()
		.from(organizationsTable)
		.where(and(eq(organizationsTable.id, orgId), eq(organizationsTable.tenantId, tenantId)))
	if (orgs.length === 0) {
		return null
	}
	const org = orgs[0]
	return org
}
export const importOrganization = async (tenantId: string, mspId: string, tlsCACert: string, signCA: string) => {
	// create a new org
	const [orgId] = await db
		.insert(organizationsTable)
		.values({
			tenantId: tenantId,
			mspId,
			signCACert: signCA,
			tlsCACert: tlsCACert,
			orgName: mspId,
		})
		.returning({
			id: organizationsTable.id,
		})
	const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId.id))
	return org
}

export const updateOrganization = async (orgId: string, tlsCACert: string, signCA: string) => {
	// update the org
	await db
		.update(organizationsTable)
		.set({
			tlsCACert,
			signCACert: signCA,
			updatedAt: new Date(),
		})
		.where(eq(organizationsTable.id, orgId))
	const [org] = await db.select().from(organizationsTable).where(eq(organizationsTable.id, orgId))
	return org
}

export const updatePeer = async (peerId: string, tlsCert: string, signCert: string, url: string, region: string) => {
	const [lat, lng] = getCoordsForCode(region)
	// update the peer
	await db
		.update(nodesTable)
		.set({
			tlsCert,
			signCert,
			url,
			region,
			latitude: lat.toString(),
			longitude: lng.toString(),
		})
		.where(eq(nodesTable.id, peerId))
	const [peer] = await db.select().from(nodesTable).where(eq(nodesTable.id, peerId))
	return peer
}
export const importPeer = async (tenantId: string, orgId: string, peerName: string, tlsCert: string, signCert: string, url: string, region: string, userId: string) => {
	const [lat, lng] = getCoordsForCode(region)
	const org = await getOrganization(tenantId, orgId)
	if (!org) {
		throw new Error('Organization not found')
	}
	// create a new peer
	const [peerId] = await db
		.insert(nodesTable)
		.values({
			tenantId,
			name: peerName,
			region,
			latitude: lat.toString(),
			longitude: lng.toString(),
			orgId,
			tlsCert,
			type: 'PEER',
			signCert,
			url,
		})
		.returning({
			id: nodesTable.id,
		})

	const [peer] = await db.select().from(nodesTable).where(eq(nodesTable.id, peerId.id))
	await createAuditLog(tenantId, userId, orgId, 'PEER_CREATED', {
		peerName: peer.name,
		mspId: org.mspId,
		nodeId: peer.id,
	})
	return peer
}

export const updateOrderer = async (ordererId: string, tlsCert: string, signCert: string, url: string, region: string) => {
	const [lat, lng] = getCoordsForCode(region)
	// update the orderer
	await db
		.update(nodesTable)
		.set({
			tlsCert,
			signCert,
			url,
			region,
			latitude: lat.toString(),
			longitude: lng.toString(),
		})
		.where(eq(nodesTable.id, ordererId))
	const [orderer] = await db.select().from(nodesTable).where(eq(nodesTable.id, ordererId))
	return orderer
}

export const importOrderer = async (tenantId: string, orgId: string, ordererName: string, tlsCert: string, signCert: string, url: string, region: string, userId: string) => {
	const [lat, lng] = getCoordsForCode(region)
	const org = await getOrganization(tenantId, orgId)
	if (!org) {
		throw new Error('Organization not found')
	}
	// create a new orderer
	const [ordererId] = await db
		.insert(nodesTable)
		.values({
			name: ordererName,
			tenantId,
			orgId,
			tlsCert,
			type: 'ORDERER',
			signCert,
			url,
			region,
			latitude: lat.toString(),
			longitude: lng.toString(),
		})
		.returning({
			id: nodesTable.id,
		})
	const [orderer] = await db.select().from(nodesTable).where(eq(nodesTable.id, ordererId.id))
	await createAuditLog(tenantId, userId, orgId, 'ORDERER_CREATED', {
		nodeId: orderer.id,
		ordererName: orderer.name,
		mspId: org.mspId,
	})
	return orderer
}
export const getTenantBySlug = async (slug: string) => {
	const tenants = await db.select().from(tenantsTable).where(eq(tenantsTable.slug, slug))
	if (tenants.length === 0) {
		return null
	}
	const tenant = tenants[0]
	return tenant
}
export const getOrgsForUser = async (userId: string, tenantId: string) => {
	const orgs = await db
		.select()
		.from(userOrganizationTable)
		.innerJoin(organizationsTable, eq(userOrganizationTable.organizationId, organizationsTable.id))
		.where(and(eq(userOrganizationTable.userId, userId), eq(organizationsTable.tenantId, tenantId)))
	return orgs
}

OpenAPI.BASE = 'http://localhost:8080'
export const getChannelProposals = async (tenantId: string) => {
	const proposals = await db
		.select()
		.from(channelProposalTable)
		.where(eq(channelProposalTable.tenantId, tenantId))
		.innerJoin(tenantsTable, eq(channelProposalTable.tenantId, tenantsTable.id))
		.leftJoin(organizationsTable, eq(channelProposalTable.proposedByOrgId, organizationsTable.id))
		.orderBy(desc(channelProposalTable.createdAt))
	return proposals
}

export const getChaincodesProposals = async (tenantId: string) => {
	const proposals = await db
		.select()
		.from(chaincodeProposalTable)
		.where(eq(chaincodeProposalTable.tenantId, tenantId))
		.innerJoin(tenantsTable, eq(chaincodeProposalTable.tenantId, tenantsTable.id))
		.leftJoin(organizationsTable, eq(chaincodeProposalTable.proposedByOrgId, organizationsTable.id))
		.orderBy(desc(chaincodeProposalTable.createdAt))
	return proposals
}

export const getChaincodeApprovalForOrganization = async (proposalId: string, organizationId: string) => {
	const approvals = await db
		.select()
		.from(chaincodeProposalApprovalTable)
		.where(and(eq(chaincodeProposalApprovalTable.proposalId, proposalId), eq(chaincodeProposalApprovalTable.organizationId, organizationId)))
	if (approvals.length === 0) {
		return null
	}
	const approval = approvals[0]
	return approval
}
export const getApprovalForOrganization = async (proposalId: string, organizationId: string) => {
	const approvals = await db
		.select()
		.from(channelProposalApprovalTable)
		.where(and(eq(channelProposalApprovalTable.proposalId, proposalId), eq(channelProposalApprovalTable.organizationId, organizationId)))
	if (approvals.length === 0) {
		return null
	}
	const approval = approvals[0]
	return approval
}
export const commitChaincodeProposal = async (tenantId: string, proposalId: string, userId: string) => {
	const [proposal] = await db.select().from(chaincodeProposalTable).where(eq(chaincodeProposalTable.id, proposalId))
	await db
		.update(chaincodeProposalTable)
		.set({
			status: 'COMMITTED',
		})
		.where(eq(chaincodeProposalTable.id, proposalId))
	await createAuditLog(tenantId, userId, proposal.proposedByOrgId, 'CHAINCODE_COMMITTED', {
		chaincodeName: proposal.chaincodeName,
		version: proposal.version,
		sequence: proposal.sequence,
		endorsementPolicy: proposal.endorsementPolicy,
		proposalId: proposal.id,
		pdc: proposal.pdc,
		codeZipHash: proposal.codeZipHash,
		channelName: proposal.channelName,
	})
	return proposal
}

export const approveChannelProposal = async (tenantId: string, proposalId: string, organizationId: string, userId: string, signature: string, certificate: string) => {
	const [proposal] = await db.select().from(channelProposalTable).where(eq(channelProposalTable.id, proposalId))
	const [approvalId] = await db
		.insert(channelProposalApprovalTable)
		.values({
			proposalId,
			organizationId,
			userId,
			certificate,
			signature,
		})
		.returning({
			id: channelProposalApprovalTable.id,
		})
	// check if all orgs have approved
	const approvals = await db.select().from(channelProposalApprovalTable).where(eq(channelProposalApprovalTable.proposalId, proposalId))
	const allOrgs = new Set([...proposal.data.peerOrgs, ...proposal.data.ordererOrgs])
	const approvedOrgs = new Set(approvals.map((approval) => approval.organizationId))
	if (approvedOrgs.size === allOrgs.size) {
		await db
			.update(channelProposalTable)
			.set({
				status: 'APPROVED',
			})
			.where(eq(channelProposalTable.id, proposalId))
		await createAuditLog(tenantId, userId, organizationId, 'CHANNEL_APPROVED', {
			approvedBy: userId,
			channelName: proposal.channelName,
			proposalId: proposalId,
		})
	}
	const [approval] = await db.select().from(channelProposalApprovalTable).where(eq(channelProposalApprovalTable.id, approvalId.id))
	await createAuditLog(tenantId, userId, organizationId, 'CHANNEL_APPROVED', {
		approvedBy: userId,
		channelName: proposal.channelName,
		proposalId: approval.proposalId,
	})
	return approval
}

export const approveChaincodeProposal = async (tenantId: string, proposalId: string, organizationId: string, userId: string, signature: string, certificate: string) => {
	const [proposal] = await db.select().from(chaincodeProposalTable).where(eq(chaincodeProposalTable.id, proposalId))
	const [approvalId] = await db
		.insert(chaincodeProposalApprovalTable)
		.values({
			proposalId,
			organizationId,
			userId,
			certificate,
			signature,
		})
		.returning({
			id: chaincodeProposalApprovalTable.id,
		})
	const [approval] = await db.select().from(chaincodeProposalApprovalTable).where(eq(chaincodeProposalApprovalTable.id, approvalId.id))
	await createAuditLog(tenantId, userId, organizationId, 'CHAINCODE_APPROVED', {
		approvedBy: userId,
		version: proposal.version,
		chaincodeName: proposal.chaincodeName,
		proposalId: approval.proposalId,
	})
	return approval
}

export const getChaincodeProposalBySlug = async (tenantId: string, slug: string) => {
	const proposals = await db
		.select()
		.from(chaincodeProposalTable)
		.innerJoin(tenantsTable, eq(chaincodeProposalTable.tenantId, tenantsTable.id))
		.innerJoin(organizationsTable, eq(chaincodeProposalTable.proposedByOrgId, organizationsTable.id))
		
		.where(and(eq(chaincodeProposalTable.tenantId, tenantId), eq(chaincodeProposalTable.slug, slug)))
	if (proposals.length === 0) {
		return null
	}
	const proposal = proposals[0]
	return proposal
}
export const getChannelProposalBySlug = async (tenantId: string, slug: string) => {
	const proposals = await db
		.select()
		.from(channelProposalTable)
		.innerJoin(tenantsTable, eq(channelProposalTable.tenantId, tenantsTable.id))
		.innerJoin(organizationsTable, eq(channelProposalTable.proposedByOrgId, organizationsTable.id))
		.where(and(eq(channelProposalTable.tenantId, tenantId), eq(channelProposalTable.slug, slug)))
	if (proposals.length === 0) {
		return null
	}
	const proposal = proposals[0]
	return proposal
}
export const getTenantById = async (tenantId: string) => {
	const tenants = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId))
	if (tenants.length === 0) {
		return null
	}
	return tenants[0]
}
export const createChannelProposal = async (
	tenantId: string,
	proposedByOrgId: string,
	channelName: string,
	peerOrgParams: OrganizationDB[],
	ordererOrgParams: OrganizationDB[],
	consenters: NodeDB[],
	userId: string
) => {
	const tenant = await getTenantById(tenantId)
	const ordererOrgs = await Promise.all(
		ordererOrgParams.map(async (org) => {
			const nodes = await db
				.select()
				.from(nodesTable)
				.where(and(eq(nodesTable.tenantId, tenantId), eq(nodesTable.orgId, org.id), eq(nodesTable.type, 'ORDERER')))
			return {
				name: org.mspId,
				anchorPeers: [],
				ordererEndpoints: nodes.map((node) => node.url),
				signCACert: org.signCACert,
				tlsCACert: org.tlsCACert,
			} as main_Organization
		})
	)
	const peerOrgs = await Promise.all(
		peerOrgParams.map(async (org) => {
			const nodes = await db
				.select()
				.from(nodesTable)
				.where(and(eq(nodesTable.tenantId, tenantId), eq(nodesTable.orgId, org.id), eq(nodesTable.type, 'PEER')))
			return {
				name: org.mspId,
				anchorPeers: nodes.map((node) => {
					const [host, port] = node.url.split(':')
					return {
						host,
						port: parseInt(port),
					}
				}),
				ordererEndpoints: [],
				signCACert: org.signCACert,
				tlsCACert: org.tlsCACert,
			} as main_Organization
		})
	)

	const res = await postApiChannelGenesis({
		channel: {
			name: channelName,
			ordererOrgs,
			peerOrgs,
			consenters: consenters.map((node) => {
				// split host and port from url
				const url = new URL(`grpcs://${node.url}`)
				return {
					address: {
						host: url.hostname,
						port: parseInt(url.port),
					},
					clientTLSCert: node.tlsCert,
					serverTLSCert: node.tlsCert,
				}
			}),
		},
	})

	const blockDecoded = await postApiBlockDecode({
		block: {
			dataB64: res.channel!,
		},
	})
	const data: ChannelProposalData = {
		channelTx: res.channel!,
		channelConfig: blockDecoded.data,
		ordererOrgs: ordererOrgParams.map((org) => org.mspId),
		peerOrgs: peerOrgParams.map((org) => org.mspId),
	}
	const proposalShortId = `${channelName}_${Date.now()}`
	const [proposalId] = await db
		.insert(channelProposalTable)
		.values({
			tenantId,
			slug: proposalShortId,
			channelName,
			status: 'PROPOSED',
			proposedByOrgId: proposedByOrgId,
			data,
			isNew: true,
		})
		.returning({
			id: channelProposalTable.id,
		})

	const [proposal] = await db.select().from(channelProposalTable).where(eq(channelProposalTable.id, proposalId.id))
	const allOrgs = new Set([...peerOrgParams.map((org) => org.mspId), ...ordererOrgParams.map((org) => org.mspId)])
	const proposedByOrg = await getOrganization(tenantId, proposedByOrgId)
	for (const mspId of allOrgs) {
		const orgUsers = await db
			.select()
			.from(userOrganizationTable)
			.innerJoin(usersTable, eq(userOrganizationTable.userId, usersTable.id))
			.innerJoin(organizationsTable, eq(userOrganizationTable.organizationId, organizationsTable.id))
			.where(and(eq(organizationsTable.tenantId, tenantId), eq(organizationsTable.mspId, mspId)))
		// send email to all users in the org
		for (const orgUser of orgUsers) {
			const email = (
				<ChannelProposalEmail
					recipientName={mspId}
					channelName={proposal.channelName}
					proposedBy={proposedByOrg.orgName}
					proposalLink={`${EXTERNAL_PUBLIC_URL}/dashboard/${tenant.slug}/proposals/channels/${proposal.slug}/approve`}
				/>
			)
			const emailHtml = await render(email)
			const emailText = await render(email, {
				plainText: true,
			})

			await sendEmail({
				to: orgUser.user.email,
				html: emailHtml,
				text: emailText,
				subject: `Channel Proposal: ${proposal.channelName}`,
			})
		}
	}
	await createAuditLog(tenantId, userId, proposedByOrgId, 'CHANNEL_PROPOSED', {
		proposalId: proposal.id,
		channelName: proposal.channelName,
		proposedBy: userId,
	})
	return proposal
}

export const createChaincodeProposal = async (
	tenantId: string,
	proposedByOrgId: string,
	chaincodeName: string,
	channelName: string,
	codeZipHash: string,
	endorsementPolicy: string,
	pdc: any[],
	version: string,
	sequence: number,
	userId: string
) => {
	const tenant = await getTenantById(tenantId)
	const proposalSlug = `${channelName}_${chaincodeName}_${sequence}_${Date.now()}`
	const [proposalId] = await db
		.insert(chaincodeProposalTable)
		.values({
			channelName,
			chaincodeName,
			codeZipHash,
			endorsementPolicy,
			pdc: pdc || [],
			proposedByOrgId,
			slug: proposalSlug,
			status: 'PROPOSED',
			tenantId,
			version,
			sequence,
		})
		.returning({
			id: chaincodeProposalTable.id,
		})

	const [newProposal] = await db.select().from(chaincodeProposalTable).where(eq(chaincodeProposalTable.id, proposalId.id))
	const orgs = await db.select().from(organizationsTable).where(eq(organizationsTable.tenantId, tenantId))
	const allOrgs = orgs.map((org) => org.mspId)
	const proposedByOrg = await getOrganization(tenantId, proposedByOrgId)
	for (const mspId of allOrgs) {
		const orgUsers = await db
			.select()
			.from(userOrganizationTable)
			.innerJoin(usersTable, eq(userOrganizationTable.userId, usersTable.id))
			.innerJoin(organizationsTable, eq(userOrganizationTable.organizationId, organizationsTable.id))
			.where(and(eq(organizationsTable.tenantId, tenantId), eq(organizationsTable.mspId, mspId)))
		// send email to all users in the org
		for (const orgUser of orgUsers) {
			const email = (
				<ChaincodeProposalEmail
					chaincodeName={newProposal.chaincodeName}
					recipientName={mspId}
					channelName={newProposal.channelName}
					proposedBy={proposedByOrg.orgName}
					proposalLink={`${EXTERNAL_PUBLIC_URL}/dashboard/${tenant.slug}/proposals/chaincodes/${newProposal.slug}/approve`}
				/>
			)
			const emailHtml = await render(email)
			const emailText = await render(email, {
				plainText: true,
			})

			await sendEmail({
				to: orgUser.user.email,
				html: emailHtml,
				text: emailText,
				subject: `Chaincode Proposal: ${newProposal.channelName} / ${newProposal.chaincodeName}`,
			})
		}
	}
	await createAuditLog(tenantId, userId, proposedByOrgId, 'CHAINCODE_PROPOSED', {
		proposalId: newProposal.id,
		chaincodeName: newProposal.chaincodeName,
		channelName: newProposal.channelName,
		sequence: newProposal.sequence,
		version: newProposal.version,
		proposedBy: userId,
		codeZipHash: newProposal.codeZipHash,
		endorsementPolicy: newProposal.endorsementPolicy,
		pdc: newProposal.pdc,
	})
	return newProposal
}

// create local org by contacting hlf-manager
// create local peer by contacting hlf-manager
// create local orderer by contacting hlf-manager

// create channel config based on the orgs, peers and orderers
// create channel update by updating the channel config update
// upload signature to a channel config update

// create chaincode template+repo by contacting hlf-manager
// create chaincode by contacting hlf-manager

// integration with chaincode and github: create repo, once updated, prepare an image and create a version:
// that has, the image id, endorsement policy, private data collection, etc.
// once it has been built, it can be approved and committed with this command:
// fabriclaunch chaincode approve <chaincode_version_id>
// chaincode_version_id = endorsement policy + private data collection + image id + chaincode address (local or remote)
// then, once enough orgs have approved, it can be committed:
// fabriclaunch chaincode commit <chaincode_version_id>

// Function to create an invitation for a new organization
export const createOrganizationInvitation = async (tenantId: string, email: string) => {
	const token = v4()
	const [tenant] = await db.select().from(tenantsTable).where(eq(tenantsTable.id, tenantId))
	if (!tenant) {
		throw new Error('Tenant not found')
	}
	// expires in 7 days
	const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Invitation expires in 7 days
	const user = await currentUser()
	if (!user) {
		throw new Error('User not found')
	}
	const [invitationId] = await db
		.insert(organizationInvitationsTable)
		.values({
			tenantId,
			email,
			invitedBy: user.id,
			token,
			expiresAt,
		})
		.returning({ id: organizationInvitationsTable.id })

	const [invitation] = await db.select().from(organizationInvitationsTable).where(eq(organizationInvitationsTable.id, invitationId.id))

	// Send invitation email
	await sendInvitationEmail(invitation, tenant)

	return invitation
}

// Function to get an invitation by token
export const getInvitationByToken = async (token: string) => {
	const invitations = await db
		.select()
		.from(organizationInvitationsTable)
		.innerJoin(tenantsTable, eq(organizationInvitationsTable.tenantId, tenantsTable.id))
		.where(eq(organizationInvitationsTable.token, token))

	return invitations[0] || null
}

export const updateOrganizationInvitation = async (invitationId: string, orgName: string, mspId: string) => {
	const [invitation] = await db.select().from(organizationInvitationsTable).where(eq(organizationInvitationsTable.id, invitationId))
	if (!invitation) {
		throw new Error('Invitation not found')
	}
	await db
		.update(organizationInvitationsTable)
		.set({
			orgName,
			mspId,
		})
		.where(eq(organizationInvitationsTable.id, invitationId))
}
// Function to accept an invitation and create a new organization
export const acceptOrganizationInvitation = async (token: string, orgName: string, mspId: string) => {
	const user = await currentUser()
	if (!user) {
		throw new Error('User not found')
	}
	const invRes = await getInvitationByToken(token)
	if (!invRes) {
		throw new Error('Invitation not found')
	}
	const { organization_invitation: invitation } = invRes
	if (!invitation || invitation.status !== 'PENDING' || invitation.expiresAt < new Date()) {
		throw new Error('Invalid or expired invitation')
	}

	return await db.transaction(async (tx) => {
		// Create the organization
		const [org] = await tx
			.insert(organizationsTable)
			.values({
				tenantId: invitation.tenantId,
				orgName: orgName,
				mspId: mspId,
				signCACert: '', // You'll need to set these values
				tlsCACert: '', // You'll need to set these values
			})
			.returning()

		// Add the user to the organization
		await tx.insert(userOrganizationTable).values({
			userId: user.id,
			organizationId: org.id,
			role: 'ADMIN', // The accepting user becomes an admin
		})

		// Update the invitation status
		await tx
			.update(organizationInvitationsTable)
			.set({
				status: 'ACCEPTED',
				orgName,
				mspId,
				acceptedBy: user.id,
			})
			.where(eq(organizationInvitationsTable.id, invitation.id))

		return org
	})
}

// Function to list pending invitations for a tenant
export const listPendingInvitations = async (tenantId: string) => {
	return await db
		.select()
		.from(organizationInvitationsTable)
		.where(and(eq(organizationInvitationsTable.tenantId, tenantId), eq(organizationInvitationsTable.status, 'PENDING'), gt(organizationInvitationsTable.expiresAt, new Date())))
}

// Function to cancel an invitation
export const cancelInvitation = async (invitationId: string) => {
	await db.update(organizationInvitationsTable).set({ status: 'EXPIRED' }).where(eq(organizationInvitationsTable.id, invitationId))
}

// Function to add a user to an organization
export const addUserToOrganization = async (userId: string, organizationId: string, role: string) => {
	const [userOrg] = await db
		.insert(userOrganizationTable)
		.values({
			userId,
			organizationId,
			role,
		})
		.returning()

	return userOrg
}

// Function to remove a user from an organization
export const removeUserFromOrganization = async (userId: string, organizationId: string) => {
	await db.delete(userOrganizationTable).where(and(eq(userOrganizationTable.userId, userId), eq(userOrganizationTable.organizationId, organizationId)))
}

// Function to update a user's role in an organization
export const updateUserOrganizationRole = async (userId: string, organizationId: string, newRole: string) => {
	const [updatedUserOrg] = await db
		.update(userOrganizationTable)
		.set({ role: newRole, updatedAt: new Date() })
		.where(and(eq(userOrganizationTable.userId, userId), eq(userOrganizationTable.organizationId, organizationId)))
		.returning()

	return updatedUserOrg
}

// Function to get all organizations for a user
export const getUserOrganizations = async (userId: string) => {
	const userOrgs = await db
		.select()
		.from(userOrganizationTable)
		.innerJoin(organizationsTable, eq(userOrganizationTable.organizationId, organizationsTable.id))
		.where(eq(userOrganizationTable.userId, userId))

	return userOrgs
}

// Function to get all users for an organization
export const getOrganizationUsers = async (organizationId: string) => {
	const orgUsers = await db
		.select()
		.from(userOrganizationTable)
		.innerJoin(usersTable, eq(userOrganizationTable.userId, usersTable.id))
		.where(eq(userOrganizationTable.organizationId, organizationId))

	return orgUsers
}

// Helper function to send invitation email
const sendInvitationEmail = async (invitation: OrganizationInvitationDB, tenant: TenantDB) => {
	const invitationLink = `${process.env.NEXT_PUBLIC_EXTERNAL_URL as string}/accept-invitation?token=${invitation.token}`
	const expiresAt = invitation.expiresAt.toLocaleString()
	const email = <InvitationEmail invitationLink={invitationLink} expiresAt={expiresAt} />
	const emailHtml = await render(email)
	const emailText = await render(email, {
		plainText: true,
	})
	await sendEmail({
		to: invitation.email,
		subject: `Invitation to join ${tenant.name}`,
		html: emailHtml,
		text: emailText,
	})
}
