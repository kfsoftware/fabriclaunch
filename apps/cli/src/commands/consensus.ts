import { LocalOrg } from "@repo/hlf-node";
import { $, ShellError } from "bun";
import fs from "fs/promises";
import ora from "ora";
import slugify from "slugify";
import { Arg, Command, CommandClass, Flag } from "../cli-decorators";
import { DEFAULT_TENANT_NAME } from "../constants";
import { execute } from "../graphql/client/execute";
import { AuditLogType, GetChannelProposalDocument } from "../graphql/client/graphql";
import { registry } from "../registry/registry";
import { storage } from "../storage";
import { createAuditLog } from "../utils/audit";
import { createTempFileSync } from "../utils/file";

@CommandClass({
	name: 'consensus'
})
export class ConsensusCommands {
	// create
	// bun run ./src/index.ts consensus create "${PROPOSAL_ID}" -o OrdererMSP
	@Command({
		name: 'create',
		description: 'Commits consensus and creates a new channel on the orderer nodes',
	})
	async create(
		@Arg({ name: 'proposalId', description: 'ID of the proposal to commit' })
		proposalId: string,
		@Flag({ name: 'org', alias: 'o', description: 'Orderer org to join the orderers to the channel', type: 'string', required: true })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: { org: string, tenant?: string }
	) {
		const createConsensusSpinner = ora('Creating consensus').start()
		if (!storage.checkIfLoggedIn()) {
			createConsensusSpinner.fail('Please login first')
			return
		}
		const localOrg = new LocalOrg(flags.org)
		try {
			await localOrg.getCAConfig()
		} catch (e) {
			createConsensusSpinner.fail(`Org ${flags.org} does not exist`)
			return
		}
		const tenantSlug = flags.tenant || DEFAULT_TENANT_NAME
		const resProposal = await execute(GetChannelProposalDocument, {
			proposalSlug: proposalId,
			tenantSlug
		})
		if (resProposal.errors) {
			createConsensusSpinner.fail(resProposal.errors[0].message)
			return
		}
		const { proposal } = resProposal.data!
		// get local nodes of the org
		// store admin certificate, privateKey and rootCA in temporal files
		const orderers = await registry.getOrdererConfigs(flags.org)
		const { path: caFileTmp } = createTempFileSync()
		const { path: clientCertTmp } = createTempFileSync()
		const { path: clientKeyTmp } = createTempFileSync()
		const { path: configBlockTmp } = createTempFileSync()
		const adminTlsCert = await localOrg.getAdminTLSCert()
		await fs.writeFile(caFileTmp, adminTlsCert.caCert)
		await fs.writeFile(clientCertTmp, adminTlsCert.cert)
		await fs.writeFile(clientKeyTmp, adminTlsCert.pk)
		await fs.writeFile(configBlockTmp, Buffer.from(proposal.channelData.channelTx, "base64"))
		for (const orderer of orderers) {
			const ordererId = slugify(orderer.ordererName)
			const adminUrl = orderer.adminAddress.replace("0.0.0.0", "127.0.0.1")
			const joinOrdererSpinner = ora(`Joining orderer ${ordererId} to the channel ${proposal.channelName}`).start()
			try {
				const r = await $`osnadmin channel join --channelID ${proposal.channelName} --config-block=${configBlockTmp} --orderer-address=${adminUrl} --ca-file=${caFileTmp} --client-cert=${clientCertTmp} --client-key=${clientKeyTmp}`.quiet()
				if (r.exitCode !== 0) {
					joinOrdererSpinner.fail(r.stderr.toString("utf-8"))
					return
				}
				joinOrdererSpinner.succeed(`Orderer ${ordererId} joined to the channel ${proposal.channelName}: ${r.stdout.toString("utf-8")}`)
			} catch (e: any) {
				const bunError = e as ShellError
				joinOrdererSpinner.fail(bunError.stderr.toString("utf-8"))
			}
		}
		await createAuditLog(tenantSlug, flags.org, AuditLogType.OrdererJoined, {
			channelName: proposal.channelName,
			orderers: orderers.map(o => o.ordererName)
		})
		process.exit(0)
	}


}
