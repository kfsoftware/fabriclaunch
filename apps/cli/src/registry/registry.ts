import type { OrdererConfig } from '@repo/hlf-node/lib/orderer';
import type { PeerConfig } from '@repo/hlf-node/lib/peer';
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';


interface IndexEntry {
	type: 'peer' | 'orderer';
	name: string;
	path: string;
}

interface Index {
	[organizationId: string]: IndexEntry[];
}

class ConfigRegistry {
	private basePath: string;
	private indexPath: string;
	private locksPath: string;

	constructor(basePath: string) {
		this.basePath = basePath;
		this.indexPath = path.join(basePath, 'index.json');
		this.locksPath = path.join(basePath, 'locks');
	}

	private async readIndex(): Promise<Index> {
		try {
			const data = await fs.readFile(this.indexPath, 'utf-8');
			return JSON.parse(data);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return {};
			}
			throw error;
		}
	}

	private async writeIndex(index: Index): Promise<void> {
		await fs.writeFile(this.indexPath, JSON.stringify(index, null, 2));
	}

	private async checkDuplicateNodeId(nodeId: string): Promise<boolean> {
		const index = await this.readIndex();
		for (const orgEntries of Object.values(index)) {
			if (orgEntries.some(entry => entry.name === nodeId)) {
				return true;
			}
		}
		return false;
	}

	async storePeerConfig(organizationId: string, config: PeerConfig): Promise<void> {
		if (await this.checkDuplicateNodeId(config.peerName)) {
			// update peer config
			const index = await this.readIndex();
			const orgEntries = index[organizationId] || [];
			const peerEntries = orgEntries.filter(entry => entry.type === 'peer');
			const peerEntry = peerEntries.find(entry => entry.name === config.peerName);
			if (!peerEntry) {
				return
			}
			const filePath = peerEntry.path;
			await fs.writeFile(filePath, JSON.stringify(config, null, 2));
			return
		}

		const peerPath = path.join(this.basePath, 'peers', organizationId);
		await fs.mkdir(peerPath, { recursive: true });

		const filePath = path.join(peerPath, `${config.peerName}.json`);
		await fs.writeFile(filePath, JSON.stringify(config, null, 2));

		const index = await this.readIndex();
		if (!index[organizationId]) {
			index[organizationId] = [];
		}
		index[organizationId] = index[organizationId].filter(entry => entry.name !== config.peerName);
		index[organizationId].push({
			type: 'peer',
			name: config.peerName,
			path: filePath,
		});
		await this.writeIndex(index);
	}

	async storeOrdererConfig(organizationId: string, config: OrdererConfig): Promise<void> {
		if (await this.checkDuplicateNodeId(config.ordererName)) {
			// update peer config
			const index = await this.readIndex();
			const orgEntries = index[organizationId] || [];
			const ordererEntries = orgEntries.filter(entry => entry.type === 'orderer');
			const ordererEntry = ordererEntries.find(entry => entry.name === config.ordererName);
			if (!ordererEntry) {
				return
			}
			const filePath = ordererEntry.path;
			await fs.writeFile(filePath, JSON.stringify(config, null, 2));
			return
		}

		const ordererPath = path.join(this.basePath, 'orderers', organizationId);
		await fs.mkdir(ordererPath, { recursive: true });

		const filePath = path.join(ordererPath, `${config.ordererName}.json`);
		await fs.writeFile(filePath, JSON.stringify(config, null, 2));

		const index = await this.readIndex();
		if (!index[organizationId]) {
			index[organizationId] = [];
		}
		index[organizationId] = index[organizationId].filter(entry => entry.name !== config.ordererName);
		index[organizationId].push({
			type: 'orderer',
			name: config.ordererName,
			path: filePath,
		});
		await this.writeIndex(index);
	}

	async getPeerConfigs(organizationId: string): Promise<PeerConfig[]> {
		const index = await this.readIndex();
		const orgEntries = index[organizationId] || [];
		const peerEntries = orgEntries.filter(entry => entry.type === 'peer');

		const configs: PeerConfig[] = [];
		for (const entry of peerEntries) {
			const data = await fs.readFile(entry.path, 'utf-8');
			configs.push(JSON.parse(data));
		}
		return configs;
	}

	async getOrdererConfigs(organizationId: string): Promise<OrdererConfig[]> {
		const index = await this.readIndex();
		const orgEntries = index[organizationId] || [];
		const ordererEntries = orgEntries.filter(entry => entry.type === 'orderer');

		const configs: OrdererConfig[] = [];
		for (const entry of ordererEntries) {
			const data = await fs.readFile(entry.path, 'utf-8');
			configs.push(JSON.parse(data));
		}
		return configs;
	}

	private getLockFilePath(organizationId: string, nodeName: string, nodeType: 'peer' | 'orderer'): string {
		return path.join(this.locksPath, organizationId, `${nodeType}_${nodeName}.lock`);
	}

	private async isProcessRunning(pid: number): Promise<boolean> {
		try {
			process.kill(pid, 0);
			return true;
		} catch (error) {
			return false;
		}
	}

	async lockNode(organizationId: string, nodeName: string, nodeType: 'peer' | 'orderer', pid: number): Promise<boolean> {
		const lockFilePath = this.getLockFilePath(organizationId, nodeName, nodeType);

		try {
			await fs.mkdir(path.dirname(lockFilePath), { recursive: true });

			// Check if the lock file exists and if the process is running
			try {
				const existingPid = parseInt(await fs.readFile(lockFilePath, 'utf-8'), 10);
				if (await this.isProcessRunning(existingPid)) {
					return false; // Process is still running, cannot acquire lock
				}
			} catch (error) {
				// If the file doesn't exist or can't be read, we can proceed with creating a new lock
			}

			// Create or overwrite the lock file with the provided PID
			await fs.writeFile(lockFilePath, pid.toString());
			return true; // Lock acquired successfully
		} catch (error) {
			console.error('Error while locking node:', error);
			return false;
		}
	}

	async unlockNode(organizationId: string, nodeName: string, nodeType: 'peer' | 'orderer'): Promise<void> {
		const lockFilePath = this.getLockFilePath(organizationId, nodeName, nodeType);

		try {
			await fs.unlink(lockFilePath);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
				console.error('Error while unlocking node:', error);
			}
		}
	}

	async isNodeLocked(organizationId: string, nodeName: string, nodeType: 'peer' | 'orderer'): Promise<boolean> {
		const lockFilePath = this.getLockFilePath(organizationId, nodeName, nodeType);

		try {
			const pid = parseInt(await fs.readFile(lockFilePath, 'utf-8'), 10);
			return await this.isProcessRunning(pid);
		} catch (error) {
			if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
				return false; // Lock file doesn't exist, node is not locked
			}
			console.error('Error while checking node lock:', error);
			return false; // Assume unlocked in case of unexpected errors
		}
	}


}
import os from 'os';
const homeDir = os.homedir();
// specific path for peerId
const dirPath = path.join(homeDir, `.fabriclaunch/registry`);
export const registry = new ConfigRegistry(dirPath);
// // Usage example:
// async function main() {
// 	const registry = new ConfigRegistry('./registry');

// 	// Store configs
// 	await registry.storePeerConfig('org1', {
// 		// ... peer config data
// 		peerName: 'peer1',
// 	} as PeerConfig);

// 	await registry.storeOrdererConfig('org1', {
// 		// ... orderer config data
// 		ordererName: 'orderer1',
// 	} as OrdererConfig);

// 	// Retrieve configs
// 	const peerConfigs = await registry.getPeerConfigs('org1');
// 	console.log('Peer configs:', peerConfigs);

// 	const ordererConfigs = await registry.getOrdererConfigs('org1');
// 	console.log('Orderer configs:', ordererConfigs);
// }

// main().catch(console.error);
