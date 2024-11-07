import { CommandClass, Command, Arg, Flag } from '../cli-decorators'
import { execute } from '../graphql/client/execute'
import { storage } from '../storage'
import ora from 'ora'
import chalk from 'chalk'
import { CreateConsortiumDocument } from '../graphql/client/graphql'

@CommandClass({
	name: 'consortium',
	description: 'Manage consortiums',
})
export class ConsortiumCommands {
	@Command({
		name: 'create',
		description: 'Create a new consortium',
	})
	async create(
		@Arg({ name: 'name', description: 'Name of the consortium' })
		name: string,
		@Flag({ name: 'description', alias: 'd', description: 'Description of the consortium', type: 'string', required: false })
		flags: { description?: string }
	) {
		const createSpinner = ora(`Creating consortium ${name}`).start()

		try {
			if (!(await storage.checkIfLoggedIn())) {
				createSpinner.fail('Please login first')
				return
			}
			const res = await execute(CreateConsortiumDocument, {
				input: {
					name,
				},
			})
			if (res.errors) {
				createSpinner.fail(res.errors[0].message)
				return
			}
			// Add implementation here to create consortium
			// TODO: Add actual consortium creation logic with GraphQL mutation

			createSpinner.succeed(`Created consortium ${name}`)
			if (flags.description) {
				console.log(chalk.gray(`Description: ${flags.description}`))
			}
		} catch (error) {
			createSpinner.fail(`Failed to create consortium ${name}: ${(error as Error).message}`)
		}
	}
}
