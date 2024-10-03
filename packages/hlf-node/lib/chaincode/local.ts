import { Subprocess, ShellError, $ } from 'bun'
import chalk from 'chalk'
import fs from 'fs/promises'
import path from 'path'
import yaml from 'yaml'
import { StartChaincodeOpts } from './types'
import slugify from 'slugify'
import os from 'os'

type StartCmdResponse = {
	mode: 'cmd'
	subprocess: Subprocess
}
type StartServiceResponse = {
	mode: 'service'
	type: 'systemd' | 'launchd'
	serviceName: string
}
type StartDockerResponse = {
	mode: 'docker'
	containerName: string
}
export class LocalChaincode {
	constructor(
		private readonly opts: StartChaincodeOpts,
		private readonly mode: 'cmd' | 'service' | 'docker'
	) {}
	async start(): Promise<StartCmdResponse | StartServiceResponse | StartDockerResponse> {
		// check if chaincodePath is a directory and exists
		const chaincodePath = this.opts.chaincodePath
		if ((await fs.stat(chaincodePath).catch(() => null)) === null) {
			throw new Error(`Chaincode path ${chaincodePath} does not exist`)
		}
		const fabricLaunchFilePath = path.join(this.opts.chaincodePath, '.fabriclaunch.yaml')
		if ((await fs.stat(fabricLaunchFilePath).catch(() => null)) === null) {
			throw new Error(`Chaincode path ${chaincodePath} does not have a .fabriclaunch.yaml file`)
		}
		const fabricLaunch = await fs.readFile(fabricLaunchFilePath)
		const fabricLaunchYaml = yaml.parse(fabricLaunch.toString()) as {
			command: string[]
			language: string
		}

		const envVariablesForRunning: NodeJS.ProcessEnv = {
			CHAINCODE_TLS_DISABLED: 'true',
			CHAINCODE_SERVER_ADDRESS: this.opts.chaincodeAddress,
			CHAINCODE_ID: this.opts.packageId,
			PATH: `${process.env.PATH}`,
		}
		let chaincodeCommand = fabricLaunchYaml.command
		if (fabricLaunchYaml.language === 'go') {
			const r = await $`which go`.quiet()
			if (r.exitCode !== 0) {
				throw new Error('Go is not installed')
			}
			envVariablesForRunning.GOCACHE = `${chaincodePath}/.cache/go-build`
			envVariablesForRunning.GOMODCACHE = `${chaincodePath}/pkg/mod`
			// get bin path for go
			const goBinExec = r.stdout.toString('utf-8')
			const goBinPath = path.dirname(r.stdout.toString('utf-8'))
			envVariablesForRunning.PATH = `${goBinPath}:${envVariablesForRunning.PATH}`
			//replace cmd "go" with full path
			chaincodeCommand = chaincodeCommand.map((c) => (c === 'go' ? goBinExec : c))
		}

		switch (this.mode) {
			case 'cmd':
				return this.startCmd(chaincodeCommand, envVariablesForRunning)
			case 'service':
				return this.startService(chaincodeCommand, envVariablesForRunning, chaincodePath)
			case 'docker':
				throw new Error('Not implemented')
			default:
				throw new Error(`Invalid mode: ${this.mode}`)
		}
	}

	private async startCmd(cmd: string[], env: NodeJS.ProcessEnv): Promise<StartCmdResponse> {
		try {
			const proc = Bun.spawn(cmd, {
				stdio: ['pipe', 'pipe', 'pipe'],
				env: env,
				onExit: (code) => {
					console.log(chalk.blueBright(`Chaincode process exited with code ${code}`))
				},
			})
			;(() => {
				new Response(proc.stdout).body.pipeTo(
					new WritableStream({
						write(chunk) {
							console.log(chalk.blueBright(Buffer.from(chunk).toString('utf-8')))
						},
					})
				)
				new Response(proc.stderr).body.pipeTo(
					new WritableStream({
						write(chunk) {
							console.log(chalk.blueBright(Buffer.from(chunk).toString('utf-8')))
						},
					})
				)
			})()

			return {
				mode: 'cmd',
				subprocess: proc,
			}
		} catch (error) {
			console.error('Failed to start chaincode node:', (error as ShellError).message)
			throw error
		}
	}

	private async startService(cmd: string[], env: NodeJS.ProcessEnv, dirPath: string): Promise<StartServiceResponse> {
		const platform = os.platform()
		try {
			if (platform === 'linux') {
				await this.createSystemdService(cmd, env, dirPath)
				await this.startSystemdService()
				return { mode: 'service', type: 'systemd', serviceName: this.serviceName }
			} else if (platform === 'darwin') {
				await this.createLaunchdService(cmd, env, dirPath)
				await this.startLaunchdService()
				return { mode: 'service', type: 'launchd', serviceName: this.serviceName }
			} else {
				throw new Error(`Unsupported platform for service mode: ${platform}`)
			}
		} catch (error) {
			console.error(`Failed to start ${this.serviceName}:`, error)
			throw error
		}
	}

	private async createSystemdService(cmd: string[], env: NodeJS.ProcessEnv, dirPath: string): Promise<void> {
		const envString = Object.entries(env)
			.map(([key, value]) => `Environment="${key}=${value}"`)
			.join('\n')

		const serviceContent = `
[Unit]
Description=Hyperledger Fabric Chaincode - ${this.opts.chaincodeName}
After=network.target

[Service]
Type=simple
WorkingDirectory=${dirPath}
ExecStart=${cmd.join(' ')}
Restart=on-failure
RestartSec=10
LimitNOFILE=65536
${envString}

[Install]
WantedBy=multi-user.target
`

		try {
			await fs.writeFile(this.serviceFilePath, serviceContent, { mode: 0o644 })
		} catch (error) {
			console.error('Failed to create systemd service file:', error)
			throw error
		}
	}

	private async createLaunchdService(cmd: string[], env: NodeJS.ProcessEnv, dirPath: string): Promise<void> {
		const envString = Object.entries(env)
			.map(
				([key, value]) => `<key>${key}</key>
    <string>${value}</string>`
			)
			.join('\n')

		const serviceContent = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${this.launchdServiceName}</string>
  <key>ProgramArguments</key>
  <array>
    <string>/bin/bash</string>
    <string>-c</string>
    <string>${cmd.join(' ')}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>WorkingDirectory</key>
  <string>${dirPath}</string>
  <key>StandardOutPath</key>
  <string>${dirPath}/${this.serviceName}.log</string>
  <key>StandardErrorPath</key>
  <string>${dirPath}/${this.serviceName}.err</string>
  <key>EnvironmentVariables</key>
  <dict>
    ${envString}
  </dict>
</dict>
</plist>
`

		try {
			await fs.writeFile(this.launchdPlistPath, serviceContent, { mode: 0o644 })
		} catch (error) {
			console.error('Failed to create launchd service file:', error)
			throw error
		}
	}

	private async startSystemdService(): Promise<void> {
		try {
			await this.execSystemctl('daemon-reload')
			await this.execSystemctl('enable', this.serviceName)
			await this.execSystemctl('start', this.serviceName)
			await this.execSystemctl('restart', this.serviceName)
		} catch (error) {
			throw error
		}
	}

	private async startLaunchdService(): Promise<void> {
		try {
			// Unload and stop service first
			await this.stopLaunchdService()

			const loadResult = Bun.spawnSync({
				cmd: ['launchctl', 'load', this.launchdPlistPath],
			})
			if (loadResult.exitCode !== 0) {
				throw new Error(`Failed to load service: ${loadResult.stderr.toString()}`)
			}

			const startResult = Bun.spawnSync({
				cmd: ['launchctl', 'start', this.launchdServiceName],
			})
			if (startResult.exitCode !== 0) {
				throw new Error(`Failed to start service: ${startResult.stderr.toString()}`)
			}
		} catch (error) {
			console.error('Failed to start launchd service:', error)
			throw error
		}
	}

	async stop(): Promise<void> {
		switch (this.mode) {
			case 'cmd': {
				throw new Error("Can't stop chaincode process using cmd mode")
			}
			case 'service': {
				const platform = os.platform()
				if (platform === 'linux') {
					await this.stopSystemdService()
				} else if (platform === 'darwin') {
					await this.stopLaunchdService()
				} else {
					throw new Error(`Unsupported platform for service mode: ${platform}`)
				}
				break
			}
			case 'docker': {
				throw new Error('Not implemented')
			}
		}
	}

	private async stopSystemdService(): Promise<void> {
		try {
			await this.execSystemctl('stop', this.serviceName)
			console.log(`Stopped ${this.serviceName}`)
		} catch (error) {
			console.error(`Failed to stop ${this.serviceName}:`, error)
			throw error
		}
	}

	private async stopLaunchdService(): Promise<void> {
		try {
			Bun.spawnSync({
				cmd: ['launchctl', 'stop', this.launchdServiceName],
			})
			Bun.spawnSync({
				cmd: ['launchctl', 'unload', this.launchdPlistPath],
			})
		} catch (error) {
			console.error(`Failed to stop ${this.launchdServiceName}:`, error)
			throw error
		}
	}

	private execSystemctl(command: string, service?: string) {
		const r = Bun.spawnSync({
			cmd: service ? ['sudo', 'systemctl', command, service] : ['sudo', 'systemctl', command],
		})
		return r
	}

	private get serviceName(): string {
		return `fabric-chaincode-${this.opts.mspId.toLowerCase()}-${slugify(this.opts.chaincodeName)}`
	}

	private get launchdServiceName(): string {
		return `com.fabriclaunch.chaincode.${this.opts.mspId.toLowerCase()}-${slugify(this.opts.chaincodeName)}`
	}

	private get serviceFilePath(): string {
		return `/etc/systemd/system/${this.serviceName}.service`
	}

	private get launchdPlistPath(): string {
		return `${os.homedir()}/Library/LaunchAgents/${this.launchdServiceName}.plist`
	}
}
