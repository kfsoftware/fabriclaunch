import { loadEnvConfig } from '@next/env'
import { sql, type InferSelectModel } from 'drizzle-orm'
import { boolean, customType, decimal, index, integer, jsonb, pgTable, primaryKey, text, timestamp, unique } from 'drizzle-orm/pg-core'
import { PostgresJsDatabase, drizzle } from 'drizzle-orm/postgres-js'
import { AdapterAccountType } from 'next-auth/adapters'
import postgres from 'postgres'

import { relations } from 'drizzle-orm'
import { pgEnum, uuid, varchar } from 'drizzle-orm/pg-core'


const dev = process.env.NODE_ENV !== 'production'
loadEnvConfig('./', dev)

let db: PostgresJsDatabase
// declare global {
// 	// eslint-disable-next-line no-var -- only var works here
// 	var db: PostgresJsDatabase | undefined
// }
let conn: postgres.Sql
// problem with too many connections
if (process.env.NODE_ENV === 'production') {
	conn = postgres(process.env.POSTGRES_URL!)
	db = drizzle(conn)
} else {
	if (!global.db) {
		conn = postgres(process.env.POSTGRES_URL!)
		global.db = drizzle(conn)
	}

	db = global.db
}

export { conn, db }

export const customJsonb = <TData>(name: string) =>
	customType<{ data: TData; driverData: TData }>({
		dataType() {
			return 'jsonb'
		},
		toDriver(val: TData) {
			return sql`(((${JSON.stringify(val)})::jsonb)#>> '{}')::jsonb`
		},
		fromDriver(value): TData {
			return value as TData
		},
	})(name)
export const usersTable = pgTable("user", {
	id: text("id")
		.primaryKey()
		.$defaultFn(() => crypto.randomUUID()),
	name: text("name"),
	login: text("login"),
	email: text("email").notNull(),
	password: varchar("password", { length: 255 }),
	emailVerified: timestamp("emailVerified", { mode: "date" }),
	image: text("image"),
	// wallet integration
	address: text("address"),
	signature: text("signature"),
	nonce: text("nonce"),
	stripeAccountId: text("stripeAccountId"),
	stripeCustomerId: text("stripeCustomerId"),
	// installation id for github
	githubInstallationId: integer("github_installation_id"),
	githubInstallationState: text("github_installation_state"), // installed, removed, not_installed
	githubInstallationData: jsonb("github_installation_data"),
	githubRequireUpdate: boolean("github_require_update").default(false),

	score: integer("score").default(0).notNull(), // Add score field
	ranking: integer("ranking").default(0).notNull(), // Add ranking field
})
export type UserDB = InferSelectModel<typeof usersTable>
export const accountsTable = pgTable(
	"account",
	{
		userId: text("userId")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),

		type: text("type").$type<AdapterAccountType>().notNull(),
		provider: text("provider").notNull(),
		providerAccountId: text("providerAccountId").notNull(),
		refresh_token: text("refresh_token"),
		access_token: text("access_token"),
		expires_at: integer("expires_at"),
		refresh_token_expires_at: integer("refresh_token_expires_at"),
		token_type: text("token_type"),
		scope: text("scope"),
		id_token: text("id_token"),
		session_state: text("session_state"),
	},
	(table) => {
		return {
			compositePk: primaryKey({
				columns: [table.provider, table.providerAccountId],
			}),
		}
	}
)
export type AccountDB = InferSelectModel<typeof accountsTable>

export const sessionsTable = pgTable("session", {
	sessionToken: text("sessionToken").primaryKey(),
	userId: text("userId")
		.notNull()
		.references(() => usersTable.id, { onDelete: "cascade" }),
	expires: timestamp("expires", { mode: "date" }).notNull(),
})

export type SessionDB = InferSelectModel<typeof sessionsTable>
export const authenticatorsTable = pgTable(
	"authenticator",
	{
		credentialID: text("credentialID").notNull().unique(),
		userId: text("userId")
			.notNull()
			.references(() => usersTable.id, { onDelete: "cascade" }),
		providerAccountId: text("providerAccountId").notNull(),
		credentialPublicKey: text("credentialPublicKey").notNull(),
		counter: integer("counter").notNull(),
		credentialDeviceType: text("credentialDeviceType").notNull(),
		credentialBackedUp: boolean("credentialBackedUp").notNull(),
		transports: text("transports"),
	},
	(authenticator) => ({
		compositePK: primaryKey({
			columns: [authenticator.userId, authenticator.credentialID],
		}),
	})
)
export type AuthenticatorDB = InferSelectModel<typeof authenticatorsTable>

export const verificationTokensTable = pgTable(
	"verificationToken",
	{
		identifier: text("identifier").notNull(),
		token: text("token").notNull(),
		expires: timestamp("expires", { mode: "date" }).notNull(),
	},
	(table) => {
		return {
			compositePk: primaryKey({ columns: [table.identifier, table.token] }),
		}
	}
)
export type VerificationTokenDB = InferSelectModel<typeof verificationTokensTable>


// Enums
export const updateTypeEnum = pgEnum('update_type', ['CHANNEL', 'CHAINCODE']);
export const statusEnum = pgEnum('status', ['PROPOSED', 'APPROVED', 'COMMITTED', 'REJECTED', 'IMPLEMENTED']);
export const ruleTypeEnum = pgEnum('rule_type', ['CHANNEL', 'CHAINCODE']);

// Create tenant
export const tenantsTable = pgTable('tenant', {
	id: uuid('id').primaryKey().defaultRandom(),
	name: varchar('name', { length: 255 }).notNull(),
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	creatorId: text('creator_id').notNull().references(() => usersTable.id),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
})
export type TenantDB = InferSelectModel<typeof tenantsTable>


export const userTenantTable = pgTable('user_tenant', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull().references(() => usersTable.id),
	tenantId: uuid('tenant_id').notNull().references(() => tenantsTable.id),
	role: varchar('role', { length: 20 }).notNull(), // e.g., 'ADMIN', 'MEMBER', etc.
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
	uniqueUserTenant: unique().on(table.userId, table.tenantId),
}))

export type UserTenantDB = InferSelectModel<typeof userTenantTable>


// 4. Organization Table
export const organizationsTable = pgTable('organization', {
	id: uuid('id').primaryKey().defaultRandom(),
	tenantId: uuid('tenant_id').references(() => tenantsTable.id).notNull(),
	orgName: varchar('org_name', { length: 255 }).notNull(),
	mspId: varchar('msp_id', { length: 255 }).notNull(),
	signCACert: text('sign_cert').notNull(),
	tlsCACert: text('tls_cert').notNull(),
	description: text('description'),
	createdAt: timestamp('createdAt').notNull().defaultNow(),
	updatedAt: timestamp('updatedAt').notNull().defaultNow(),
}, t => ({
	tenant_id_msp_id: unique('idx_tenant_id_msp_id').on(t.tenantId, t.mspId),
}));

export type OrganizationDB = InferSelectModel<typeof organizationsTable>
export const invitationStatusEnum = pgEnum('invitation_status', ['PENDING', 'ACCEPTED', 'EXPIRED'])

export const organizationInvitationsTable = pgTable('organization_invitation', {
	id: uuid('id').primaryKey().defaultRandom(),
	tenantId: uuid('tenant_id').references(() => tenantsTable.id).notNull(),
	email: varchar('email', { length: 255 }).notNull(),
	orgName: varchar('org_name', { length: 255 }),
	mspId: varchar('msp_id', { length: 255 }),
	invitedBy: text('invited_by').references(() => usersTable.id).notNull(),
	acceptedBy: text('accepted_by').references(() => usersTable.id),
	token: varchar('token', { length: 255 }).notNull().unique(),
	expiresAt: timestamp('expires_at').notNull(),
	status: invitationStatusEnum('status').default('PENDING'),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
}, t => ({
	tenant_id_email: unique('idx_tenant_id_email').on(t.tenantId, t.email),
}));

export type OrganizationInvitationDB = InferSelectModel<typeof organizationInvitationsTable>

// Create the user_organization table
export const userOrganizationTable = pgTable('user_organization', {
	id: uuid('id').primaryKey().defaultRandom(),
	userId: text('user_id').notNull().references(() => usersTable.id),
	organizationId: uuid('organization_id').notNull().references(() => organizationsTable.id),
	role: text('role').notNull(), // e.g., 'ADMIN', 'MEMBER', etc.
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
	uniqueUserOrg: unique().on(table.userId, table.organizationId),
}));
export type UserOrganizationDB = InferSelectModel<typeof userOrganizationTable>;

export interface ChannelProposalData {
	// peer org ids
	peerOrgs: string[];
	// orderer org ids
	ordererOrgs: string[];
	// channel tx in base64
	channelTx: string;
	// channel config in JSON
	channelConfig: any
}
export const channelProposalTable = pgTable('channel_proposal', {
	id: uuid('id').primaryKey().defaultRandom(),
	slug: varchar('slug', { length: 255 }).notNull().unique(),
	tenantId: uuid('tenant_id').references(() => tenantsTable.id).notNull(),
	channelName: varchar('channel_name', { length: 255 }).notNull(),
	proposedByOrgId: uuid('proposed_by_org').references(() => organizationsTable.id),
	isNew: boolean('is_new').default(true),
	status: statusEnum('status').notNull(),
	data: customJsonb<ChannelProposalData>('data').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
})
export type ChannelProposalDB = InferSelectModel<typeof channelProposalTable>

// table to store signatures and approvals 
export const channelProposalApprovalTable = pgTable('channel_proposal_approval', {
	id: uuid('id').primaryKey().defaultRandom(),
	proposalId: uuid('proposal_id').references(() => channelProposalTable.id).notNull(),
	organizationId: uuid('organization_id').references(() => organizationsTable.id).notNull(),
	userId: text('user_id').references(() => usersTable.id).notNull(),
	signature: text('signature').notNull(),
	certificate: text('certificate').notNull(),
	approvedAt: timestamp('approved_at').defaultNow(),
}, t => ({
	proposal_id_org_id: unique('idx_proposal_id_org_id').on(t.proposalId, t.organizationId),
}))

export type ChannelProposalApprovalDB = InferSelectModel<typeof channelProposalApprovalTable>
export const chaincodeProposalTable = pgTable('chaincode_proposal', {
	id: uuid('id').primaryKey().defaultRandom(),
	slug: varchar('slug', { length: 255 }).unique().notNull().unique(),
	tenantId: uuid('tenant_id').references(() => tenantsTable.id).notNull(),
	proposedByOrgId: uuid('proposed_by_org').references(() => organizationsTable.id),
	channelName: varchar('channel_name', { length: 255 }).notNull(),
	chaincodeName: varchar('chaincode_name', { length: 255 }).notNull(),
	codeZipHash: varchar('code_hash', { length: 255 }).notNull(),
	endorsementPolicy: varchar('endorsement_policy', { length: 255 }).notNull(),
	version: varchar('version', { length: 255 }).notNull(),
	sequence: integer('sequence').default(1).notNull(),
	pdc: customJsonb<any>('pdc_data').notNull(),
	status: statusEnum('status').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
})

export type ChaincodeProposalDB = InferSelectModel<typeof chaincodeProposalTable>

// chaincode proposal approval table
export const chaincodeProposalApprovalTable = pgTable('chaincode_proposal_approval', {
	id: uuid('id').primaryKey().defaultRandom(),
	proposalId: uuid('proposal_id').references(() => chaincodeProposalTable.id).notNull(),
	organizationId: uuid('organization_id').references(() => organizationsTable.id).notNull(),
	userId: text('user_id').references(() => usersTable.id).notNull(),
	signature: text('signature').notNull(),
	certificate: text('certificate').notNull(),
	approvedAt: timestamp('approved_at').defaultNow(),
}, t => ({
	chaincode_proposal_id_org_id: unique('idx_chaincode_proposal_id_org_id').on(t.proposalId, t.organizationId),
}))

export type ChaincodeProposalApprovalDB = InferSelectModel<typeof chaincodeProposalApprovalTable>


export const nodeTypeEnum = pgEnum('node_type', ['PEER', 'ORDERER']);

// New table: Node (represents both peers and orderers)
export const nodesTable = pgTable('node', {
	id: uuid('id').primaryKey().defaultRandom(),
	tenantId: uuid('tenant_id').references(() => tenantsTable.id).notNull(),
	orgId: uuid('org_id').references(() => organizationsTable.id),
	name: varchar('name', { length: 255 }).notNull(),
	region: varchar('region', { length: 255 }),
	// define lat and long as float
	latitude: decimal('latitude'),
	longitude: decimal('longitude'),
	type: nodeTypeEnum('type').notNull(),
	url: varchar('url', { length: 255 }).notNull(),
	tlsCert: text('tls_cert').notNull(),
	signCert: text('sign_cert').notNull(),
	isActive: boolean('is_active').default(true),
	createdAt: timestamp('created_at').defaultNow(),
	updatedAt: timestamp('updated_at').defaultNow(),
}, t => ({
	org_id_name: unique('idx_org_id_name').on(t.orgId, t.name),

}));

export type NodeDB = InferSelectModel<typeof nodesTable>


export const userRequestLogin = pgTable('user_request_login', {
	id: uuid('id').primaryKey().default(sql`gen_random_uuid()`),
	code: text('code').notNull(),
	userId: text('user_id').references(() => usersTable.id),
	status: text('status').notNull().default('pending'),
	redirectUri: text('redirect_uri').notNull(),
	token: text('token'),
	expiresAt: timestamp('expires_at'),
	createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, (table) => {
	return {
		userIdIdx: index('idx_user_tokens_user_id').on(table.userId),
		redirectUriIdx: index('idx_user_tokens_redirect_uri').on(table.redirectUri),
	}
});

export type UserRequestLoginDB = InferSelectModel<typeof userRequestLogin>



// Enum for audit log types
export const auditLogTypeEnum = pgEnum('audit_log_type', [
	'PEER_CREATED',
	'ORDERER_CREATED',
	'CHANNEL_PROPOSED',
	'CHANNEL_APPROVED',
	'CHANNEL_READY',
	'ORDERER_JOINED',
	'PEER_JOINED',
	'CHAINCODE_PROPOSED',
	'CHAINCODE_APPROVED',
	'CHAINCODE_COMMITTED',
	'TENANT_CREATED'
]);


// Typed interfaces for each event type
export interface PeerCreatedDetails {
	peerName: string;
	mspId: string
	nodeId: string;
}

export interface OrdererCreatedDetails {
	ordererName: string;
	mspId: string;
	nodeId: string;
}

export interface ChannelProposedDetails {
	channelName: string;
	proposalId: string;
	proposedBy: string;
}
export interface ChannelApprovedDetails {
	channelName: string;
	approvedBy: string;
	proposalId: string;
}

export interface ChannelReadyDetails {
	channelName: string;
}


export interface OrdererJoinedDetails {
	orderers: string[];
	channelName: string;
}

export interface PeerJoinedDetails {
	peers: string[];
	channelName: string;
	mspId: string;
}

export interface ChaincodeProposedDetails {
	chaincodeName: string;
	channelName: string;
	sequence: number;
	version: string;
	proposalId: string;
	proposedBy: string;
	endorsementPolicy: string
	pdc: string
	codeZipHash: string
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
	sequence: number
	endorsementPolicy: string
	proposalId: string
	pdc: string
	codeZipHash: string
}

export interface TenantCreatedDetails {
	tenantId: string;
	tenantName: string;
}

// Union type for all possible detail types
type AuditLogDetails =
	| PeerCreatedDetails
	| OrdererCreatedDetails
	| ChannelProposedDetails
	| ChannelApprovedDetails
	| ChannelReadyDetails
	| OrdererJoinedDetails
	| PeerJoinedDetails
	| ChaincodeProposedDetails
	| ChaincodeApprovedDetails
	| ChaincodeCommittedDetails
	| TenantCreatedDetails;

// Audit Log Table
export const auditLogTable = pgTable('audit_log', {
	id: uuid('id').primaryKey().defaultRandom(),
	tenantId: uuid('tenant_id').references(() => tenantsTable.id).notNull(),
	orgId: uuid('org_id').references(() => organizationsTable.id),
	userId: text('user_id').references(() => usersTable.id).notNull(),
	logType: auditLogTypeEnum('log_type').notNull(),
	details: customJsonb<AuditLogDetails>('details').notNull(),
	createdAt: timestamp('created_at').defaultNow(),
});

export type AuditLogDB = InferSelectModel<typeof auditLogTable>;

// Description dictionary for audit log types
export const auditLogTypeDescriptions: Record<typeof auditLogTypeEnum.enumValues[number], string> = {
	PEER_CREATED: "A new peer node was created in the network",
	ORDERER_CREATED: "A new orderer node was created in the network",
	CHANNEL_PROPOSED: "A new channel was proposed for creation",
	CHANNEL_APPROVED: "A channel proposal was approved",
	CHANNEL_READY: "A channel was created and is ready for use",
	ORDERER_JOINED: "An orderer joined a channel (consensus created)",
	PEER_JOINED: "A peer joined a channel",
	CHAINCODE_PROPOSED: "A new chaincode was proposed for deployment",
	CHAINCODE_APPROVED: "A chaincode was approved by an organization",
	CHAINCODE_COMMITTED: "A chaincode was committed to the channel",
	TENANT_CREATED: "A new consortium was created"
};
