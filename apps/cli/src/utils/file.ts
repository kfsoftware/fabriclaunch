import fs from 'fs';
import { mkdir, rm } from 'fs/promises';
import os from 'os';
import { join } from 'path';

export function createTempFileSync() {
	// Generate a unique temporary directory name
	const tempDirPath = join(os.tmpdir(), 'bun-temp-' + Math.random().toString(36).slice(2, 10));

	try {
		// Create the temporary directory
		fs.mkdirSync(tempDirPath, { recursive: true });

		// Generate a unique filename
		const tempFileName = 'temp-' + Math.random().toString(36).slice(2, 10) + '.txt';
		const tempFilePath = join(tempDirPath, tempFileName);

		// Define the cleanup function
		const cleanup = async () => {
			try {
				// Remove the entire temporary directory and its contents
				fs.rmSync(tempDirPath, { recursive: true, force: true });
			} catch (error) {
				console.error('Error during cleanup:', error);
			}
		};

		return { path: tempFilePath, cleanup };
	} catch (error) {
		throw error;
	}
}

export async function createTempFile() {
	// Generate a unique temporary directory name
	const tempDirPath = join(os.tmpdir(), 'bun-temp-' + Math.random().toString(36).slice(2, 10));

	try {
		// Create the temporary directory
		await mkdir(tempDirPath, { recursive: true });

		// Generate a unique filename
		const tempFileName = 'temp-' + Math.random().toString(36).slice(2, 10) + '.txt';
		const tempFilePath = join(tempDirPath, tempFileName);

		// Define the cleanup function
		const cleanup = async () => {
			try {
				// Remove the entire temporary directory and its contents
				await rm(tempDirPath, { recursive: true, force: true });
			} catch (error) {
				console.error('Error during cleanup:', error);
			}
		};

		return { path: tempFilePath, cleanup };
	} catch (error) {
		throw error;
	}
}

export function createTempDirSync() {
	// Generate a unique temporary directory name
	const tempDirPath = join(os.tmpdir(), 'bun-temp-dir-' + Math.random().toString(36).slice(2, 10));

	try {
		// Create the temporary directory
		fs.mkdirSync(tempDirPath, { recursive: true });

		// Define the cleanup function
		const cleanup = () => {
			try {
				// Remove the entire temporary directory and its contents
				fs.rmSync(tempDirPath, { recursive: true, force: true });
			} catch (error) {
				console.error('Error during cleanup:', error);
			}
		};

		return { name: tempDirPath, cleanup };
	} catch (error) {
		throw error;
	}
}

export async function createTempDir() {
	// Generate a unique temporary directory name
	const tempDirPath = join(os.tmpdir(), 'bun-temp-dir-' + Math.random().toString(36).slice(2, 10));

	try {
		// Create the temporary directory
		await mkdir(tempDirPath, { recursive: true });

		// Define the cleanup function
		const cleanup = async () => {
			try {
				// Remove the entire temporary directory and its contents
				await rm(tempDirPath, { recursive: true, force: true });
			} catch (error) {
				console.error('Error during cleanup:', error);
			}
		};

		return { name: tempDirPath, cleanup };
	} catch (error) {
		throw error;
	}
}
