/* eslint-disable */
import { DocumentTypeDecoration } from '@graphql-typed-document-node/core';
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  /** A date-time string at UTC, such as 2007-12-03T10:15:30Z, compliant with the `date-time` format outlined in section 5.6 of the RFC 3339 profile of the ISO 8601 standard for representation of dates and times using the Gregorian calendar.This scalar is serialized to a string in ISO 8601 format and parsed from a string in ISO 8601 format. */
  DateTimeISO: { input: any; output: any; }
  /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSON: { input: any; output: any; }
  /** The `JSONObject` scalar type represents JSON objects as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
  JSONObject: { input: any; output: any; }
};

export type ApproveChaincodeProposalInput = {
  cert: Scalars['String']['input'];
  mspId: Scalars['String']['input'];
  proposalId: Scalars['String']['input'];
  signature: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
};

export type ApproveProposalInput = {
  cert: Scalars['String']['input'];
  mspId: Scalars['String']['input'];
  proposalId: Scalars['String']['input'];
  signature: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
};

export type AuditLog = {
  __typename?: 'AuditLog';
  createdAt: Scalars['DateTimeISO']['output'];
  details: Scalars['JSONObject']['output'];
  id: Scalars['String']['output'];
  logType: AuditLogType;
  tenantId: Scalars['String']['output'];
  userId: Scalars['String']['output'];
};

/** The type of audit log entry */
export enum AuditLogType {
  ChaincodeApproved = 'CHAINCODE_APPROVED',
  ChaincodeCommitted = 'CHAINCODE_COMMITTED',
  ChaincodeProposed = 'CHAINCODE_PROPOSED',
  ChannelProposed = 'CHANNEL_PROPOSED',
  OrdererCreated = 'ORDERER_CREATED',
  OrdererJoined = 'ORDERER_JOINED',
  PeerCreated = 'PEER_CREATED',
  PeerJoined = 'PEER_JOINED'
}

export type ChaincodeProposal = {
  __typename?: 'ChaincodeProposal';
  chaincodeName: Scalars['String']['output'];
  channelName: Scalars['String']['output'];
  codeZipHash: Scalars['String']['output'];
  endorsementPolicy: Scalars['String']['output'];
  id: Scalars['String']['output'];
  pdc: Scalars['JSON']['output'];
  sequence: Scalars['Float']['output'];
  version: Scalars['String']['output'];
};

export type ChaincodeProposalApproval = {
  __typename?: 'ChaincodeProposalApproval';
  approvedAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  proposalId: Scalars['String']['output'];
};

export type ChannelProposal = {
  __typename?: 'ChannelProposal';
  channelData: ChannelProposalData;
  channelName: Scalars['String']['output'];
  id: Scalars['String']['output'];
};

export type ChannelProposalApproval = {
  __typename?: 'ChannelProposalApproval';
  approvedAt: Scalars['DateTimeISO']['output'];
  id: Scalars['String']['output'];
  proposalId: Scalars['String']['output'];
};

export type ChannelProposalData = {
  __typename?: 'ChannelProposalData';
  channelConfig: Scalars['JSONObject']['output'];
  channelTx: Scalars['String']['output'];
  ordererOrgs: Array<Scalars['String']['output']>;
  peerOrgs: Array<Scalars['String']['output']>;
};

export type CommitChaincodeProposalInput = {
  mspId: Scalars['String']['input'];
  proposalId: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
};

export type CreateAuditLogInput = {
  details: Scalars['JSONObject']['input'];
  logType: AuditLogType;
  mspId: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
};

export type HostPort = {
  host: Scalars['String']['input'];
  port: Scalars['Float']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  approveChaincodeProposal: ChaincodeProposalApproval;
  approveChannelProposal: ChannelProposalApproval;
  commitChaincodeProposal: ChaincodeProposal;
  createAuditLog: AuditLog;
  importOrderer: Orderer;
  importOrg: Org;
  importPeer: Peer;
  proposeChaincode: ChaincodeProposal;
  proposeChannelCreation: ChannelProposal;
  updateConfigWithAnchorPeers: SetAnchorPeersResponse;
};


export type MutationApproveChaincodeProposalArgs = {
  input: ApproveChaincodeProposalInput;
};


export type MutationApproveChannelProposalArgs = {
  input: ApproveProposalInput;
};


export type MutationCommitChaincodeProposalArgs = {
  input: CommitChaincodeProposalInput;
};


export type MutationCreateAuditLogArgs = {
  input: CreateAuditLogInput;
};


export type MutationImportOrdererArgs = {
  input: OrdererImportInput;
};


export type MutationImportOrgArgs = {
  input: OrgImportInput;
};


export type MutationImportPeerArgs = {
  input: PeerImportInput;
};


export type MutationProposeChaincodeArgs = {
  input: ProposeChaincodeInput;
};


export type MutationProposeChannelCreationArgs = {
  input: ProposeChannelInput;
};


export type MutationUpdateConfigWithAnchorPeersArgs = {
  input: SetAnchorPeersInput;
};

export type NodeOrg = {
  mspId: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type Orderer = {
  __typename?: 'Orderer';
  id: Scalars['String']['output'];
  mspId: Scalars['String']['output'];
  signCert: Scalars['String']['output'];
  tlsCert: Scalars['String']['output'];
};

export type OrdererImportInput = {
  mspId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  region: Scalars['String']['input'];
  signCert: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
  tlsCert: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type Org = {
  __typename?: 'Org';
  id: Scalars['String']['output'];
  mspId: Scalars['String']['output'];
  signCACert: Scalars['String']['output'];
  tlsCACert: Scalars['String']['output'];
};

export type OrgImportInput = {
  mspId: Scalars['String']['input'];
  signCACert: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
  tlsCACert: Scalars['String']['input'];
};

export type Peer = {
  __typename?: 'Peer';
  id: Scalars['String']['output'];
  mspId: Scalars['String']['output'];
  signCert: Scalars['String']['output'];
  tlsCert: Scalars['String']['output'];
};

export type PeerImportInput = {
  mspId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  region: Scalars['String']['input'];
  signCert: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
  tlsCert: Scalars['String']['input'];
  url: Scalars['String']['input'];
};

export type ProposeChaincodeInput = {
  chaincodeName: Scalars['String']['input'];
  channelName: Scalars['String']['input'];
  codeZipHash: Scalars['String']['input'];
  endorsementPolicy: Scalars['String']['input'];
  mspId: Scalars['String']['input'];
  pdc: Scalars['JSON']['input'];
  sequence: Scalars['Float']['input'];
  tenantSlug: Scalars['String']['input'];
  version: Scalars['String']['input'];
};

export type ProposeChannelInput = {
  consenters: Array<NodeOrg>;
  mspId: Scalars['String']['input'];
  name: Scalars['String']['input'];
  ordererOrgs: Array<Scalars['String']['input']>;
  peerOrgs: Array<Scalars['String']['input']>;
  tenantSlug: Scalars['String']['input'];
};

export type Query = {
  __typename?: 'Query';
  auditLogs: Array<AuditLog>;
  chaincodeProposal: ChaincodeProposal;
  channelProposal: ChannelProposal;
  channelProposals: Array<ChannelProposal>;
  org: Org;
  orgs: Array<Org>;
};


export type QueryAuditLogsArgs = {
  tenantSlug: Scalars['String']['input'];
};


export type QueryChaincodeProposalArgs = {
  proposalSlug: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
};


export type QueryChannelProposalArgs = {
  proposalSlug: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
};


export type QueryChannelProposalsArgs = {
  tenantSlug: Scalars['String']['input'];
};


export type QueryOrgArgs = {
  orgId: Scalars['String']['input'];
  tenantSlug: Scalars['String']['input'];
};


export type QueryOrgsArgs = {
  tenantSlug: Scalars['String']['input'];
};

export type SetAnchorPeersInput = {
  anchorPeers: Array<HostPort>;
  channelB64: Scalars['String']['input'];
  channelName: Scalars['String']['input'];
  mspId: Scalars['String']['input'];
};

export type SetAnchorPeersResponse = {
  __typename?: 'SetAnchorPeersResponse';
  noChanges: Scalars['Boolean']['output'];
  updateB64: Scalars['String']['output'];
};

export type ApproveChaincodeProposalMutationVariables = Exact<{
  input: ApproveChaincodeProposalInput;
}>;


export type ApproveChaincodeProposalMutation = { __typename?: 'Mutation', approveChaincodeProposal: { __typename?: 'ChaincodeProposalApproval', id: string, proposalId: string, approvedAt: any } };

export type ApproveChannelProposalMutationVariables = Exact<{
  input: ApproveProposalInput;
}>;


export type ApproveChannelProposalMutation = { __typename?: 'Mutation', approveChannelProposal: { __typename?: 'ChannelProposalApproval', id: string, proposalId: string, approvedAt: any } };

export type CommitChaincodeProposalMutationVariables = Exact<{
  input: CommitChaincodeProposalInput;
}>;


export type CommitChaincodeProposalMutation = { __typename?: 'Mutation', commitChaincodeProposal: { __typename?: 'ChaincodeProposal', id: string, channelName: string, chaincodeName: string, version: string, endorsementPolicy: string, pdc: any, codeZipHash: string } };

export type CreateAuditMutationVariables = Exact<{
  input: CreateAuditLogInput;
}>;


export type CreateAuditMutation = { __typename?: 'Mutation', createAuditLog: { __typename?: 'AuditLog', id: string, tenantId: string, userId: string, logType: AuditLogType, details: any, createdAt: any } };

export type GetChaincodeProposalQueryVariables = Exact<{
  tenantSlug: Scalars['String']['input'];
  proposalSlug: Scalars['String']['input'];
}>;


export type GetChaincodeProposalQuery = { __typename?: 'Query', proposal: { __typename?: 'ChaincodeProposal', id: string, channelName: string, chaincodeName: string, version: string, sequence: number, endorsementPolicy: string, pdc: any, codeZipHash: string } };

export type GetChannelProposalQueryVariables = Exact<{
  tenantSlug: Scalars['String']['input'];
  proposalSlug: Scalars['String']['input'];
}>;


export type GetChannelProposalQuery = { __typename?: 'Query', proposal: { __typename?: 'ChannelProposal', id: string, channelName: string, channelData: { __typename?: 'ChannelProposalData', peerOrgs: Array<string>, ordererOrgs: Array<string>, channelTx: string, channelConfig: any } } };

export type OrgsQueryVariables = Exact<{
  tenantSlug: Scalars['String']['input'];
}>;


export type OrgsQuery = { __typename?: 'Query', orgs: Array<{ __typename?: 'Org', id: string, mspId: string, signCACert: string, tlsCACert: string }> };

export type ImportOrdererMutationVariables = Exact<{
  input: OrdererImportInput;
}>;


export type ImportOrdererMutation = { __typename?: 'Mutation', importOrderer: { __typename?: 'Orderer', id: string, mspId: string, signCert: string, tlsCert: string } };

export type ImportOrgMutationVariables = Exact<{
  input: OrgImportInput;
}>;


export type ImportOrgMutation = { __typename?: 'Mutation', importOrg: { __typename?: 'Org', id: string, mspId: string, signCACert: string, tlsCACert: string } };

export type ImportPeerMutationVariables = Exact<{
  input: PeerImportInput;
}>;


export type ImportPeerMutation = { __typename?: 'Mutation', importPeer: { __typename?: 'Peer', id: string, mspId: string, signCert: string, tlsCert: string } };

export type ProposeChaincodeCreationMutationVariables = Exact<{
  input: ProposeChaincodeInput;
}>;


export type ProposeChaincodeCreationMutation = { __typename?: 'Mutation', proposeChaincode: { __typename?: 'ChaincodeProposal', id: string, channelName: string, chaincodeName: string, version: string, endorsementPolicy: string, pdc: any, codeZipHash: string } };

export type ProposeChannelCreationMutationVariables = Exact<{
  input: ProposeChannelInput;
}>;


export type ProposeChannelCreationMutation = { __typename?: 'Mutation', proposeChannelCreation: { __typename?: 'ChannelProposal', id: string, channelName: string, channelData: { __typename?: 'ChannelProposalData', peerOrgs: Array<string>, ordererOrgs: Array<string>, channelTx: string, channelConfig: any } } };

export type UpdateConfigWithAnchorPeersMutationVariables = Exact<{
  input: SetAnchorPeersInput;
}>;


export type UpdateConfigWithAnchorPeersMutation = { __typename?: 'Mutation', updateConfigWithAnchorPeers: { __typename?: 'SetAnchorPeersResponse', updateB64: string, noChanges: boolean } };

export class TypedDocumentString<TResult, TVariables>
  extends String
  implements DocumentTypeDecoration<TResult, TVariables>
{
  __apiType?: DocumentTypeDecoration<TResult, TVariables>['__apiType'];

  constructor(private value: string, public __meta__?: Record<string, any>) {
    super(value);
  }

  toString(): string & DocumentTypeDecoration<TResult, TVariables> {
    return this.value;
  }
}

export const ApproveChaincodeProposalDocument = new TypedDocumentString(`
    mutation ApproveChaincodeProposal($input: ApproveChaincodeProposalInput!) {
  approveChaincodeProposal(input: $input) {
    id
    proposalId
    approvedAt
  }
}
    `) as unknown as TypedDocumentString<ApproveChaincodeProposalMutation, ApproveChaincodeProposalMutationVariables>;
export const ApproveChannelProposalDocument = new TypedDocumentString(`
    mutation ApproveChannelProposal($input: ApproveProposalInput!) {
  approveChannelProposal(input: $input) {
    id
    proposalId
    approvedAt
  }
}
    `) as unknown as TypedDocumentString<ApproveChannelProposalMutation, ApproveChannelProposalMutationVariables>;
export const CommitChaincodeProposalDocument = new TypedDocumentString(`
    mutation commitChaincodeProposal($input: CommitChaincodeProposalInput!) {
  commitChaincodeProposal(input: $input) {
    id
    channelName
    chaincodeName
    version
    endorsementPolicy
    pdc
    codeZipHash
  }
}
    `) as unknown as TypedDocumentString<CommitChaincodeProposalMutation, CommitChaincodeProposalMutationVariables>;
export const CreateAuditDocument = new TypedDocumentString(`
    mutation createAudit($input: CreateAuditLogInput!) {
  createAuditLog(input: $input) {
    id
    tenantId
    userId
    logType
    details
    createdAt
  }
}
    `) as unknown as TypedDocumentString<CreateAuditMutation, CreateAuditMutationVariables>;
export const GetChaincodeProposalDocument = new TypedDocumentString(`
    query GetChaincodeProposal($tenantSlug: String!, $proposalSlug: String!) {
  proposal: chaincodeProposal(
    proposalSlug: $proposalSlug
    tenantSlug: $tenantSlug
  ) {
    id
    channelName
    chaincodeName
    version
    sequence
    endorsementPolicy
    pdc
    codeZipHash
  }
}
    `) as unknown as TypedDocumentString<GetChaincodeProposalQuery, GetChaincodeProposalQueryVariables>;
export const GetChannelProposalDocument = new TypedDocumentString(`
    query GetChannelProposal($tenantSlug: String!, $proposalSlug: String!) {
  proposal: channelProposal(proposalSlug: $proposalSlug, tenantSlug: $tenantSlug) {
    id
    channelName
    channelData {
      peerOrgs
      ordererOrgs
      channelTx
      channelConfig
    }
  }
}
    `) as unknown as TypedDocumentString<GetChannelProposalQuery, GetChannelProposalQueryVariables>;
export const OrgsDocument = new TypedDocumentString(`
    query orgs($tenantSlug: String!) {
  orgs(tenantSlug: $tenantSlug) {
    id
    mspId
    signCACert
    tlsCACert
  }
}
    `) as unknown as TypedDocumentString<OrgsQuery, OrgsQueryVariables>;
export const ImportOrdererDocument = new TypedDocumentString(`
    mutation importOrderer($input: OrdererImportInput!) {
  importOrderer(input: $input) {
    id
    mspId
    signCert
    tlsCert
  }
}
    `) as unknown as TypedDocumentString<ImportOrdererMutation, ImportOrdererMutationVariables>;
export const ImportOrgDocument = new TypedDocumentString(`
    mutation importOrg($input: OrgImportInput!) {
  importOrg(input: $input) {
    id
    mspId
    signCACert
    tlsCACert
  }
}
    `) as unknown as TypedDocumentString<ImportOrgMutation, ImportOrgMutationVariables>;
export const ImportPeerDocument = new TypedDocumentString(`
    mutation importPeer($input: PeerImportInput!) {
  importPeer(input: $input) {
    id
    mspId
    signCert
    tlsCert
  }
}
    `) as unknown as TypedDocumentString<ImportPeerMutation, ImportPeerMutationVariables>;
export const ProposeChaincodeCreationDocument = new TypedDocumentString(`
    mutation ProposeChaincodeCreation($input: ProposeChaincodeInput!) {
  proposeChaincode(input: $input) {
    id
    channelName
    chaincodeName
    version
    endorsementPolicy
    pdc
    codeZipHash
  }
}
    `) as unknown as TypedDocumentString<ProposeChaincodeCreationMutation, ProposeChaincodeCreationMutationVariables>;
export const ProposeChannelCreationDocument = new TypedDocumentString(`
    mutation ProposeChannelCreation($input: ProposeChannelInput!) {
  proposeChannelCreation(input: $input) {
    id
    channelName
    channelData {
      peerOrgs
      ordererOrgs
      channelTx
      channelConfig
    }
  }
}
    `) as unknown as TypedDocumentString<ProposeChannelCreationMutation, ProposeChannelCreationMutationVariables>;
export const UpdateConfigWithAnchorPeersDocument = new TypedDocumentString(`
    mutation UpdateConfigWithAnchorPeers($input: SetAnchorPeersInput!) {
  updateConfigWithAnchorPeers(input: $input) {
    updateB64
    noChanges
  }
}
    `) as unknown as TypedDocumentString<UpdateConfigWithAnchorPeersMutation, UpdateConfigWithAnchorPeersMutationVariables>;