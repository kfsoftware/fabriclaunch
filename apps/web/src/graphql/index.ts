import { postApiBlockAnchorpeers } from "@/channel-mgmt-client";
import { ChaincodeProposalDB, ChannelProposalDB, NodeDB, OrganizationDB } from "@/db";
import { AuditLogDetails, approveChaincodeProposal, approveChannelProposal, commitChaincodeProposal, createChaincodeProposal, createChannelProposal, getApprovalForOrganization, getAuditLogs, getChaincodeApprovalForOrganization, getChaincodeProposalBySlug, getChannelProposalBySlug, getChannelProposals, getNodeByName, getOrganization, getOrganizationByMSPID, getOrganizations, getTenantBySlug, getTenantBySlugAndUserId, importOrderer, importOrganization, importPeer, isUserAllowedToTenantAndOrg, updateOrderer, updateOrganization, updatePeer } from "@/lib/logic";
import { type ApolloContext } from "@/types/apollo";
import { GraphQLJSON, GraphQLJSONObject } from 'graphql-type-json';
import "reflect-metadata";
import { Arg, Ctx, Field, InputType, Mutation, ObjectType, Query, Resolver, buildSchema, registerEnumType } from "type-graphql";

import { AuditLogDB, auditLogTable } from "@/db";
import { createAuditLog } from "@/lib/logic";

@InputType("OrgImportInput")
class OrgImportInput {
	@Field()
	mspId: string;

	@Field()
	tenantSlug: string;

	@Field()
	signCACert: string;

	@Field()
	tlsCACert: string;
}

@InputType("PeerImportInput")
class PeerImportInput {
	@Field()
	mspId: string;

	@Field()
	tenantSlug: string;

	@Field()
	name: string;

	@Field()
	url: string;

	@Field()
	region: string

	@Field()
	signCert: string;

	@Field()
	tlsCert: string;
}

@InputType("OrdererImportInput")
class OrdererImportInput {
	@Field()
	mspId: string;

	@Field()
	tenantSlug: string;

	@Field()
	name: string;

	@Field()
	region: string

	@Field()
	url: string;

	@Field()
	signCert: string;

	@Field()
	tlsCert: string;
}

@ObjectType("Org")
class Org {
	@Field()
	id: string;
	@Field()
	mspId: string;
	@Field()
	signCACert: string;
	@Field()
	tlsCACert: string;
}

@ObjectType("Peer")
class Peer {
	@Field()
	id: string;
	@Field()
	mspId: string;
	@Field()
	signCert: string;
	@Field()
	tlsCert: string;
}


@ObjectType("Orderer")
class Orderer {
	@Field()
	id: string;
	@Field()
	mspId: string;
	@Field()
	signCert: string;
	@Field()
	tlsCert: string;
}
@InputType("NodeOrg")
class NodeOrg {
	@Field()
	mspId: string;

	@Field()
	name: string;
}
@InputType("ProposeChannelInput")
class ProposeChannelInput {
	@Field()
	name: string;

	@Field()
	mspId: string;

	@Field(() => [String])
	peerOrgs: string[];

	@Field(() => [String])
	ordererOrgs: string[];

	@Field()
	tenantSlug: string;
	@Field(() => [NodeOrg])
	consenters: NodeOrg[];
}

@InputType("ProposeChaincodeInput")
class ProposeChaincodeInput {
	@Field()
	channelName: string;

	@Field()
	mspId: string;

	@Field()
	chaincodeName: string;

	@Field()
	version: string;

	@Field()
	sequence: number;

	@Field()
	endorsementPolicy: string;

	@Field(() => GraphQLJSON)
	pdc: any;

	@Field()
	codeZipHash: string;

	@Field()
	tenantSlug: string;
}

@InputType("ApproveProposalInput")
class ApproveProposalInput {
	@Field()
	proposalId: string;

	@Field()
	tenantSlug: string;

	@Field()
	mspId: string;

	@Field()
	signature: string;

	@Field()
	cert: string;
}

@InputType("ApproveChaincodeProposalInput")
class ApproveChaincodeProposalInput {
	@Field()
	proposalId: string;

	@Field()
	tenantSlug: string;

	@Field()
	mspId: string;

	@Field()
	signature: string;

	@Field()
	cert: string;
}
@ObjectType("ChannelProposalData")
class ChannelProposalData {
	@Field(() => [String])
	// peer org ids
	peerOrgs: string[];
	// orderer org ids
	@Field(() => [String])
	ordererOrgs: string[];
	// channel tx in base64
	@Field()
	channelTx: string;
	// channel config in JSON
	@Field(() => GraphQLJSONObject)
	channelConfig: any
}
@ObjectType("ChannelProposal")
class ChannelProposal {
	@Field()
	id: string;
	@Field()
	channelName: string;
	@Field(() => ChannelProposalData)
	channelData: ChannelProposalData;
}

@ObjectType("ChaincodeProposal")
class ChaincodeProposal {
	@Field()
	id: string;
	@Field()
	chaincodeName: string;
	@Field()
	version: string;
	@Field()
	sequence: number;
	@Field()
	endorsementPolicy: string;
	@Field(() => GraphQLJSON)
	pdc: any;
	@Field()
	codeZipHash: string;
	@Field()
	channelName: string;
}

@ObjectType("ChannelProposalApproval")
class ChannelProposalApproval {
	@Field()
	id: string;
	@Field()
	proposalId: string;
	@Field()
	approvedAt: Date;
}
@ObjectType("ChaincodeProposalApproval")
class ChaincodeProposalApproval {
	@Field()
	id: string;
	@Field()
	proposalId: string;
	@Field()
	approvedAt: Date;
}
@InputType("HostPort")
class HostPort {
	@Field()
	host: string;
	@Field()
	port: number;

}
@InputType("SetAnchorPeersInput")
class SetAnchorPeersInput {
	@Field()
	mspId: string;

	@Field(() => [HostPort])
	anchorPeers: HostPort[];

	@Field()
	channelName: string;

	@Field()
	channelB64: string;
}

@ObjectType("SetAnchorPeersResponse")
class SetAnchorPeersResponse {
	@Field()
	updateB64: string;
	@Field()
	noChanges: boolean;
}

@InputType("CommitChaincodeProposalInput")
class CommitChaincodeProposalInput {
	@Field()
	proposalId: string;

	@Field()
	tenantSlug: string;

	@Field()
	mspId: string;
}

export enum AuditLogType {
	PEER_CREATED = "PEER_CREATED",
	ORDERER_CREATED = "ORDERER_CREATED",
	CHANNEL_PROPOSED = "CHANNEL_PROPOSED",
	ORDERER_JOINED = "ORDERER_JOINED",
	PEER_JOINED = "PEER_JOINED",
	CHAINCODE_PROPOSED = "CHAINCODE_PROPOSED",
	CHAINCODE_APPROVED = "CHAINCODE_APPROVED",
	CHAINCODE_COMMITTED = "CHAINCODE_COMMITTED"
}

// Register the enum with TypeGraphQL
registerEnumType(AuditLogType, {
	name: "AuditLogType", // This is the name that will be used in the GraphQL schema
	description: "The type of audit log entry",
});
@ObjectType("AuditLog")
class AuditLog {
	@Field()
	id: string;

	@Field()
	tenantId: string;

	@Field()
	userId: string;

	@Field(() => AuditLogType)
	logType: AuditLogType;

	@Field(() => GraphQLJSONObject)
	details: any;

	@Field()
	createdAt: Date;
}

@InputType("CreateAuditLogInput")
class CreateAuditLogInput {
	@Field()
	tenantSlug: string;
	@Field()
	mspId: string;
	@Field(() => AuditLogType)
	logType: AuditLogType;

	@Field(() => GraphQLJSONObject)
	details: any;
}

@Resolver()
export class AuditLogResolver {
	@Query(() => [AuditLog])
	async auditLogs(
		@Ctx() ctx: ApolloContext,
		@Arg("tenantSlug") tenantSlug: string
	): Promise<AuditLog[]> {
		if (!ctx.user) {
			throw new Error("User not found");
		}

		const tenant = await getTenantBySlugAndUserId(tenantSlug, ctx.user.id);
		if (!tenant) {
			throw new Error("Tenant not found");
		}

		const logs = await getAuditLogs(tenant.id)

		return logs.map(({ audit_log }) => this.mapAuditLog(audit_log));
	}

	@Mutation(() => AuditLog)
	async createAuditLog(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: CreateAuditLogInput
	): Promise<AuditLog> {
		if (!ctx.user) {
			throw new Error("User not found");
		}

		const tenant = await getTenantBySlugAndUserId(input.tenantSlug, ctx.user.id);
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const org = await getOrganizationByMSPID(tenant.id, input.mspId);
		if (!org) {
			throw new Error("Organization not found");
		}
		const auditLog = await createAuditLog(
			tenant.id,
			ctx.user.id,
			org.id,
			input.logType as keyof AuditLogDetails,
			input.details
		);

		return this.mapAuditLog(auditLog);
	}

	private mapAuditLog(log: AuditLogDB): AuditLog {
		return {
			id: log.id,
			tenantId: log.tenantId,
			userId: log.userId,
			logType: log.logType as AuditLogType,
			details: log.details,
			createdAt: log.createdAt,
		};
	}
}



@Resolver()
export class ChannelResolver {

	@Mutation(() => SetAnchorPeersResponse)
	async updateConfigWithAnchorPeers(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: SetAnchorPeersInput
	): Promise<SetAnchorPeersResponse> {
		const res = await postApiBlockAnchorpeers({
			update: {
				anchorPeers: input.anchorPeers.map(item => ({
					host: item.host,
					port: item.port
				})),
				channelName: input.channelName,
				blockB64: input.channelB64,
				mspID: input.mspId
			}
		})
		return {
			updateB64: res.blockB64,
			noChanges: res.noChanges
		}
	}

	@Query(() => ChaincodeProposal)
	async chaincodeProposal(
		@Ctx() ctx: ApolloContext,
		@Arg("tenantSlug") tenantSlug: string,
		@Arg("proposalSlug") proposalSlug: string
	): Promise<ChaincodeProposal> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			tenantSlug,
			ctx.user.id,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const proposal = await getChaincodeProposalBySlug(
			tenant.id,
			proposalSlug.replace("prop_", "")
		)
		return this.mapChaincodeProposal(proposal.chaincode_proposal)
	}
	@Query(() => ChannelProposal)
	async channelProposal(
		@Ctx() ctx: ApolloContext,
		@Arg("tenantSlug") tenantSlug: string,
		@Arg("proposalSlug") proposalSlug: string
	): Promise<ChannelProposal> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			tenantSlug,
			ctx.user.id,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const approval = await getChannelProposalBySlug(
			tenant.id,
			proposalSlug.replace("prop_", "")
		)
		return this.mapChannelProposal(approval.channel_proposal)
	}

	@Mutation(() => ChaincodeProposalApproval)
	async approveChaincodeProposal(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: ApproveChaincodeProposalInput
	) {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			input.tenantSlug,
			ctx.user.id,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const org = await getOrganizationByMSPID(tenant.id, input.mspId)
		if (!org) {
			throw new Error("Organization not found");
		}
		const proposalSlug = input.proposalId.replace("prop_", "")
		const proposal = await getChaincodeProposalBySlug(
			tenant.id,
			proposalSlug
		)
		if (!proposal) {
			throw new Error("Proposal not found");
		}
		const existingApproval = await getChaincodeApprovalForOrganization(
			proposal.chaincode_proposal.id,
			org.id
		)
		if (existingApproval) {
			return {
				id: existingApproval.id,
				proposalId: existingApproval.proposalId,
				approvedAt: existingApproval.approvedAt
			}
		}
		const approval = await approveChaincodeProposal(
			tenant.id,
			proposal.chaincode_proposal.id,
			org.id,
			ctx.user.id,
			input.signature,
			input.cert
		)
		return {
			id: approval.id,
			proposalId: approval.proposalId,
			approvedAt: approval.approvedAt
		}

	}

	@Mutation(() => ChannelProposalApproval)
	async approveChannelProposal(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: ApproveProposalInput
	) {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			input.tenantSlug,
			ctx.user.id,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const org = await getOrganizationByMSPID(tenant.id, input.mspId)
		if (!org) {
			throw new Error("Organization not found");
		}
		const proposalSlug = input.proposalId.replace("prop_", "")
		const proposal = await getChannelProposalBySlug(
			tenant.id,
			proposalSlug
		)
		if (!proposal) {
			throw new Error("Proposal not found");
		}
		const existingApproval = await getApprovalForOrganization(
			proposal.channel_proposal.id,
			org.id
		)
		if (existingApproval) {
			throw new Error(`Approval already exists for ${org.mspId}`);
		}
		const approval = await approveChannelProposal(
			tenant.id,
			proposal.channel_proposal.id,
			org.id,
			ctx.user.id,
			input.signature,
			input.cert
		)
		return {
			id: approval.id,
			proposalId: approval.proposalId,
			approvedAt: approval.approvedAt
		}
	}

	@Query(() => [ChannelProposal])
	async channelProposals(
		@Ctx() ctx: ApolloContext,
		@Arg("tenantSlug") tenantSlug: string
	) {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			tenantSlug,
			ctx.user.id,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}

		const proposals = await getChannelProposals(
			tenant.id
		)
		return proposals.map(({ channel_proposal }) => this.mapChannelProposal(channel_proposal))
	}

	@Mutation(() => ChaincodeProposal)
	async commitChaincodeProposal(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: CommitChaincodeProposalInput
	): Promise<ChaincodeProposal> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			input.tenantSlug,
			ctx.user.id
		)
		const proposal = await getChaincodeProposalBySlug(
			tenant.id,
			input.proposalId.replace("prop_", ""),
		)
		if (!proposal) {
			throw new Error("Proposal not found");
		}
		const chaincodeProposal = await commitChaincodeProposal(
			tenant.id,
			proposal.chaincode_proposal.id,
			ctx.user.id
		)
		return this.mapChaincodeProposal(chaincodeProposal)
	}

	@Mutation(() => ChaincodeProposal)
	async proposeChaincode(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: ProposeChaincodeInput
	): Promise<ChaincodeProposal> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			input.tenantSlug,
			ctx.user.id,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const org = await getOrganizationByMSPID(tenant.id, input.mspId)
		if (!org) {
			throw new Error("Organization not found");
		}
		const proposal = await createChaincodeProposal(
			tenant.id,
			org.id,
			input.chaincodeName,
			input.channelName,
			input.codeZipHash,
			input.endorsementPolicy,
			input.pdc,
			input.version,
			input.sequence,
			ctx.user.id
		)
		return this.mapChaincodeProposal(proposal)
	}

	@Mutation(() => ChannelProposal)
	async proposeChannelCreation(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: ProposeChannelInput
	): Promise<ChannelProposal> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlugAndUserId(
			input.tenantSlug,
			ctx.user.id,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const org = await getOrganizationByMSPID(tenant.id, input.mspId)
		if (!org) {
			throw new Error("Organization not found");
		}
		const peerOrgs = await Promise.all(input.peerOrgs.map(async (orgId) => {
			const org = await getOrganizationByMSPID(tenant.id, orgId)
			if (!org) {
				throw new Error("Organization not found");
			}
			return org;
		}))
		const ordererOrgs = await Promise.all(input.ordererOrgs.map(async (orgId) => {
			const org = await getOrganizationByMSPID(tenant.id, orgId)
			if (!org) {
				throw new Error("Organization not found");
			}
			return org;
		}))
		const consenters = await Promise.all(input.consenters.map(async (nodeId) => {
			const org = await getOrganizationByMSPID(tenant.id, nodeId.mspId)
			if (!org) {
				throw new Error("Organization not found");
			}
			const node = await getNodeByName(tenant.id, org.id, nodeId.name)
			if (!node) {
				throw new Error("Node not found");
			}
			if (node.type !== 'ORDERER') {
				throw new Error("Consenter must be an orderer");
			}
			return node;
		}))
		try {
			const channelProposal = await createChannelProposal(
				tenant.id,
				org.id,
				input.name,
				peerOrgs,
				ordererOrgs,
				consenters,
				ctx.user.id,
			)
			return this.mapChannelProposal(channelProposal)
		} catch (e) {
			console.error(e)
			throw new Error("Error creating channel proposal")
		}
	}

	private mapChannelProposal(
		proposal: ChannelProposalDB
	): ChannelProposal {
		return {
			id: `prop_${proposal.slug}`,
			channelName: proposal.channelName,
			channelData: proposal.data,

		}
	}

	private mapChaincodeProposal(
		proposal: ChaincodeProposalDB
	): ChaincodeProposal {
		return {
			id: `prop_${proposal.slug}`,
			chaincodeName: proposal.chaincodeName,
			version: proposal.version,
			endorsementPolicy: proposal.endorsementPolicy,
			pdc: proposal.pdc,
			sequence: proposal.sequence,
			codeZipHash: proposal.codeZipHash,
			channelName: proposal.channelName
		}
	}

}

@Resolver()
export class NodeResolver {

	@Query(() => [Org])
	async orgs(@Ctx() ctx: ApolloContext, @Arg("tenantSlug") tenantSlug: string): Promise<Org[]> {
		if (!ctx.user) {
			throw new Error("User not found");
		}
		const orgs = await getOrganizations(tenantSlug, ctx.user.id);
		return orgs.map(this.mapOrg);
	}

	@Query(() => Org)
	async org(
		@Ctx() ctx: ApolloContext,
		@Arg("tenantSlug") tenantSlug: string,
		@Arg("orgId") orgId: string
	): Promise<Org | null> {
		const tenant = await getTenantBySlugAndUserId(
			tenantSlug,
			ctx.user.id
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const org = await getOrganization(tenantSlug, orgId);
		if (!org) {
			return null;
		}
		return this.mapOrg(org);
	}


	@Mutation(() => Org)
	async importOrg(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: OrgImportInput
	): Promise<Org> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlug(
			input.tenantSlug,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const isUserAllowed = await isUserAllowedToTenantAndOrg(
			ctx.user.id,
			tenant.id,
			input.mspId
		)
		if (!isUserAllowed) {
			throw new Error("User not allowed to import organization")
		}
		const existingOrg = await getOrganizationByMSPID(tenant.id, input.mspId)
		if (existingOrg) {
			// update org
			const org = await updateOrganization(
				existingOrg.id,
				input.tlsCACert,
				input.signCACert,
			)
			return this.mapOrg(org);
		}
		const org = await importOrganization(
			tenant.id,
			input.mspId,
			input.tlsCACert,
			input.signCACert,
		)
		return this.mapOrg(org);
	}
	@Mutation(() => Peer)
	async importPeer(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: PeerImportInput
	): Promise<Peer> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlug(
			input.tenantSlug,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const isUserAllowed = await isUserAllowedToTenantAndOrg(
			ctx.user.id,
			tenant.id,
			input.mspId
		)
		if (!isUserAllowed) {
			throw new Error("User not allowed to import organization")
		}
		const existingOrg = await getOrganizationByMSPID(tenant.id, input.mspId)
		if (!existingOrg) {
			throw new Error("Organization not found");
		}
		const existingNode = await getNodeByName(
			tenant.id,
			existingOrg.id,
			input.name
		)
		if (existingNode) {
			// update node
			const peer = await updatePeer(
				existingNode.id,
				input.tlsCert,
				input.signCert,
				input.url,
				input.region
			)
			return this.mapPeer(peer, existingOrg);
		}
		const node = await importPeer(
			tenant.id,
			existingOrg.id,
			input.name,
			input.tlsCert,
			input.signCert,
			input.url,
			input.region,
			ctx.user.id
		)

		return this.mapPeer(node, existingOrg);
	}

	@Mutation(() => Orderer)
	async importOrderer(
		@Ctx() ctx: ApolloContext,
		@Arg("input") input: OrdererImportInput
	): Promise<Orderer> {
		if (!ctx.user) {
			throw new Error("User not found")
		}
		const tenant = await getTenantBySlug(
			input.tenantSlug,
		)
		if (!tenant) {
			throw new Error("Tenant not found");
		}
		const isUserAllowed = await isUserAllowedToTenantAndOrg(
			ctx.user.id,
			tenant.id,
			input.mspId
		)
		if (!isUserAllowed) {
			throw new Error("User not allowed to import organization")
		}
		const existingOrg = await getOrganizationByMSPID(tenant.id, input.mspId)
		if (!existingOrg) {
			throw new Error("Organization not found");
		}
		const existingNode = await getNodeByName(
			tenant.id,
			existingOrg.id,
			input.name
		)
		if (existingNode) {
			// update node
			const orderer = await updateOrderer(
				existingNode.id,
				input.tlsCert,
				input.signCert,
				input.url,
				input.region,
			)
			return this.mapPeer(orderer, existingOrg);
		}
		const node = await importOrderer(
			tenant.id,
			existingOrg.id,
			input.name,
			input.tlsCert,
			input.signCert,
			input.url,
			input.region,
			ctx.user.id,
		)
		return this.mapOrderer(node, existingOrg);
	}

	private mapPeer(
		peer: NodeDB,
		org: OrganizationDB
	): Peer {
		return {
			id: peer.id,
			mspId: org.mspId,
			signCert: peer.signCert,
			tlsCert: peer.tlsCert,
		};
	}
	private mapOrderer(
		orderer: NodeDB,
		org: OrganizationDB
	): Orderer {
		return {
			id: orderer.id,
			mspId: org.mspId,
			signCert: orderer.signCert,
			tlsCert: orderer.tlsCert,
		};
	}
	private mapOrg(
		org: OrganizationDB
	): Org {
		return {
			id: org.id,
			mspId: org.mspId,
			signCACert: org.signCACert,
			tlsCACert: org.tlsCACert,
		};
	}

}

export const schema = await buildSchema({
	resolvers: [NodeResolver, ChannelResolver, AuditLogResolver],
});
