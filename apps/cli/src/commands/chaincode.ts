import { GatewayError, connect } from '@hyperledger/fabric-gateway'
import { LocalChaincode, LocalOrg, type CAConfig } from '@repo/hlf-node'
import AdmZip from 'adm-zip'
import { $, ShellError } from 'bun'
import chalk from 'chalk'
import { execSync } from 'child_process'
import { createWriteStream, writeFileSync } from 'fs'
import fs from 'fs/promises'
import fetch from 'node-fetch'
import ora from 'ora'
import os from 'os'
import path from 'path'
import slugify from 'slugify'
import { Arg, Command, CommandClass, Flag } from '../cli-decorators'
import { API_URL, DEFAULT_TENANT_NAME } from '../constants'
import { execute } from '../graphql/client/execute'
import { ApproveChaincodeProposalDocument, CommitChaincodeProposalDocument, GetChaincodeProposalDocument, ProposeChaincodeCreationDocument } from '../graphql/client/graphql'
import { registry } from '../registry/registry'
import { storage } from '../storage'
import { computeFileHash, streamToBlob } from '../utils'
import { generateChaincodePackage } from '../utils/chaincode'
import { discoverChannelConfig, discoverPeersConfig, getOnePeerPerOrg } from '../utils/channel'
import { createTempDirSync, createTempFile, createTempFileSync } from '../utils/file'
import { newConnectOptions, newGrpcConnection } from '../utils/gateway'

const DEFAULT_VERSION = '1.0'

interface ChaincodeDef {
	sequence: number
	version: string
	endorsement_plugin: string
	validation_plugin: string
	validation_parameter: string
	collections: Record<string, never>
	source: {
		Type: {
			LocalPackage: {
				package_id: string
			}
		}
	}
}

@CommandClass({
	name: 'chaincode',
	description: 'Manage chaincode',
})
export class ChaincodeCommands {
	// propose
	// bun run ./src/index.ts chaincode propose fabcar --chaincodePath=$PWD/chaincode/fabcar --channel=channel1 \
	// --endorsementPolicy="OR('Org1MSP.member','Org2MSP.member')" \
	// --pdc="$PWD/pdc.json"
	@Command({
		name: 'propose',
		description: 'Propose a new chaincode',
	})
	async propose(
		@Arg({ name: 'name', description: 'Name of the chaincode to propose' })
		name: string,
		@Flag({ name: 'chaincodePath', description: 'Path to the chaincode', type: 'string', required: true })
		@Flag({ name: 'channel', description: 'Channel to deploy the chaincode to', type: 'string', required: true })
		@Flag({ name: 'endorsementPolicy', description: 'Endorsement policy for the chaincode', type: 'string', required: true })
		@Flag({ name: 'pdc', description: 'Private data collection configuration', type: 'string', required: false })
		@Flag({ name: 'sequence', description: 'Sequence of the chaincode', type: 'number', required: true })
		@Flag({ name: 'mspId', description: 'MSP to propose the chaincode for', type: 'string', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: {
			chaincodePath: string
			mspId: string
			channel: string
			sequence: number
			endorsementPolicy: string
			pdc?: string
			tenant?: string
		}
	) {
		let tenantSlug = flags.tenant
		if (!tenantSlug) {
			tenantSlug = DEFAULT_TENANT_NAME
		}
		const creatingChaincodeZipSpinner = ora('Creating chaincode zip').start()
		const zip = new AdmZip()
		await zip.addLocalFolderPromise(flags.chaincodePath, {
			filter: (filename) => {
				// exclude node_modules
				return !filename.includes('node_modules')
			},
		})
		const { path: tmpFile } = await createTempFile()
		creatingChaincodeZipSpinner.text = `Writing zip to ${tmpFile}`
		await zip.writeZipPromise(tmpFile)
		// chaincode code upload
		const fileBlob = await streamToBlob(Bun.file(tmpFile).stream())
		const form = new FormData()
		form.append('file', Bun.file(tmpFile))
		creatingChaincodeZipSpinner.text = 'Uploading chaincode zip'
		const fileResUpload = await fetch(`${API_URL}/file/upload`, {
			method: 'POST',
			body: form,
		})
		const resData = (await fileResUpload.json()) as
			| {
					status: 'fail'
					error: string
			  }
			| {
					fileName: string
					contentType: string
					status: 'success'
					id: string
					hash: string
					objectName: string
					thumbnailId: null
			  }
		if (resData.status === 'fail') {
			creatingChaincodeZipSpinner.fail(`Error uploading chaincode zip ${tmpFile}: ${resData.error}`)
			return
		}
		const zipHash = resData.hash
		creatingChaincodeZipSpinner.succeed(`Chaincode zip uploaded with hash ${zipHash}`)
		const proposingChaincodeSpinner = ora('Proposing chaincode').start()
		// create chaincode proposal with chaincodeZipHash, channel, endorsementPolicy, pdc
		const proposeChaincodeRes = await execute(ProposeChaincodeCreationDocument, {
			input: {
				chaincodeName: name,
				mspId: flags.mspId,
				channelName: flags.channel,
				codeZipHash: zipHash,
				endorsementPolicy: flags.endorsementPolicy,
				version: DEFAULT_VERSION,
				sequence: flags.sequence,
				tenantSlug,
				pdc: [],
			},
		})
		if (proposeChaincodeRes.errors && proposeChaincodeRes.errors.length > 0) {
			proposingChaincodeSpinner.fail(JSON.stringify(proposeChaincodeRes.errors, null, 2))
			return
		}
		const proposalId = proposeChaincodeRes.data?.proposeChaincode.id!
		proposingChaincodeSpinner.succeed(`Proposal ${proposalId} created`)
	}
	// accept
	// bun run ./src/index.ts chaincode accept <prop_id> -o Org1MSP
	@Command({
		name: 'accept',
		description: 'Accept a chaincode proposal',
	})
	async accept(
		@Arg({ name: 'proposalId', description: 'ID of the proposal to accept' })
		proposalId: string,
		@Flag({ name: 'org', alias: 'o', description: 'Org to accept the chaincode proposal', type: 'string', required: true })
		@Flag({ name: 'chaincodeAddress', description: 'Local chaincode address', type: 'string', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: { org: string; chaincodeAddress: string; tenant?: string }
	) {
		// get proposal
		const acceptProposalSpinner = ora('Accepting proposal').start()
		if (!(await storage.checkIfLoggedIn())) {
			console.log(chalk.red('Please login first'))
			return
		}
		let tenantSlug = flags.tenant
		if (!tenantSlug) {
			tenantSlug = DEFAULT_TENANT_NAME
		}
		const localOrg = new LocalOrg(flags.org)
		try {
			await localOrg.getCAConfig()
		} catch (e) {
			acceptProposalSpinner.fail(`Org ${flags.org} does not exist`)
			return
		}
		const resProposal = await execute(GetChaincodeProposalDocument, {
			proposalSlug: proposalId,
			tenantSlug,
		})
		if (resProposal.errors) {
			acceptProposalSpinner.fail(resProposal.errors[0].message)
			return
		}

		const { proposal } = resProposal.data!

		const chaincodePackageZipPath = await generateChaincodePackage({
			chaincodeLabel: proposal.chaincodeName,
			chaincodeName: proposal.chaincodeName,
			address: flags.chaincodeAddress,
		})
		const { signature, cert } = await localOrg.signDataAsAdmin(Buffer.from(proposal.id))
		const res = await execute(ApproveChaincodeProposalDocument, {
			input: {
				mspId: flags.org,
				proposalId,
				cert: cert,
				signature: signature,
				tenantSlug,
			},
		})
		if (res.errors) {
			acceptProposalSpinner.fail(res.errors[0].message)
			return
		}
		acceptProposalSpinner.succeed(`Proposal ${proposalId} accepted`)
		// build chaincode package
		const buildingChaincodeSpinner = ora('Building chaincode').start()
		const adminCert = await localOrg.getAdminCert()
		const peers = await registry.getPeerConfigs(flags.org)
		if (peers.length === 0) {
			buildingChaincodeSpinner.info('No peers found for the organization')
			return
		}
		const { path: tlsCACertPath } = await createTempFile()
		const peerToApprove = peers[0]
		await fs.writeFile(tlsCACertPath, peerToApprove.tlsCACert)
		const adminMSPPath = createTempDirSync()
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
		await fs.writeFile(`${adminMSPPath.name}/tlscacerts/tlsca.pem`, peerToApprove.tlsCACert)
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
		const chaincodePackageId = `${proposal.chaincodeName}:${await computeFileHash(chaincodePackageZipPath)}`
		buildingChaincodeSpinner.succeed(`Chaincode built, packageId: ${chaincodePackageId}`)

		// install chaincode in peers using peer lifecycle chaincode install
		for (const peer of peers) {
			const installChaincodeSpinner = ora(`Installing chaincode in peer ${peer.peerName}`).start()
			const slugifiedId = slugify(peer.peerName)
			const homeDir = os.homedir()
			// specific path for peerId
			const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`)
			const mspConfigPath = path.join(dirPath, 'config')
			// const peerConfigPath = ''
			const peerAddress = peer.externalEndpoint
			const envVariables = {
				FABRIC_CFG_PATH: `${mspConfigPath}`,
				CORE_PEER_ADDRESS: `${peerAddress}`,
				CORE_PEER_LOCALMSPID: `${flags.org}`,
				CORE_PEER_TLS_ENABLED: `true`,
				FABRIC_LOGGING_SPEC: 'error',
				CORE_PEER_MSPCONFIGPATH: `${adminMSPPath.name}`,
				CORE_PEER_TLS_ROOTCERT_FILE: `${tlsCACertPath}`,
				CORE_PEER_CLIENT_CONNTIMEOUT: `15s`,
				CORE_PEER_DELIVERYCLIENT_CONNTIMEOUT: `15s`,
			}
			try {
				const res = await $`peer lifecycle chaincode install ${chaincodePackageZipPath}`.env(envVariables)
				if (res.exitCode !== 0) {
					installChaincodeSpinner.fail(res.stderr.toString('utf-8'))
					continue
				}
				installChaincodeSpinner.succeed(`Chaincode installed in peer ${peer.peerName}`)
			} catch (e) {
				const bunError = e as ShellError
				console.log(bunError)
				installChaincodeSpinner.fail(`Error installing chaincode in peer ${peer.peerName}: ${bunError.stderr.toString('utf-8')}`)
			}
		}
		// approve chaincode proposal using peer lifecycle chaincode approveformyorg
		const approveChaincodeSpinner = ora('Approving chaincode').start()
		const peerAddress = peerToApprove.externalEndpoint
		const slugifiedId = slugify(peerToApprove.peerName)
		const homeDir = os.homedir()
		// specific path for peerId
		const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`)
		const mspConfigPath = path.join(dirPath, 'config')
		const envVariables = {
			FABRIC_CFG_PATH: `${mspConfigPath}`,
			CORE_PEER_ADDRESS: `${peerAddress}`,
			CORE_PEER_LOCALMSPID: `${flags.org}`,
			CORE_PEER_TLS_ENABLED: `true`,
			FABRIC_LOGGING_SPEC: 'error',
			CORE_PEER_MSPCONFIGPATH: `${adminMSPPath.name}`,
			CORE_PEER_TLS_ROOTCERT_FILE: `${tlsCACertPath}`,
			CORE_PEER_CLIENT_CONNTIMEOUT: `15s`,
			CORE_PEER_DELIVERYCLIENT_CONNTIMEOUT: `15s`,
		}

		// approve chaincode proposal
		// peer lifecycle chaincode approveformyorg  -o orderer.example.com:7050 --tls --cafile $ORDERER_CA --channelID mychannel --name mycc --version 1.0 --init-required --package-id myccv1:a7ca45a7cc85f1d89c905b775920361ed089a364e12a9b6d55ba75c965ddd6a9 --sequence 1 --signature-policy "AND ('Org1MSP.peer','Org2MSP.peer')"

		const channelConfig = await discoverChannelConfig(localOrg, proposal.channelName, peerAddress)
		const firstOrdererMSPID = Object.keys(channelConfig.orderers)[0]
		const orderer = channelConfig.orderers[firstOrdererMSPID]
		// commit chaincode proposal
		const firstOrdererOrg = channelConfig.msps[firstOrdererMSPID]

		const firstEndpoint = orderer.endpoint[0]
		const ordererUrl = `${firstEndpoint.host}:${firstEndpoint.port}`
		const { path: caFilePem } = await createTempFile()
		const ordererTlsCaCert = firstOrdererOrg.tls_root_certs![0]
		if (!ordererTlsCaCert) {
			approveChaincodeSpinner.fail(`Orderer ${firstOrdererMSPID} does not have a tls root cert`)
			return
		}
		await fs.writeFile(caFilePem, Buffer.from(ordererTlsCaCert, 'base64'))
		try {
			const approveResCommand =
				await $`peer lifecycle chaincode approveformyorg --orderer="${ordererUrl}"  --tls --cafile="${caFilePem}" --channelID ${proposal.channelName} --name ${proposal.chaincodeName} --version ${DEFAULT_VERSION} --package-id ${chaincodePackageId} --sequence ${proposal.sequence} --signature-policy "${proposal.endorsementPolicy}"`.env(
					envVariables
				)
			if (approveResCommand.exitCode !== 0) {
				approveChaincodeSpinner.fail(approveResCommand.stderr.toString('utf-8'))
				return
			}
			approveChaincodeSpinner.succeed(`Chaincode approved`)
		} catch (e) {
			const bunError = e as ShellError
			approveChaincodeSpinner.fail(`Error approving chaincode: ${bunError.stderr.toString('utf-8')}`)
		}
	}
	// bun run ./src/index.ts chaincode download <prop_id> --output=chaincodes
	@Command({
		name: 'download',
		description: 'Downloads the chaincode source',
	})
	async download(
		@Arg({ name: 'proposalSlug', description: 'ID of the proposal to download' })
		proposalSlug: string,
		@Flag({ name: 'output', alias: 'o', description: 'Output directory', type: 'string', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: {
			output: string
			tenant?: string
		}
	) {
		let tenantSlug = flags.tenant
		if (!tenantSlug) {
			tenantSlug = DEFAULT_TENANT_NAME
		}
		const downloadChaincodeSpinner = ora('Downloading chaincode').start()
		// get proposal
		const resProposal = await execute(GetChaincodeProposalDocument, {
			proposalSlug: proposalSlug,
			tenantSlug,
		})
		if (resProposal.errors) {
			downloadChaincodeSpinner.fail(resProposal.errors[0].message)
			return
		}

		const { proposal } = resProposal.data!

		const fileRes = await fetch(`${API_URL}/file/download/${proposal.codeZipHash}`, {})
		if (fileRes.status !== 200) {
			downloadChaincodeSpinner.fail(`Error downloading chaincode: ${fileRes.statusText}`)
			return
		}
		const { path: tmpFileZip } = await createTempFile()
		const fileStream = createWriteStream(tmpFileZip)

		await new Promise((resolve, reject) => {
			fileStream.on('finish', resolve)
			fileStream.on('error', reject)
			fileRes.body!.pipe(fileStream)
		})
		const zip = new AdmZip(tmpFileZip)

		const outputDir = path.join(flags.output, proposal.id.replace('prop_', ''))
		zip.extractAllTo(outputDir, true)
		downloadChaincodeSpinner.succeed(`Chaincode downloaded to ${outputDir}`)
	}
	// run
	// bun run ./src/index.ts chaincode run <prop_id> --chaincode=./chaincodes/fabcar
	@Command({
		name: 'run',
		description: 'Run the chaincode locally',
	})
	async run(
		@Arg({ name: 'proposalId', description: 'ID of the proposal to run' })
		proposalId: string,
		@Flag({ name: 'chaincode', description: 'Path to the chaincode', type: 'string', required: false })
		@Flag({ name: 'org', description: 'Org to run the chaincode', type: 'string', required: true })
		@Flag({ name: 'download', description: 'Download the chaincode source', type: 'boolean', required: false })
		@Flag({ name: 'chaincodeAddress', description: 'Local chaincode address', type: 'string', required: true })
		@Flag({ name: 'mode', description: 'Mode to run the chaincode', type: 'string', required: false })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: {
			chaincode: string
			org: string
			download: boolean
			chaincodeAddress: string
			mode: 'cmd' | 'service'
			tenant?: string
		}
	) {
		let tenantSlug = flags.tenant
		if (!tenantSlug) {
			tenantSlug = DEFAULT_TENANT_NAME
		}
		const runChaincodeSpinner = ora('Running chaincode').start()
		if (!(await storage.checkIfLoggedIn())) {
			runChaincodeSpinner.fail('Please login first')
			return
		}
		if (!flags.chaincode && !flags.download) {
			runChaincodeSpinner.fail('Please provide the chaincode path or download the chaincode')
			return
		}
		if (flags.mode !== 'cmd' && flags.mode !== 'service') {
			runChaincodeSpinner.fail('Please provide a valid mode: cmd or service')
			return
		}
		// get proposal
		const resProposal = await execute(GetChaincodeProposalDocument, {
			proposalSlug: proposalId,
			tenantSlug,
		})
		if (resProposal.errors) {
			runChaincodeSpinner.fail(resProposal.errors[0].message)
			return
		}
		const localOrg = new LocalOrg(flags.org)
		let caConfig: CAConfig
		try {
			caConfig = await localOrg.getCAConfig()
		} catch (e) {
			runChaincodeSpinner.fail(`Org ${flags.org} does not exist`)
			return
		}
		const { proposal } = resProposal.data!
		const peers = await registry.getPeerConfigs(flags.org)
		if (peers.length === 0) {
			runChaincodeSpinner.fail('No peers found for the organization')
			return
		}
		const peer = peers[0]
		const slugifiedId = slugify(peer.peerName)
		const homeDir = os.homedir()
		// specific path for peerId

		const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`)
		const mspConfigPath = path.join(dirPath, 'config')
		const peerAddress = peer.externalEndpoint
		// specific path for peerId
		const adminCert = await localOrg.getAdminCert()

		const { path: tlsCACertPath } = await createTempFile()
		await fs.writeFile(tlsCACertPath, caConfig.tlsCACert)
		const adminMSPPath = createTempDirSync()
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
		const envVariables = {
			FABRIC_CFG_PATH: `${mspConfigPath}`,
			CORE_PEER_ADDRESS: `${peerAddress}`,
			CORE_PEER_LOCALMSPID: `${flags.org}`,
			CORE_PEER_TLS_ENABLED: `true`,
			FABRIC_LOGGING_SPEC: 'error',
			CORE_PEER_MSPCONFIGPATH: `${adminMSPPath.name}`,
			CORE_PEER_TLS_ROOTCERT_FILE: `${tlsCACertPath}`,
			CORE_PEER_CLIENT_CONNTIMEOUT: `15s`,
			CORE_PEER_DELIVERYCLIENT_CONNTIMEOUT: `15s`,
		}

		const channelConfig = await discoverChannelConfig(localOrg, proposal.channelName, peerAddress)
		const firstOrdererMSPID = Object.keys(channelConfig.orderers)[0]
		const firstOrdererOrg = channelConfig.msps[firstOrdererMSPID]

		const { path: caFilePem } = await createTempFile()
		const ordererTlsCaCert = firstOrdererOrg.tls_root_certs![0]
		if (!ordererTlsCaCert) {
			runChaincodeSpinner.fail(`Orderer ${firstOrdererMSPID} does not have a tls root cert`)
			return
		}
		await fs.writeFile(caFilePem, Buffer.from(ordererTlsCaCert, 'base64'))
		let packageId: string = ''
		try {
			const queryApprovedRes = await $`peer lifecycle chaincode queryapproved -C ${proposal.channelName} -n ${proposal.chaincodeName} --sequence ${proposal.sequence} --output json`.env(
				envVariables
			)
			if (queryApprovedRes.exitCode !== 0) {
				runChaincodeSpinner.fail(queryApprovedRes.stderr.toString('utf-8'))
				return
			}
			const res = queryApprovedRes.json() as ChaincodeDef
			packageId = res.source.Type.LocalPackage.package_id
		} catch (e) {
			const bunError = e as ShellError
			runChaincodeSpinner.fail(`Error approving chaincode: ${bunError.stderr.toString('utf-8')}`)
			return
		}
		runChaincodeSpinner.succeed(`Chaincode ok: ${packageId}`)
		const envVariablesForRunning: NodeJS.ProcessEnv = {
			CHAINCODE_TLS_DISABLED: 'true',
			CHAINCODE_SERVER_ADDRESS: flags.chaincodeAddress,
			CHAINCODE_ID: packageId,
		}
		const shouldDownload = flags.download
		let chaincodePath = ''
		if (shouldDownload) {
			const cwd = process.cwd()
			const fileRes = await fetch(`${API_URL}/file/download/${proposal.codeZipHash}`, {})
			if (fileRes.status !== 200) {
				runChaincodeSpinner.fail(`Error downloading chaincode: ${fileRes.statusText}`)
				return
			}
			const { path: tmpFileZip } = await createTempFile()
			const fileStream = createWriteStream(tmpFileZip)
			await new Promise((resolve, reject) => {
				fileStream.on('finish', resolve)
				fileStream.on('error', reject)
				fileRes.body!.pipe(fileStream)
			})
			const zip = new AdmZip(tmpFileZip)
			chaincodePath = path.join(cwd, proposal.id.replace('prop_', ''))
			zip.extractAllTo(chaincodePath, true)
		} else {
			chaincodePath = flags.chaincode
		}
		if (!chaincodePath) {
			runChaincodeSpinner.fail(`Chaincode path not found`)
			return
		}
		const localChaincode = new LocalChaincode(
			{
				chaincodeAddress: flags.chaincodeAddress,
				chaincodeName: proposal.chaincodeName,
				chaincodePath,
				channelName: proposal.channelName,
				packageId,
				mspId: flags.org,
			},
			flags.mode
		)
		const response = await localChaincode.start()
		switch (response.mode) {
			case 'cmd':
				runChaincodeSpinner.succeed(`Started chaincode ${flags.chaincode}`)
				break
			case 'service':
				runChaincodeSpinner.succeed(`Started chaincode using service name ${response.serviceName}`)
				break
			default:
				break
		}
	}
	// commit
	// bun run ./src/index.ts chaincode commit <prop_id> -o Org1MSP
	@Command({
		name: 'commit',
		description: 'Commit a chaincode proposal',
	})
	async commit(
		@Arg({ name: 'proposalId', description: 'ID of the proposal to commit' })
		proposalId: string,
		@Flag({ name: 'org', alias: 'o', description: 'Org to commit the chaincode proposal', type: 'string', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: { org: string; tenant?: string }
	) {
		let tenantSlug = flags.tenant
		if (!tenantSlug) {
			tenantSlug = DEFAULT_TENANT_NAME
		}
		const commitChaincodeSpinner = ora('Committing chaincode').start()
		// get proposal
		const localOrg = new LocalOrg(flags.org)
		try {
			await localOrg.getCAConfig()
		} catch (e) {
			console.log(chalk.red(`Org ${flags.org} does not exist`))
		}
		const resProposal = await execute(GetChaincodeProposalDocument, {
			proposalSlug: proposalId,
			tenantSlug,
		})
		if (resProposal.errors) {
			commitChaincodeSpinner.fail(resProposal.errors[0].message)
			return
		}

		const { proposal } = resProposal.data!

		const adminCert = await localOrg.getAdminCert()
		const peers = await registry.getPeerConfigs(flags.org)
		if (peers.length === 0) {
			commitChaincodeSpinner.fail('No peers found for the organization')
			return
		}
		const { path: tlsCACertPath } = await createTempFile()
		const peerToCommit = peers[0]
		await fs.writeFile(tlsCACertPath, peerToCommit.tlsCACert)
		const adminMSPPath = createTempDirSync()
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
		await fs.writeFile(`${adminMSPPath.name}/tlscacerts/tlsca.pem`, peerToCommit.tlsCACert)
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
		// commit chaincode proposal using peer lifecycle chaincode commit
		const peerAddress = peerToCommit.externalEndpoint
		const slugifiedId = slugify(peerToCommit.peerName)
		const homeDir = os.homedir()
		// specific path for peerId
		const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`)
		const mspConfigPath = path.join(dirPath, 'config')
		const envVariables = {
			FABRIC_CFG_PATH: `${mspConfigPath}`,
			CORE_PEER_ADDRESS: `${peerAddress}`,
			CORE_PEER_LOCALMSPID: `${flags.org}`,
			CORE_PEER_TLS_ENABLED: `true`,
			FABRIC_LOGGING_SPEC: 'error',
			CORE_PEER_MSPCONFIGPATH: `${adminMSPPath.name}`,
			CORE_PEER_TLS_ROOTCERT_FILE: `${tlsCACertPath}`,
			CORE_PEER_CLIENT_CONNTIMEOUT: `15s`,
			CORE_PEER_DELIVERYCLIENT_CONNTIMEOUT: `15s`,
		}
		const channelConfig = await discoverChannelConfig(localOrg, proposal.channelName, peerAddress)
		const peersConfig = await discoverPeersConfig(localOrg, proposal.channelName, peerAddress)
		const allPeers = getOnePeerPerOrg(peersConfig)
		// enrich allPeers with the tls ca cert
		const allPeersWithTlsCaCert = allPeers.map((peerConfig) => {
			const mspConfig = channelConfig.msps[peerConfig.MSPID]
			const { path: tmpFileForTlsCaCert } = createTempFileSync()
			writeFileSync(tmpFileForTlsCaCert, Buffer.from(mspConfig.tls_root_certs![0], 'base64'))
			return {
				...peerConfig,
				tlsCaCert: mspConfig.tls_root_certs![0],
				tlsCaCertFile: tmpFileForTlsCaCert,
			}
		})
		// console.log("peersConfig", peersConfig)
		// get only one peer per org from peers config based on the msp id
		// implement the line before

		const firstOrdererMSPID = Object.keys(channelConfig.orderers)[0]
		const orderer = channelConfig.orderers[firstOrdererMSPID]
		// commit chaincode proposal
		const firstOrdererOrg = channelConfig.msps[firstOrdererMSPID]

		const firstEndpoint = orderer.endpoint[0]
		const ordererUrl = `${firstEndpoint.host}:${firstEndpoint.port}`
		const { path: caFilePem } = await createTempFile()
		const ordererTlsCaCert = firstOrdererOrg.tls_root_certs![0]
		if (!ordererTlsCaCert) {
			commitChaincodeSpinner.fail(`Orderer ${firstOrdererMSPID} does not have a tls root cert`)
			return
		}
		await fs.writeFile(caFilePem, Buffer.from(ordererTlsCaCert, 'base64'))
		try {
			const cmd = `peer lifecycle chaincode commit --orderer="${ordererUrl}"  --tls --cafile="${caFilePem}" --channelID ${proposal.channelName} --name ${proposal.chaincodeName} --version ${DEFAULT_VERSION} --sequence ${proposal.sequence} --signature-policy "${proposal.endorsementPolicy}" ${allPeersWithTlsCaCert.map((p) => ` --peerAddresses="${p.Endpoint}" --tlsRootCertFiles="${p.tlsCaCertFile}"`).join('  ')} `
			execSync(cmd, { env: envVariables, stdio: 'pipe' })
			commitChaincodeSpinner.succeed(`Chaincode comitted`)
		} catch (e) {
			const bunError = e as ShellError
			commitChaincodeSpinner.fail(`Error committing chaincode: ${bunError.stderr.toString('utf-8')}`)
			return
		}
		const commitRes = await execute(CommitChaincodeProposalDocument, {
			input: {
				mspId: flags.org,
				proposalId,
				tenantSlug,
			},
		})
		if (commitRes.errors && commitRes.errors.length > 0) {
			console.log(chalk.red(`Error upload committed status to platform: ${commitRes.errors[0].message}`))
		}
	}

	// bun run ./src/index.ts chaincode query -c mychannel -n mycc -c '{"Args":["query","a"]}'
	@Command({
		name: 'query',
		description: 'Query a chaincode',
	})
	async query(
		@Flag({ name: 'channel', alias: 'c', description: 'Channel to query the chaincode', type: 'string', required: true })
		@Flag({ name: 'name', alias: 'n', description: 'Name of the chaincode to query', type: 'string', required: true })
		@Flag({ name: 'org', description: 'Org to query the chaincode', type: 'string', required: true })
		@Flag({ name: 'call', description: 'Call arguments to the chaincode', type: 'string', required: true })
		flags: {
			channel: string
			name: string
			org: string
			call: string
		}
	) {
		const queryChaincodeSpinner = ora('Querying chaincode').start()
		const localOrg = new LocalOrg(flags.org)
		const caConfig = await localOrg.getCAConfig()
		const peers = await registry.getPeerConfigs(flags.org)
		if (peers.length === 0) {
			queryChaincodeSpinner.fail('No peers found for the organization')
			return
		}
		// get random peer
		const peer = peers[Math.floor(Math.random() * peers.length)]
		const peerAddress = peer.externalEndpoint
		const adminCert = await localOrg.getAdminCert()
		try {
			const grpcConnection = await newGrpcConnection(peerAddress, Buffer.from(caConfig.tlsCACert))
			const connectOptions = await newConnectOptions(grpcConnection, localOrg.mspId, Buffer.from(adminCert.cert), adminCert.pk)
			const gateway = connect(connectOptions)
			const network = gateway.getNetwork(flags.channel)
			const contract = network.getContract(flags.name)
			const call = JSON.parse(flags.call) as { function: string; Args: string[] }
			const res = await contract.newProposal(call.function, {
				arguments: call.Args,
			})
			queryChaincodeSpinner.text = `Transaction created: ${res.getTransactionId()}`
			const endorsedTx = await res.endorse()
			queryChaincodeSpinner.succeed(`Result: ${Buffer.from(endorsedTx.getResult()).toString('utf-8')}`)
		} catch (e: any) {
			if (e instanceof GatewayError) {
				queryChaincodeSpinner.fail(`Error querying chaincode: ${JSON.stringify(e.details, null, 2)}`)
				return
			}
			queryChaincodeSpinner.fail(`Error querying chaincode: ${e.toString('utf-8')}`)
			return
		}
	}

	@Command({
		name: 'invoke',
		description: 'Invoke a chaincode',
	})
	async invoke(
		@Flag({ name: 'channel', alias: 'c', description: 'Channel to query the chaincode', type: 'string', required: true })
		@Flag({ name: 'name', alias: 'n', description: 'Name of the chaincode to query', type: 'string', required: true })
		@Flag({ name: 'call', description: 'Call arguments to the chaincode', type: 'string', required: true })
		@Flag({ name: 'org', alias: 'o', description: 'Org to query the chaincode', type: 'string', required: true })
		flags: {
			channel: string
			name: string
			org: string
			call: string
		}
	) {
		const invokeChaincodeSpinner = ora('Invoking chaincode').start()
		const localOrg = new LocalOrg(flags.org)
		const caConfig = await localOrg.getCAConfig()
		const peers = await registry.getPeerConfigs(flags.org)
		if (peers.length === 0) {
			invokeChaincodeSpinner.fail('No peers found for the organization')
			return
		}
		const peer = peers[0]
		const peerAddress = peer.externalEndpoint
		const adminCert = await localOrg.getAdminCert()

		try {
			const grpcConnection = await newGrpcConnection(peerAddress, Buffer.from(caConfig.tlsCACert))
			const connectOptions = await newConnectOptions(grpcConnection, localOrg.mspId, Buffer.from(adminCert.cert), adminCert.pk)
			const gateway = connect(connectOptions)
			const network = gateway.getNetwork(flags.channel)
			const contract = network.getContract(flags.name)
			const call = JSON.parse(flags.call) as { function: string; Args: string[] }
			const res = await contract.newProposal(call.function, {
				arguments: call.Args,
			})
			invokeChaincodeSpinner.text = `Transaction created: ${res.getTransactionId()}`
			const endorsedTx = await res.endorse()
			invokeChaincodeSpinner.text = `Submitting transaction after endorsement: ${res.getTransactionId()}`
			const submitRes = await endorsedTx.submit()
			invokeChaincodeSpinner.text = `transaction ${res.getTransactionId()} ${Buffer.from(submitRes.getResult()).toString('utf-8')} waiting...`
			const status = await submitRes.getStatus()
			if (status.successful) {
				invokeChaincodeSpinner.succeed(`Transaction succeeded: txid=${status.transactionId} blockNumber: ${status.blockNumber}`)
			} else {
				invokeChaincodeSpinner.fail(`Transaction failed: txid=${status.transactionId} blockNumber: ${status.blockNumber} status: ${status.code}`)
			}
		} catch (e: any) {
			if (e instanceof GatewayError) {
				invokeChaincodeSpinner.fail(`Error invoking chaincode: ${JSON.stringify(e.details, null, 2)}`)
				return
			}
			invokeChaincodeSpinner.fail(`Error invoking chaincode: ${e.toString('utf-8')}`)
		}
	}
}
