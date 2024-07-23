import ora from "ora";
import { Command, CommandClass } from "../cli-decorators";
import { API_URL } from "../constants";
import { storage } from "../storage";
import chalk from "chalk";
import { type Server } from "bun"
async function getUnusedPort(): Promise<number> {
	return new Promise((resolve, reject) => {
		const server = Bun.serve({
			fetch() {
				return new Response("Temporary server");
			},
			port: 0, // Let the OS assign a random available port
		});

		const port = server.port;
		server.stop();
		resolve(port);
	});
}

@CommandClass({
	name: 'auth'
})
export class AuthCommands {
	@Command({
		name: 'login',
		description: 'Login to the platform',
	})
	async login(
	): Promise<void> {
		// get random number between 15000
		const port = await getUnusedPort();



		const spinner = ora('Requesting login').start()
		const res = await fetch(`${API_URL}/cli/request-login`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				redirectUri: `http://localhost:${port}/callback`
			})
		})

		const data = await res.json()
		spinner.succeed('Login requested')

		const { loginUrl, code } = data
		const waitForTokenSpinner = ora('Waiting for signin').start()
		try {
			try {
				Bun.spawn(['open', loginUrl]);
			} catch (e) {
				// do nothing
			}
			let server: Server
			new Promise<string>((resolve, reject) => {
				server = Bun.serve({
					fetch(req) {
						const url = new URL(req.url)
						if (url.pathname === "/callback") {
							const params = url.searchParams;
							// Get the token from the URL
							const token = params.get("token");
							if (!token) {
								return new Response("No token found", { status: 400 });
							}
							waitForTokenSpinner.succeed('Logged in')
							storage.set('token', token)
							server.stop();
							clearInterval(int)
							return new Response("You can close this window now.", {
								headers: { "Content-Type": "text/plain" },
							});
						}
						return new Response("Not found", { status: 404 });
					},
					port: port,
				});
			})
			console.log(chalk.blueBright(`\nPlease login in your browser, your code is ${code}, go to this URL: ${loginUrl}`))

			const int = setInterval(async () => {
				const res = await fetch(`${API_URL}/cli/request-login-status/${code}`, {
					method: 'GET'
				})
				const data = await res.json() as {
					status: string;
					token: string;
				}
				if (data.status === 'accepted') {
					if (server) {
						server.stop()
					}
					waitForTokenSpinner.succeed('Logged in')
					storage.set('token', data.token)
					clearInterval(int)
				}
			}, 1000)

		} catch (e: any) {

			// const spinner = ora('Waiting for signin').start()
			waitForTokenSpinner.fail(`Failed to login: ${e.message}`)

		}

	}
}

