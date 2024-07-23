/* eslint-disable */
import * as types from './graphql';



/**
 * Map of all GraphQL operations in the project.
 *
 * This map has several performance disadvantages:
 * 1. It is not tree-shakeable, so it will include all operations in the project.
 * 2. It is not minifiable, so the string of a GraphQL query will be multiple times inside the bundle.
 * 3. It does not support dead code elimination, so it will add unused operations.
 *
 * Therefore it is highly recommended to use the babel or swc plugin for production.
 */
const documents = {
    "mutation ApproveChaincodeProposal($input: ApproveChaincodeProposalInput!) {\n  approveChaincodeProposal(input: $input) {\n    id\n    proposalId\n    approvedAt\n  }\n}": types.ApproveChaincodeProposalDocument,
    "mutation ApproveChannelProposal($input: ApproveProposalInput!) {\n  approveChannelProposal(input: $input) {\n    id\n    proposalId\n    approvedAt\n  }\n}": types.ApproveChannelProposalDocument,
    "mutation commitChaincodeProposal($input: CommitChaincodeProposalInput!) {\n  commitChaincodeProposal(input: $input) {\n    id\n    channelName\n    chaincodeName\n    version\n    endorsementPolicy\n    pdc\n    codeZipHash\n  }\n}": types.CommitChaincodeProposalDocument,
    "mutation createAudit($input: CreateAuditLogInput!) {\n  createAuditLog(input: $input) {\n    id\n    tenantId\n    userId\n    logType\n    details\n    createdAt\n  }\n}": types.CreateAuditDocument,
    "query GetChaincodeProposal($tenantSlug: String!, $proposalSlug: String!) {\n  proposal: chaincodeProposal(\n    proposalSlug: $proposalSlug\n    tenantSlug: $tenantSlug\n  ) {\n    id\n    channelName\n    chaincodeName\n    version\n    sequence\n    endorsementPolicy\n    pdc\n    codeZipHash\n  }\n}": types.GetChaincodeProposalDocument,
    "query GetChannelProposal($tenantSlug: String!, $proposalSlug: String!) {\n  proposal: channelProposal(proposalSlug: $proposalSlug, tenantSlug: $tenantSlug) {\n    id\n    channelName\n    channelData {\n      peerOrgs\n      ordererOrgs\n      channelTx\n      channelConfig\n    }\n  }\n}": types.GetChannelProposalDocument,
    "query orgs($tenantSlug: String!) {\n  orgs(tenantSlug: $tenantSlug) {\n    id\n    mspId\n    signCACert\n    tlsCACert\n  }\n}": types.OrgsDocument,
    "mutation importOrderer($input: OrdererImportInput!) {\n  importOrderer(input: $input) {\n    id\n    mspId\n    signCert\n    tlsCert\n  }\n}": types.ImportOrdererDocument,
    "mutation importOrg($input: OrgImportInput!) {\n  importOrg(input: $input) {\n    id\n    mspId\n    signCACert\n    tlsCACert\n  }\n}": types.ImportOrgDocument,
    "mutation importPeer($input: PeerImportInput!) {\n  importPeer(input: $input) {\n    id\n    mspId\n    signCert\n    tlsCert\n  }\n}": types.ImportPeerDocument,
    "mutation ProposeChaincodeCreation($input: ProposeChaincodeInput!) {\n  proposeChaincode(input: $input) {\n    id\n    channelName\n    chaincodeName\n    version\n    endorsementPolicy\n    pdc\n    codeZipHash\n  }\n}": types.ProposeChaincodeCreationDocument,
    "mutation ProposeChannelCreation($input: ProposeChannelInput!) {\n  proposeChannelCreation(input: $input) {\n    id\n    channelName\n    channelData {\n      peerOrgs\n      ordererOrgs\n      channelTx\n      channelConfig\n    }\n  }\n}": types.ProposeChannelCreationDocument,
    "mutation UpdateConfigWithAnchorPeers($input: SetAnchorPeersInput!) {\n  updateConfigWithAnchorPeers(input: $input) {\n    updateB64\n    noChanges\n  }\n}": types.UpdateConfigWithAnchorPeersDocument,
};

/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ApproveChaincodeProposal($input: ApproveChaincodeProposalInput!) {\n  approveChaincodeProposal(input: $input) {\n    id\n    proposalId\n    approvedAt\n  }\n}"): typeof import('./graphql').ApproveChaincodeProposalDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ApproveChannelProposal($input: ApproveProposalInput!) {\n  approveChannelProposal(input: $input) {\n    id\n    proposalId\n    approvedAt\n  }\n}"): typeof import('./graphql').ApproveChannelProposalDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation commitChaincodeProposal($input: CommitChaincodeProposalInput!) {\n  commitChaincodeProposal(input: $input) {\n    id\n    channelName\n    chaincodeName\n    version\n    endorsementPolicy\n    pdc\n    codeZipHash\n  }\n}"): typeof import('./graphql').CommitChaincodeProposalDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation createAudit($input: CreateAuditLogInput!) {\n  createAuditLog(input: $input) {\n    id\n    tenantId\n    userId\n    logType\n    details\n    createdAt\n  }\n}"): typeof import('./graphql').CreateAuditDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetChaincodeProposal($tenantSlug: String!, $proposalSlug: String!) {\n  proposal: chaincodeProposal(\n    proposalSlug: $proposalSlug\n    tenantSlug: $tenantSlug\n  ) {\n    id\n    channelName\n    chaincodeName\n    version\n    sequence\n    endorsementPolicy\n    pdc\n    codeZipHash\n  }\n}"): typeof import('./graphql').GetChaincodeProposalDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query GetChannelProposal($tenantSlug: String!, $proposalSlug: String!) {\n  proposal: channelProposal(proposalSlug: $proposalSlug, tenantSlug: $tenantSlug) {\n    id\n    channelName\n    channelData {\n      peerOrgs\n      ordererOrgs\n      channelTx\n      channelConfig\n    }\n  }\n}"): typeof import('./graphql').GetChannelProposalDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "query orgs($tenantSlug: String!) {\n  orgs(tenantSlug: $tenantSlug) {\n    id\n    mspId\n    signCACert\n    tlsCACert\n  }\n}"): typeof import('./graphql').OrgsDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation importOrderer($input: OrdererImportInput!) {\n  importOrderer(input: $input) {\n    id\n    mspId\n    signCert\n    tlsCert\n  }\n}"): typeof import('./graphql').ImportOrdererDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation importOrg($input: OrgImportInput!) {\n  importOrg(input: $input) {\n    id\n    mspId\n    signCACert\n    tlsCACert\n  }\n}"): typeof import('./graphql').ImportOrgDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation importPeer($input: PeerImportInput!) {\n  importPeer(input: $input) {\n    id\n    mspId\n    signCert\n    tlsCert\n  }\n}"): typeof import('./graphql').ImportPeerDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ProposeChaincodeCreation($input: ProposeChaincodeInput!) {\n  proposeChaincode(input: $input) {\n    id\n    channelName\n    chaincodeName\n    version\n    endorsementPolicy\n    pdc\n    codeZipHash\n  }\n}"): typeof import('./graphql').ProposeChaincodeCreationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation ProposeChannelCreation($input: ProposeChannelInput!) {\n  proposeChannelCreation(input: $input) {\n    id\n    channelName\n    channelData {\n      peerOrgs\n      ordererOrgs\n      channelTx\n      channelConfig\n    }\n  }\n}"): typeof import('./graphql').ProposeChannelCreationDocument;
/**
 * The graphql function is used to parse GraphQL queries into a document that can be used by GraphQL clients.
 */
export function graphql(source: "mutation UpdateConfigWithAnchorPeers($input: SetAnchorPeersInput!) {\n  updateConfigWithAnchorPeers(input: $input) {\n    updateB64\n    noChanges\n  }\n}"): typeof import('./graphql').UpdateConfigWithAnchorPeersDocument;


export function graphql(source: string) {
  return (documents as any)[source] ?? {};
}
