import { LocalOrg, LocalPeer } from '@repo/hlf-node'
import chalk from 'chalk'
import ora from 'ora'
import slugify from 'slugify'
import { Arg, Command, CommandClass, Flag } from '../cli-decorators'
import { execute } from '../graphql/client/execute'
import { ImportPeerDocument } from '../graphql/client/graphql'
import { registry } from '../registry/registry'
import { storage } from '../storage'
import { DEFAULT_TENANT_NAME } from '../constants'
import fs from 'fs'
import { readFile } from 'fs/promises'

@CommandClass({
	name: 'peer',
})
export class PeerCommands {
	@Command({
		name: 'stop',
		description: 'Stop a peer node',
	})
	async stop(
		@Arg({ name: 'name', description: 'Name of the peer to stop' })
		peerName: string,
		@Flag({ name: 'mspId', alias: 'm', description: 'MSP to stop the peer for', type: 'string', required: true })
		flags: { mspId: string }
	): Promise<void> {
		const peerId = slugify(peerName)
		const stoppingPeerSpinner = ora(`Stopping peer ${peerId}`).start()
		const peers = await registry.getPeerConfigs(flags.mspId)
		if (!peers.length) {
			stoppingPeerSpinner.fail(`No peers found for MSP ${flags.mspId}`)
			return
		}
		const peerConfig = peers.find((peer) => peer.peerName === peerId)
		if (!peerConfig) {
			stoppingPeerSpinner.fail(`Peer ${peerId} not found`)
			return
		}
		const peer = new LocalPeer(
			flags.mspId,
			{
				id: peerId,
				externalEndpoint: peerConfig.externalEndpoint,
				listenAddress: peerConfig.listenAddress,
				chaincodeAddress: peerConfig.chaincodeAddress,
				eventsAddress: peerConfig.eventsAddress,
				operationsListenAddress: peerConfig.operationsListenAddress,
				domainNames: [],
			},
			new LocalOrg(flags.mspId),
			peerConfig.mode
		)
		await peer.stop()
		stoppingPeerSpinner.fail(`Peer ${peerId} stopped`)
	}

	@Command({
		name: 'create',
		description: 'Create a new peer node',
	})
	async create(
		@Arg({ name: 'name', description: 'Name of the peer to create' })
		peerName: string,
		@Flag({ name: 'mspId', alias: 'm', description: 'MSP to create the peer for', type: 'string', required: true })
		@Flag({ name: 'type', alias: 't', description: 'Type of peer to create', type: 'string', required: false })
		// add flags for external endpoint, listen address, chaincode address, events address, operations listen address
		@Flag({ name: 'externalEndpoint', alias: 'e', description: 'External endpoint for the peer, example: 0.0.0.0:7051', type: 'string', required: true })
		@Flag({ name: 'listenAddress', alias: 'l', description: 'Listen address for the peer, example: 0.0.0.0:7051', type: 'string', required: true })
		@Flag({ name: 'chaincodeAddress', alias: 'c', description: 'Chaincode address for the peer, example: 0.0.0.0:7052', type: 'string', required: true })
		@Flag({ name: 'eventsAddress', alias: 'v', description: 'Events address for the peer, example: 0.0.0.0:7053', type: 'string', required: true })
		@Flag({ name: 'operationsListenAddress', alias: 'o', description: 'Operations listen address for the peer, example: 0.0.0.0:7054', type: 'string', required: true })
		@Flag({ name: 'region', alias: 'r', description: 'Region for the peer', type: 'string', required: true })
		@Flag({ name: 'mode', alias: 'm', description: 'Mode for the peer', type: 'string', required: true })
		@Flag({ name: 'tenant', alias: 't', description: 'Tenant for the peer', type: 'string', required: false })
		// optional array of hosts
		// optional array of ipAddresses
		@Flag({ name: 'hosts', alias: 'h', description: 'Hosts for the peer', type: 'string[]', required: false })
		flags: {
			tenant: string
			mspId: string
			externalEndpoint: string
			listenAddress: string
			type?: 'platform' | 'local'
			mode: 'cmd' | 'service' | 'docker'
			chaincodeAddress: string
			region: string
			eventsAddress: string
			operationsListenAddress: string
			hosts?: string[]
		}
	): Promise<void> {
		const peerId = slugify(peerName)
		const initSpinner = ora(`Initializing peer ${peerId}`).start()
		if (!flags.type) {
			flags.type = 'platform'
		}
		if (flags.type === 'platform') {
			if (!(await storage.checkIfLoggedIn())) {
				initSpinner.fail('Please login first')
				return
			}
		}
		if (flags.mode !== 'cmd' && flags.mode !== 'service' && flags.mode !== 'docker') {
			initSpinner.fail(chalk.red(`Invalid mode ${flags.mode}`))
			return
		}

		const localOrg = new LocalOrg(flags.mspId)
		try {
			await localOrg.getCAConfig()
		} catch (e) {
			initSpinner.fail(chalk.red(`Org ${flags.mspId} does not exist`))
			return
		}
		const peer = new LocalPeer(
			flags.mspId,
			{
				id: peerId,
				externalEndpoint: flags.externalEndpoint,
				listenAddress: flags.listenAddress,
				chaincodeAddress: flags.chaincodeAddress,
				eventsAddress: flags.eventsAddress,
				operationsListenAddress: flags.operationsListenAddress,
				domainNames: flags.hosts,
			},
			localOrg,
			flags.mode
		)
		const peerConfig = await peer.init()
		initSpinner.succeed(`Initialized peer ${peerId}`)
		if (flags.type === 'platform') {
			let tenantSlug = flags.tenant
			if (!tenantSlug) {
				tenantSlug = DEFAULT_TENANT_NAME
			}
			const registerSpinner = ora(`Registering peer ${peerId}`).start()
			const res = await execute(ImportPeerDocument, {
				input: {
					mspId: flags.mspId,
					name: peerId,
					signCert: peerConfig.signCert,
					tenantSlug,
					tlsCert: peerConfig.tlsCert,
					url: flags.externalEndpoint,
					region: flags.region,
				},
			})
			if (res.errors && res.errors.length > 0) {
				registerSpinner.fail(res.errors[0].message)
				return
			} else {
				registerSpinner.succeed(`Registered peer ${peerId}`)
			}
		}
		await registry.storePeerConfig(flags.mspId, peerConfig)
		const startingPeerSpinner = ora(`Starting peer ${peerId}`).start()
		if (flags.mode === 'cmd' && (await registry.isNodeLocked(flags.mspId, peerConfig.peerName, 'peer'))) {
			startingPeerSpinner.fail(`Peer ${peerId} is already running`)
			return
		}
		const response = await peer.start()
		switch (response.mode) {
			case 'cmd':
				await registry.lockNode(flags.mspId, peerConfig.peerName, 'peer', response.subprocess.pid)
				startingPeerSpinner.succeed(`Started peer ${peerId}`)
				break
			case 'service':
				startingPeerSpinner.succeed(`Started peer using service name ${response.serviceName}`)
				break
			case 'docker':
				startingPeerSpinner.succeed(`Started peer using docker container id ${response.containerName}`)
				break
			default:
				break
		}
	}

	@Command({
		name: 'register',
		description: 'Register a peer node in a consortium',
	})
	async register(
		@Arg({ name: 'name', description: 'Name of the peer to register' })
		peerName: string,
		@Flag({ name: 'mspId', alias: 'm', description: 'MSP to register the peer for', type: 'string', required: true })
		@Flag({ name: 'region', alias: 'r', description: 'Region for the peer', type: 'string', required: true })
		flags: { mspId: string; region: string }
	): Promise<void> {
		const peerId = slugify(peerName)
		const registerSpinner = ora(`Registering peer ${peerId}`).start()
		const peers = await registry.getPeerConfigs(flags.mspId)
		if (!peers.length) {
			registerSpinner.fail(`No peers found for MSP ${flags.mspId}`)
			return
		}
		const peerConfig = peers.find((peer) => peer.peerName === peerId)
		if (!peerConfig) {
			registerSpinner.fail(`Peer ${peerId} not found`)
			return
		}
		const res = await execute(ImportPeerDocument, {
			input: {
				mspId: flags.mspId,
				name: peerId,
				signCert: peerConfig.signCert,
				tenantSlug: DEFAULT_TENANT_NAME,
				tlsCert: peerConfig.tlsCert,
				url: peerConfig.externalEndpoint,
				region: flags.region,
			},
		})
		if (res.errors && res.errors.length > 0) {
			registerSpinner.fail(res.errors[0].message)
			return
		} else {
			registerSpinner.succeed(`Registered peer ${peerId}`)
		}
	}

	@Command({
		name: 'renewcert',
		description: 'Renew the certificate of a peer node',
	})
	async renewCert(
		@Arg({ name: 'name', description: 'Name of the peer to renew certificate for' })
		peerName: string,
		@Flag({ name: 'mspId', alias: 'm', description: 'MSP of the peer', type: 'string', required: true })
		flags: { mspId: string }
	): Promise<void> {
		const peerId = slugify(peerName)
		const renewSpinner = ora(`Renewing certificate for peer ${peerId}`).start()

		try {
			const peers = await registry.getPeerConfigs(flags.mspId)
			if (!peers.length) {
				throw new Error(`No peers found for MSP ${flags.mspId}`)
			}
			const peerConfig = peers.find((peer) => peer.peerName === peerId)
			if (!peerConfig) {
				throw new Error(`Peer ${peerId} not found`)
			}

			const localOrg = new LocalOrg(flags.mspId)
			const peer = new LocalPeer(
				flags.mspId,
				{
					id: peerId,
					externalEndpoint: peerConfig.externalEndpoint,
					listenAddress: peerConfig.listenAddress,
					chaincodeAddress: peerConfig.chaincodeAddress,
					eventsAddress: peerConfig.eventsAddress,
					operationsListenAddress: peerConfig.operationsListenAddress,
					domainNames: [],
				},
				localOrg,
				peerConfig.mode
			)
			await peer.renewCertificates()
			renewSpinner.succeed(`Certificate renewed for peer ${peerId}`)
		} catch (error) {
			renewSpinner.fail(`Failed to renew certificate for peer ${peerId}: ${(error as Error).message}`)
		}
	}

	@Command({
		name: 'join',
		description: 'Join a peer to a channel',
	})
	async joinChannel(
		@Arg({ name: 'name', description: 'Name of the peer to join the channel' })
		peerName: string,
		@Flag({ name: 'mspId', alias: 'm', description: 'MSP ID of the peer', type: 'string', required: true })
		@Flag({ name: 'channelName', alias: 'c', description: 'Name of the channel to join', type: 'string', required: true })
		@Flag({ name: 'ordererUrl', alias: 'o', description: 'URL of the orderer to fetch the genesis block', type: 'string', required: true })
		@Flag({ name: 'ordererTLSCert', alias: 't', description: 'Path to the orderer TLS certificate', type: 'string', required: true })
		flags: { mspId: string; channelName: string; ordererUrl: string; ordererTLSCert: string }
	): Promise<void> {
		const peerId = slugify(peerName)
		const joinSpinner = ora(`Joining peer ${peerId} to channel ${flags.channelName}`).start()

		try {
			const peers = await registry.getPeerConfigs(flags.mspId)
			if (!peers.length) {
				throw new Error(`No peers found for MSP ${flags.mspId}`)
			}
			const peerConfig = peers.find((peer) => peer.peerName === peerId)
			if (!peerConfig) {
				throw new Error(`Peer ${peerId} not found`)
			}

			const localOrg = new LocalOrg(flags.mspId)
			const peer = new LocalPeer(
				flags.mspId,
				{
					id: peerId,
					externalEndpoint: peerConfig.externalEndpoint,
					listenAddress: peerConfig.listenAddress,
					chaincodeAddress: peerConfig.chaincodeAddress,
					eventsAddress: peerConfig.eventsAddress,
					operationsListenAddress: peerConfig.operationsListenAddress,
					domainNames: [],
				},
				localOrg,
				peerConfig.mode
			)

			const ordererTLSCert = await readFile(flags.ordererTLSCert, 'utf8')

			await peer.joinChannel({
				channelName: flags.channelName,
				ordererUrl: flags.ordererUrl,
				ordererTLSCert,
			})

			joinSpinner.succeed(`Peer ${peerId} successfully joined channel ${flags.channelName}`)
		} catch (error) {
			joinSpinner.fail(`Failed to join peer ${peerId} to channel ${flags.channelName}: ${(error as Error).message}`)
		}
	}
}
