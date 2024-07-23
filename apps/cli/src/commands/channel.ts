import { LocalOrg, type CAConfig } from "@repo/hlf-node";
import { $, ShellError } from "bun";
import chalk from "chalk";
import fs from "fs/promises";
import ora from "ora";
import os from "os";
import path from "path";
import slugify from "slugify";
import { Arg, Command, CommandClass, Flag } from "../cli-decorators";
import { DEFAULT_TENANT_NAME } from "../constants";
import { execute } from "../graphql/client/execute";
import { ApproveChannelProposalDocument, AuditLogType, GetChannelProposalDocument, ProposeChannelCreationDocument, UpdateConfigWithAnchorPeersDocument, type NodeOrg } from "../graphql/client/graphql";
import { registry } from "../registry/registry";
import { storage } from "../storage";
import { createAuditLog } from "../utils/audit";
import { discoverChannelConfig } from "../utils/channel";
import { createTempDir, createTempFileSync } from "../utils/file";
@CommandClass({
	name: 'channel'
})
export class ChannelCommands {
	// propose
	@Command({
		name: 'propose',
		description: 'Propose a new channel',
	})
	async propose(
		@Arg({ name: 'name', description: 'Name of the channel to propose' })
		channelName: string,
		@Flag({ name: 'peerOrgs', description: 'Peer orgs to add to the channel', type: 'string', required: true })
		@Flag({ name: 'ordererOrgs', description: 'Orderer orgs to add to the channel', type: 'string', required: true })
		@Flag({ name: 'consenters', description: 'Consenter nodes for the ordering service', type: 'string', required: true })
		@Flag({ name: 'mspId', description: 'MSP to create the orderer for', type: 'string', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: {
			peerOrgs: string
			ordererOrgs: string
			consenters: string
			mspId: string
			tenant?: string
		},
	) {
		const createProposalSpinner = ora('Creating proposal').start()
		if (!await storage.checkIfLoggedIn()) {
			createProposalSpinner.fail('Please login first')
			return
		}
		const peerOrgs = flags.peerOrgs.split(',').map(org => org.trim())
		const ordererOrgs = flags.ordererOrgs.split(',').map(org => org.trim())
		const consenterList = flags.consenters.split(',').map(org => org.trim())
		const consenters = consenterList.map(consenter => {
			const [mspId, name] = consenter.split('.')
			return {
				mspId,
				name
			} as NodeOrg
		})
		const res = await execute(ProposeChannelCreationDocument, {
			input: {
				mspId: flags.mspId,
				consenters,
				name: channelName,
				tenantSlug: flags.tenant || DEFAULT_TENANT_NAME,
				ordererOrgs,
				peerOrgs
			}
		})
		if (res.errors) {
			createProposalSpinner.fail(res.errors[0].message)
			return
		}
		const propId = res.data?.proposeChannelCreation.id!
		createProposalSpinner.succeed(`Proposal ${propId} created`)
	}
	// accept
	// bun run ./src/index.ts channel accept <prop_id>  -o Org1MSP
	@Command({
		name: 'accept',
		description: 'Accept a proposed channel',
	})
	async accept(
		@Arg({ name: 'id', description: 'Id of the channel to accept' })
		proposalId: string,
		@Flag({ name: 'org', alias: 'o', description: 'Organization to accept the channel', type: 'string', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: { org: string, tenant?: string }
	) {
		const acceptProposalSpinner = ora('Accepting proposal').start()
		if (!await storage.checkIfLoggedIn()) {
			console.log(chalk.red('Please login first'))
			return
		}
		const localOrg = new LocalOrg(flags.org)
		try {
			await localOrg.getCAConfig()
		} catch (e) {
			console.log(chalk.red(`Org ${flags.org} does not exist`))
		}
		const resProposal = await execute(GetChannelProposalDocument, {
			proposalSlug: proposalId,
			tenantSlug: flags.tenant || DEFAULT_TENANT_NAME
		})
		if (resProposal.errors) {
			acceptProposalSpinner.fail(resProposal.errors[0].message)
			return
		}
		const { proposal } = resProposal.data!
		const { signature, cert } = await localOrg.signDataAsAdmin(
			Buffer.from(proposal.channelData.channelTx, 'base64')
		)
		const res = await execute(ApproveChannelProposalDocument, {
			input: {
				mspId: flags.org,
				proposalId,
				cert: cert,
				signature: signature,
				tenantSlug: flags.tenant || DEFAULT_TENANT_NAME
			}
		})
		if (res.errors) {
			acceptProposalSpinner.fail(res.errors[0].message)
			return
		}

		acceptProposalSpinner.succeed(`Proposal ${proposalId} accepted`)
	}
	// join
	// bun run ./src/index.ts channel join <prop_id>  -o OrdererMSP -n orderer0 -n orderer1 -n orderer2
	@Command({
		name: 'join',
		description: 'Join nodes to a proposed channel',
	})
	async join(
		@Arg({ name: 'id', description: 'Id of the channel to join' })
		proposalId: string,
		@Flag({ name: 'org', alias: 'o', description: 'Organization to accept the channel', type: 'string', required: true })
		@Flag({ name: 'peers', alias: 'p', description: 'Peers to join the channel', type: 'string[]', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: {
			org: string
			peers: string[]
			tenant?: string
		}
	) {
		const gettingDataSpinner = ora('Getting data').start()
		if (!await storage.checkIfLoggedIn()) {
			gettingDataSpinner.fail('Please login first')
			return
		}
		const tenantSlug = flags.tenant || DEFAULT_TENANT_NAME
		const localOrg = new LocalOrg(flags.org)
		let caConfig: CAConfig
		try {
			caConfig = await localOrg.getCAConfig()
		} catch (e) {
			gettingDataSpinner.fail(`Org ${flags.org} does not exist`)
			return
		}
		const resProposal = await execute(GetChannelProposalDocument, {
			proposalSlug: proposalId,
			tenantSlug,
		})
		if (resProposal.errors) {
			gettingDataSpinner.fail(resProposal.errors[0].message)
			return
		}
		const { proposal } = resProposal.data!
		const peers = await registry.getPeerConfigs(flags.org)
		if (peers.length === 0) {
			gettingDataSpinner.fail('No peers found')
			return
		}
		gettingDataSpinner.succeed('Data fetched')
		// get local nodes of the org and join them
		const adminCert = await localOrg.getAdminCert()
		const { path: configBlockTmp } = createTempFileSync()
		await fs.writeFile(configBlockTmp, Buffer.from(proposal.channelData.channelTx, "base64"))

		const { path: tlsCACertPath } = createTempFileSync()
		await fs.writeFile(tlsCACertPath, caConfig.tlsCACert)
		const adminMSPPath = await createTempDir()
		// create and ensure parent folder exist
		// cacerts/cacert.pem
		await fs.mkdir(`${adminMSPPath.name}/cacerts`, { recursive: true })
		await fs.writeFile(`${adminMSPPath.name}/cacerts/cacert.pem`, adminCert.caCert)
		// keystore/priv_sk
		await fs.mkdir(`${adminMSPPath.name}/keystore`, { recursive: true })
		await fs.writeFile(`${adminMSPPath.name}/keystore/priv_sk`, adminCert.pk)
		// signcerts/admin.pem
		await fs.mkdir(`${adminMSPPath.name}/signcerts`, { recursive: true })
		await fs.writeFile(`${adminMSPPath.name}/signcerts/admin.pem`, adminCert.cert)
		// tlscacerts/tlsca.pem
		await fs.mkdir(`${adminMSPPath.name}/tlscacerts`, { recursive: true })
		await fs.writeFile(`${adminMSPPath.name}/tlscacerts/tlsca.pem`, caConfig.tlsCACert)
		// config.yaml
		const configYamlContents = `
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: orderer

`

		await fs.writeFile(`${adminMSPPath.name}/config.yaml`, configYamlContents)

		for (const peer of peers) {
			const joinPeerSpinner = ora(`Joining peer ${peer.peerName} to the channel`).start()

			const slugifiedId = slugify(peer.peerName);
			const homeDir = os.homedir();
			// specific path for peerId
			const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`);
			const mspConfigPath = path.join(dirPath, 'config');
			// const peerConfigPath = ''
			const peerAddress = peer.externalEndpoint
			const envVariables = {
				"FABRIC_CFG_PATH": `${mspConfigPath}`,
				"CORE_PEER_ADDRESS": `${peerAddress}`,
				"CORE_PEER_LOCALMSPID": `${flags.org}`,
				"CORE_PEER_TLS_ENABLED": `true`,
				"FABRIC_LOGGING_SPEC": "fatal",
				"CORE_PEER_MSPCONFIGPATH": `${adminMSPPath.name}`,
				"CORE_PEER_TLS_ROOTCERT_FILE": `${tlsCACertPath}`,
				"CORE_PEER_CLIENT_CONNTIMEOUT": `15s`,
				"CORE_PEER_DELIVERYCLIENT_CONNTIMEOUT": `15s`,
			}
			try {
				const res = await $`peer channel join --blockpath=${configBlockTmp}`.env(envVariables).quiet()
				if (res.exitCode !== 0) {
					joinPeerSpinner.fail(res.stderr.toString("utf-8"))
					continue
				}
				joinPeerSpinner.succeed(`Peer ${peer.peerName} joined to the channel ${proposal.channelName}`)
			} catch (e) {
				const bunError = e as ShellError
				joinPeerSpinner.fail(`Failed to join ${peer.peerName} to the channel ${proposal.channelName}: ${bunError.stderr.toString("utf-8")}`)
			}

		}
		const firstPeer = peers[0]
		const firstPeerAddress = firstPeer.externalEndpoint
		const fetchinChannelSpinner = ora(`Fetching channel ${proposal.channelName}`).start()
		const channelConfig = await discoverChannelConfig(localOrg, proposal.channelName, firstPeerAddress)
		const firstOrdererMSPID = Object.keys(channelConfig.orderers)[0]
		const orderer = channelConfig.orderers[firstOrdererMSPID]
		// commit chaincode proposal
		const firstOrdererOrg = channelConfig.msps[firstOrdererMSPID]

		const firstEndpoint = orderer.endpoint[0]
		const ordererUrl = `${firstEndpoint.host}:${firstEndpoint.port}`
		const { path: caFilePem } = createTempFileSync()
		const ordererTlsCaCert = firstOrdererOrg.tls_root_certs![0]
		if (!ordererTlsCaCert) {
			fetchinChannelSpinner.fail(`Orderer ${firstOrdererMSPID} does not have a tls root cert`)
			return
		}
		await fs.writeFile(caFilePem, Buffer.from(ordererTlsCaCert, "base64"))
		// add anchor peers

		const slugifiedId = slugify(firstPeer.peerName);
		const homeDir = os.homedir();
		// specific path for peerId
		const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`);
		const mspConfigPath = path.join(dirPath, 'config');
		// const peerConfigPath = ''
		const peerAddress = firstPeer.externalEndpoint
		const envVariables = {
			"FABRIC_CFG_PATH": `${mspConfigPath}`,
			"CORE_PEER_ADDRESS": `${peerAddress}`,
			"CORE_PEER_LOCALMSPID": `${flags.org}`,
			"CORE_PEER_TLS_ENABLED": `true`,
			"FABRIC_LOGGING_SPEC": "fatal",
			"CORE_PEER_MSPCONFIGPATH": `${adminMSPPath.name}`,
			"CORE_PEER_TLS_ROOTCERT_FILE": `${tlsCACertPath}`,
			"CORE_PEER_CLIENT_CONNTIMEOUT": `15s`,
			"CORE_PEER_DELIVERYCLIENT_CONNTIMEOUT": `15s`,
		}
		const { path: configBlockFileTmp } = createTempFileSync()
		try {
			const res = await $`peer channel fetch config -o ${ordererUrl} -c ${proposal.channelName} --tls --cafile ${caFilePem} ${configBlockFileTmp}`.env(envVariables).quiet()
			if (res.exitCode !== 0) {
				fetchinChannelSpinner.fail(res.stderr.toString("utf-8"))
				return
			}
			fetchinChannelSpinner.succeed(`Fetched channel ${proposal.channelName} to ${configBlockFileTmp}`)
		} catch (e) {
			const bunError = e as ShellError
			fetchinChannelSpinner.fail(`Failed to fetch channel ${proposal.channelName}: ${bunError.stderr.toString("utf-8")}`)
		}
		const anchorPeerSpinner = ora(`Adding anchor peers`).start()
		const anchorPeers = peers.map(peer => ({
			host: peer.externalEndpoint.split(':')[0],
			port: parseInt(peer.externalEndpoint.split(':')[1])
		}))
		const b64ConfigBlock = await fs.readFile(configBlockFileTmp, 'base64')
		const updateConfigRes = await execute(UpdateConfigWithAnchorPeersDocument, {
			input: {
				anchorPeers,
				channelB64: b64ConfigBlock,
				channelName: proposal.channelName,
				mspId: flags.org
			}
		})
		if (updateConfigRes.errors && updateConfigRes.errors.length > 0) {
			anchorPeerSpinner.fail(updateConfigRes.errors[0].message)
			return
		}
		if (updateConfigRes.data?.updateConfigWithAnchorPeers.noChanges) {
			anchorPeerSpinner.succeed(`Anchor peers already set`)
			return
		}
		// save b64 file to tmp file
		const { path: updateConfigEnvelopeTmp } = createTempFileSync()
		await fs.writeFile(updateConfigEnvelopeTmp, Buffer.from(updateConfigRes.data!.updateConfigWithAnchorPeers.updateB64, 'base64'))

		try {
			const signConfigTx = await $`peer channel signconfigtx -f ${updateConfigEnvelopeTmp}`.env(envVariables).quiet()
			if (signConfigTx.exitCode !== 0) {
				fetchinChannelSpinner.fail(`Failed to sign the update block: ${signConfigTx.stderr.toString("utf-8")}`)
				return
			}
			const updateConfigTx = await $`peer channel update -f ${updateConfigEnvelopeTmp} -c ${proposal.channelName} -o ${ordererUrl} --tls --cafile ${caFilePem}`.env(envVariables).quiet()
			if (updateConfigTx.exitCode !== 0) {
				fetchinChannelSpinner.fail(`Failed to update the channel: ${updateConfigTx.stderr.toString("utf-8")}`)
				return
			}
			anchorPeerSpinner.succeed(`Added anchor peers`)
		} catch (e) {
			const bunError = e as ShellError
			fetchinChannelSpinner.fail(`Failed to fetch channel ${proposal.channelName}: ${bunError.stderr.toString("utf-8")}`)
		}
		await createAuditLog(tenantSlug, flags.org, AuditLogType.PeerJoined, {
			channelName: proposal.channelName,
			peers: flags.peers,
		})
		process.exit(0)
	}
}
