import { LocalOrg, type OrgType } from "@repo/hlf-node";
import chalk from 'chalk';
import ora from "ora";
import * as z from "zod";
import { Arg, Command, CommandClass, Flag } from "../cli-decorators";
import { execute } from "../graphql/client/execute";
import { ImportOrgDocument } from "../graphql/client/graphql";
import { storage } from "../storage";
import { DEFAULT_TENANT_NAME } from "../constants";

// create schema for org create command
const orgCreateSchema = z.object({
	type: z.enum(["local", "vault"]),
	mspId: z.string()
})
@CommandClass({
	name: 'org'
})
export class OrgCommands {
	@Command({
		name: 'delete',
		description: 'Delete an organization',
	})
	async deleteOrg(
		@Arg({ name: 'mspId', description: 'Name of the person to greet' })
		mspId: string
	): Promise<void> {
		const localOrg = new LocalOrg(mspId)
		const spinner = ora(`Deleting org: ${mspId}`).start()
		try {
			await localOrg.delete()
			spinner.succeed('Org deleted')
		} catch (error) {
			spinner.fail(`Error deleting org: ${error}`)
		}
	}
	@Command({
		name: 'register',
		description: 'Register an organization',
	})
	async registerOrg(
		@Arg({ name: 'mspId', description: 'Name of the person to greet' })
		mspId: string,
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: { tenant?: string }
	): Promise<void> {
		const tenantSlug = flags.tenant || DEFAULT_TENANT_NAME
		const localOrg = new LocalOrg(mspId)
		const spinner = ora(`Registering org: ${mspId}`).start()
		try {
			const caConfig = await localOrg.getCAConfig()
			const res = await execute(ImportOrgDocument, {
				input: {
					mspId: mspId,
					tenantSlug,
					signCACert: caConfig.caCert,
					tlsCACert: caConfig.tlsCACert
				}
			})
			if (res.errors && res.errors.length > 0) {
				spinner.fail('Error creating local org')
				console.log(chalk.red(JSON.stringify(res.errors, null, 2)))
				return
			} else {
				spinner.succeed('Local org registered')
			}
			spinner.succeed('Org registered')
		} catch (error) {
			spinner.fail(`Error registering org: ${error}`)
		}
	}
	@Command({
		name: 'create',
		description: 'Create a new organization',
	})
	async createOrg(
		@Arg({ name: 'mspId', description: 'Name of the person to greet' })
		mspId: string,
		@Flag({ name: 'type', alias: 't', description: 'Type of org', required: true, type: 'string' })
		@Flag({ name: 'tenant', description: 'Tenant to accept the chaincode proposal', type: 'string', required: false })
		flags: { type: OrgType, tenant?: string }
	): Promise<void> {
		if (!flags.type) {
			console.log(chalk.red('Org type is required'))
			return
		}

		if (!await storage.checkIfLoggedIn()) {
			console.log(chalk.red('Please login first'))
			return
		}
		const orgResult = orgCreateSchema.safeParse({
			type: flags.type,
			mspId: mspId
		})
		if (!orgResult.success) {
			console.log(chalk.red(orgResult.error.errors[0].message))
			return
		}
		switch (flags.type) {
			case 'local':
				const spinner = ora(`Creating local org: ${mspId}`).start()
				const localOrg = new LocalOrg(mspId)
				try {
					await localOrg.getCAConfig()
					spinner.fail('Org already exists')
					return
				} catch (e) {
					// continue
				}
				try {
					await localOrg.init()
					spinner.succeed('Local org created')
				} catch (error) {
					spinner.fail('Error creating local org')
					console.log(chalk.red(error))
				}
				break;
			case 'vault':
				console.log('Creating vault org')
				break;
			default:
				console.log(chalk.red('Invalid org type'))
				break;
		}
	}

}

