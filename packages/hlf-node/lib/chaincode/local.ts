import { Subprocess, ShellError, $ } from "bun";
import chalk from "chalk";
import fs from "fs/promises";
import path from "path";
import yaml from "yaml";
import { StartChaincodeOpts } from "./types";
import slugify from "slugify";

type StartCmdResponse = {
	mode: "cmd";
	subprocess: Subprocess;
}
type StartSystemdResponse = {
	mode: "systemd";
	serviceName: string;
}
type StartDockerResponse = {
	mode: "docker";
	containerName: string;
}
export class LocalChaincode {
	constructor(
		private readonly opts: StartChaincodeOpts,
		private readonly mode: "cmd" | "systemd"
	) {

	}
	async start(): Promise<StartCmdResponse | StartSystemdResponse | StartDockerResponse> {

		// check if chaincodePath is a directory and exists
		const chaincodePath = this.opts.chaincodePath
		if (await fs.stat(chaincodePath).catch(() => null) === null) {
			throw new Error(`Chaincode path ${chaincodePath} does not exist`)

		}
		const fabricLaunchFilePath = path.join(this.opts.chaincodePath, ".fabriclaunch.yaml")
		if (await fs.stat(fabricLaunchFilePath).catch(() => null) === null) {
			throw new Error(`Chaincode path ${chaincodePath} does not have a .fabriclaunch.yaml file`)
		}
		const fabricLaunch = await fs.readFile(fabricLaunchFilePath)
		const fabricLaunchYaml = yaml.parse(fabricLaunch.toString()) as {
			command: string[]
			language: string
		}

		const envVariablesForRunning: NodeJS.ProcessEnv = {
			CHAINCODE_TLS_DISABLED: "true",
			CHAINCODE_SERVER_ADDRESS: this.opts.chaincodeAddress,
			CHAINCODE_ID: this.opts.packageId,
			PATH: `${process.env.PATH}`,
		}
		let chaincodeCommand = fabricLaunchYaml.command
		if (fabricLaunchYaml.language === "go") {
			const r = await $`which go`.quiet()
			if (r.exitCode !== 0) {
				throw new Error("Go is not installed")
			}
			envVariablesForRunning.GOPATH = chaincodePath
			envVariablesForRunning.GOCACHE = `${chaincodePath}/.cache/go-build`
			envVariablesForRunning.GOMODCACHE = `${chaincodePath}/pkg/mod`
			// get bin path for go
			const goBinExec = r.stdout.toString("utf-8")
			const goBinPath = path.dirname(r.stdout.toString("utf-8"))
			envVariablesForRunning.PATH = `${goBinPath}:${envVariablesForRunning.PATH}`
			//replace cmd "go" with full path
			chaincodeCommand = chaincodeCommand.map((c) => c === "go" ? goBinExec : c)
		}


		switch (this.mode) {
			case "cmd": {
				try {
					const proc = Bun.spawn(chaincodeCommand, {
						stdio: ["pipe", "pipe", "pipe"],
						env: envVariablesForRunning,
						onExit: (code) => {
							console.log(chalk.blueBright(`Chaincode process exited with code ${code}`));
						}
					});
					(() => {
						new Response(proc.stdout).body.pipeTo(new WritableStream({
							write(chunk) {
								console.log(chalk.blueBright(Buffer.from(chunk).toString("utf-8")));
							}
						}));
						new Response(proc.stderr).body.pipeTo(new WritableStream({
							write(chunk) {
								console.log(chalk.blueBright(Buffer.from(chunk).toString("utf-8")));
							}
						}));
					})()

					return {
						mode: "cmd",
						subprocess: proc
					}
				} catch (error) {
					console.error('Failed to start chaincode node:', (error as ShellError).message);
					throw error;
				}
			}
			case "systemd": {
				try {
					await this.createSystemdService(
						chaincodeCommand,
						envVariablesForRunning
					);
					await this.startService();

					return {
						mode: "systemd",
						serviceName: this.serviceName,
					}
				} catch (error) {
					console.error(`Failed to start ${this.serviceName}:`, error);
					throw error;
				}
			}

			default:
				throw new Error(`Invalid mode: ${this.mode}`);
		}
	}


	private execSystemctl(command: string, service?: string) {
		const r = Bun.spawnSync({
			cmd: service ? ['sudo', 'systemctl', command, service] : ['sudo', 'systemctl', command],
		})
		return r
	}


	private async startService(): Promise<void> {
		try {
			await this.execSystemctl('daemon-reload');
			await this.execSystemctl('enable', this.serviceName);
			await this.execSystemctl('start', this.serviceName);
			await this.execSystemctl('restart', this.serviceName);
			console.log(`Started ${this.serviceName}`);
		} catch (error) {
			console.error(`Failed to start ${this.serviceName}:`, error);
			throw error;
		}
	}

	private async stopService(): Promise<void> {
		try {
			await this.execSystemctl('stop', this.serviceName);
			console.log(`Stopped ${this.serviceName}`);
		} catch (error) {
			console.error(`Failed to stop ${this.serviceName}:`, error);
			throw error;
		}
	}

	private async removeService(): Promise<void> {
		try {
			await this.stopService();
			await this.execSystemctl('disable', this.serviceName);
			await fs.unlink(this.serviceFilePath);
			console.log(`Removed ${this.serviceName}`);
		} catch (error) {
			console.error(`Failed to remove ${this.serviceName}:`, error);
			throw error;
		}
	}

	private get serviceName(): string {
		return `fabric-chaincode-${slugify(this.opts.channelName)}-${slugify(this.opts.chaincodeName)}.service`;
	}

	private get serviceFilePath(): string {
		return `/etc/systemd/system/${this.serviceName}`;
	}

	private async createSystemdService(cmd: string[], env: NodeJS.ProcessEnv): Promise<void> {

		const envString = Object.entries(env)
			.map(([key, value]) => `Environment="${key}=${value}"`)
			.join('\n');

		const serviceContent = `
[Unit]
Description=Hyperledger Fabric Chaincode - ${this.opts.chaincodeName}
After=network.target

[Service]
Type=simple
WorkingDirectory=${this.opts.chaincodePath}
ExecStart=${cmd.join(' ')}
Restart=on-failure
RestartSec=10
LimitNOFILE=65536
${envString}

[Install]
WantedBy=multi-user.target
	`;

		try {
			await fs.writeFile(this.serviceFilePath, serviceContent, { mode: 0o644 });
		} catch (error) {
			console.error('Failed to create systemd service file:', error);
			throw error;
		}
	}

}