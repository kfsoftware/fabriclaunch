import { LocalOrderer, LocalOrg } from "@repo/hlf-node";
import chalk from "chalk";
import slugify from "slugify";
import { Arg, Command, CommandClass, Flag } from "../cli-decorators";
import ora from "ora";
import { execute } from "../graphql/client/execute";
import { ImportOrdererDocument } from "../graphql/client/graphql";
import { storage } from "../storage";
import { registry } from "../registry/registry";
import { DEFAULT_TENANT_NAME } from "../constants";
@CommandClass({
	name: 'orderer'
})
export class OrdererCommands {
	@Command({
		name: 'stop',
		description: 'Stop a orderer node',
	})
	async stop(
		@Arg({ name: 'name', description: 'Name of the orderer to stop' })
		ordererName: string,
		@Flag({ name: 'mspId', alias: 'm', description: 'MSP to stop the orderer for', type: 'string', required: true })
		flags: { mspId: string }
	): Promise<void> {
		const ordererId = slugify(ordererName)
		const stoppingordererSpinner = ora(`Stopping orderer ${ordererId}`).start()
		const orderers = await registry.getOrdererConfigs(flags.mspId)
		if (!orderers.length) {
			stoppingordererSpinner.fail(`No orderers found for MSP ${flags.mspId}`)
			return
		}
		const ordererConfig = orderers.find(orderer => orderer.ordererName === ordererId)
		if (!ordererConfig) {
			stoppingordererSpinner.fail(`Orderer ${ordererId} not found`)
			return
		}
		const orderer = new LocalOrderer(
			flags.mspId,
			{
				id: ordererId,
				externalEndpoint: ordererConfig.externalEndpoint,
				listenAddress: ordererConfig.listenAddress,
				operationsListenAddress: ordererConfig.operationsListenAddress,
				adminAddress: ordererConfig.adminAddress,
				domainNames: []
			},
			new LocalOrg(flags.mspId),
			ordererConfig.mode
		)
		await orderer.stop()
		stoppingordererSpinner.fail(`Orderer ${ordererId} stopped`)
	}
	@Command({
		name: 'create',
		description: 'Create a new orderer node',
	})
	async create(
		@Arg({ name: 'name', description: 'Name of the orderer to create' })
		ordererName: string,
		@Flag({ name: 'mspId', alias: 'm', description: 'MSP to create the orderer for', type: 'string', required: true })
		// add flags for external endpoint, listen address, chaincode address, events address, operations listen address
		@Flag({ name: 'externalEndpoint', alias: 'e', description: 'External endpoint for the orderer, example: 0.0.0.0:7050', type: 'string', required: true })
		@Flag({ name: 'listenAddress', alias: 'l', description: 'Listen address for the orderer, example: 0.0.0.0:7050', type: 'string', required: true })

		@Flag({ name: 'operationsListenAddress', alias: 'o', description: 'Operations listen address for the orderer, example: 0.0.0.0:7051', type: 'string', required: true })
		@Flag({ name: 'adminAddress', alias: 'a', description: 'Admin address for the orderer, example: 0.0.0.0:7052', type: 'string', required: true })
		// optional array of hosts
		// optional array of ipAddresses
		@Flag({ name: 'region', alias: 'r', description: 'Region for the peer', type: 'string', required: true })
		@Flag({ name: 'mode', alias: 'm', description: 'Mode for the peer', type: 'string', required: true })
		@Flag({ name: 'hosts', alias: 'h', description: 'Hosts for the orderer', type: 'string[]', required: false })
		@Flag({ name: 'tenant', alias: 't', description: 'Tenant for the peer', type: 'string', required: false })
		flags: {
			mspId: string
			externalEndpoint: string
			mode: "cmd" | "systemd" | "docker"
			listenAddress: string
			adminAddress: string
			tenant?: string
			region: string
			operationsListenAddress: string
			hosts?: string[]
		}
	): Promise<void> {
		const ordererId = slugify(ordererName)
		const initSpinner = ora(`Initializing orderer ${ordererId}`).start()
		if (!await storage.checkIfLoggedIn()) {
			initSpinner.fail('Please login first')
			return
		}
		if (flags.mode !== "cmd" && flags.mode !== "systemd") {
			initSpinner.fail(chalk.red(`Invalid mode ${flags.mode}`))
			return
		}
		let tenantSlug = flags.tenant
		if (!tenantSlug) {
			tenantSlug = DEFAULT_TENANT_NAME
		}
		const localOrg = new LocalOrg(flags.mspId)
		try {
			await localOrg.getCAConfig()
		} catch (e) {
			initSpinner.fail(`Org ${flags.mspId} does not exist`)
			return
		}
		const orderer = new LocalOrderer(
			flags.mspId,
			{
				id: ordererId,
				externalEndpoint: flags.externalEndpoint,
				listenAddress: flags.listenAddress,
				operationsListenAddress: flags.operationsListenAddress,
				adminAddress: flags.adminAddress,
				domainNames: flags.hosts
			},
			localOrg,
			flags.mode
		)
		const ordererConfig = await orderer.init()
		initSpinner.succeed(`Initialized orderer ${ordererId}`)
		const registerSpinner = ora(`Registering orderer ${ordererId}`).start()
		const res = await execute(ImportOrdererDocument, {
			input: {
				mspId: flags.mspId,
				name: ordererId,
				signCert: ordererConfig.signCert,
				tenantSlug,
				region: flags.region,
				tlsCert: ordererConfig.tlsCert,
				url: flags.externalEndpoint
			}
		})
		if (res.errors && res.errors.length > 0) {
			registerSpinner.fail(res.errors[0].message)
			return
		} else {
			registerSpinner.succeed(`Registered orderer ${ordererId}`)
		}
		await registry.storeOrdererConfig(flags.mspId, ordererConfig)
		const startingOrdererSpinner = ora(`Starting orderer ${ordererId}`).start()
		if (flags.mode === "cmd" && await registry.isNodeLocked(flags.mspId, ordererConfig.ordererName, "orderer")) {
			startingOrdererSpinner.fail(`Orderer ${ordererId} is already running`)
			return
		}
		const response = await orderer.start()
		switch (response.mode) {
			case "cmd":
				await registry.lockNode(flags.mspId, ordererConfig.ordererName, "orderer", response.subprocess.pid)
				startingOrdererSpinner.succeed(`Started orderer ${ordererId}`)
				break;
			case "systemd":
				startingOrdererSpinner.succeed(`Started orderer using systemd service name ${response.serviceName}`)
				break
			case "docker":
				startingOrdererSpinner.succeed(`Started orderer using docker container id ${response.containerName}`)
				break
			default:
				break;
		}
		startingOrdererSpinner.succeed(`Started orderer ${ordererId}`)
	}
}

