import { DEFAULT_TENANT_NAME } from "../constants"
import { execute } from "../graphql/client/execute"
import { AuditLogType, CreateAuditDocument } from "../graphql/client/graphql"

// Typed interfaces for each event type
export interface PeerCreatedDetails {
	peerName: string;
	orgId: string;
	nodeId: string;
}

export interface OrdererCreatedDetails {
	ordererName: string;
	orgId: string;
	nodeId: string;
}

export interface ChannelProposedDetails {
	channelName: string;
	proposalId: string;
	proposedBy: string;
}

export interface OrdererJoinedDetails {
	orderers: string[];
	channelName: string;
}

export interface PeerJoinedDetails {
	peers: string[];
	channelName: string;
}

export interface ChaincodeProposedDetails {
	chaincodeName: string;
	version: string;
	proposalId: string;
	proposedBy: string;
}

export interface ChaincodeApprovedDetails {
	chaincodeName: string;
	version: string;
	approvedBy: string;
	proposalId: string;
}

export interface ChaincodeCommittedDetails {
	chaincodeName: string;
	version: string;
	channelName: string;
}

export interface ChannelReadyDetails {
	channelName: string;
}

// Union type for all possible detail types

export type AuditLogDetails = {
	PEER_CREATED: PeerCreatedDetails,
	ORDERER_CREATED: OrdererCreatedDetails,
	CHANNEL_PROPOSED: ChannelProposedDetails,
	CHANNEL_READY: ChannelReadyDetails
	ORDERER_JOINED: OrdererJoinedDetails,
	PEER_JOINED: PeerJoinedDetails,
	CHAINCODE_PROPOSED: ChaincodeProposedDetails,
	CHAINCODE_APPROVED: ChaincodeApprovedDetails,
	CHAINCODE_COMMITTED: ChaincodeCommittedDetails,
};

export const createAuditLog = async <T extends keyof AuditLogDetails>(
	tenantSlug: string,
	mspId: string,
	logType: T,
	details: AuditLogDetails[T]
) => {
	return await execute(CreateAuditDocument, {
		input: {
			mspId,
			logType: logType as AuditLogType,
			details,
			tenantSlug: tenantSlug,
		}
	})
}
