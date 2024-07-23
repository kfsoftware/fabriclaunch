import * as fs from 'fs/promises';
import * as path from 'path';
import * as tar from 'tar';
import { promisify } from 'util';
import * as zlib from 'zlib';
import { createTempDir, createTempFile } from './file';

const gzip = promisify(zlib.gzip);

interface ChaincodePackageOptions {
	chaincodeName: string;
	chaincodeLabel: string;
	address: string;
}

export async function generateChaincodePackage(options: ChaincodePackageOptions): Promise<string> {
	const { chaincodeName, chaincodeLabel, address } = options;
	const outputDirRes = await createTempDir()
	const outputDir = outputDirRes.name;

	try {
		// Create metadata.json
		const metadata = {
			type: 'ccaas',
			label: chaincodeLabel
		};
		const metadataPath = path.join(outputDir, 'metadata.json');
		await fs.writeFile(metadataPath, JSON.stringify(metadata, null, 2));

		// Create connection.json
		const connection = {
			address: address,
			dial_timeout: '10s',
			tls_required: false
		};
		const connectionPath = path.join(outputDir, 'connection.json');
		await fs.writeFile(connectionPath, JSON.stringify(connection, null, 2));

		// Create code.tar.gz
		const codeTarPath = path.join(outputDir, 'code.tar.gz');
		await createTarGz([connectionPath], codeTarPath);

		// Create chaincode.tgz
		const { path: chaincodeTarPath } = await createTempFile()
		// tmpNameSync({ postfix: '.tar.gz' });
		await createTarGz([metadataPath, codeTarPath], chaincodeTarPath);

		return chaincodeTarPath;
	} finally {
		// Clean up temporary files
		await fs.rm(outputDir, { recursive: true, force: true });
	}
}

async function createTarGz(inputFiles: string[], outputFile: string): Promise<void> {
	// Create a tar archive
	await tar.create(
		{
			gzip: false,
			file: outputFile + '.tar',
			cwd: path.dirname(inputFiles[0]),
		},
		inputFiles.map(file => path.basename(file))
	);

	// Read the tar file
	const tarBuffer = await fs.readFile(outputFile + '.tar');

	// Gzip the tar buffer
	const gzippedBuffer = await gzip(tarBuffer);

	// Write the gzipped buffer to the output file
	await fs.writeFile(outputFile, gzippedBuffer);

	// Remove the temporary tar file
	await fs.unlink(outputFile + '.tar');
}
