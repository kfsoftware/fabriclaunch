import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import { execSync } from 'child_process';

interface CertificateConfig {
	organization: string;
	country: string;
	locality: string;
	organizationalUnit: string;
	streetAddress: string;
	name: string;
	hosts: string[];
	outputDir?: string;
}

export interface CAConfig {
	caCert: string;
	caKey: string;
	caName: string;
	tlsCACert: string;
	tlsCAKey: string;
}

export class OrgCertificateGenerator {
	private config: CertificateConfig;

	constructor(config: CertificateConfig) {
		this.config = config;
	}

	async readCAConfig(): Promise<CAConfig> {
		const homeDir = os.homedir();
		const filePath = path.join(homeDir, `.fabriclaunch/cas/${this.config.name}/config.json`);

		try {
			const data = await fs.readFile(filePath, 'utf8');
			return JSON.parse(data);
		} catch (error) {
			throw new Error(`Failed to read CA config file: ${filePath}`);
		}
	}

	async generateCertificates(): Promise<void> {
		this.validate();

		const caConfig = await this.generateCA('ca');
		const tlsCAConfig = await this.generateCA('tlsca');
		// const tlsCertConfig = await this.generateTLSCert(tlsCAConfig);

		const caConfigToSave: CAConfig = {
			caCert: caConfig.cert,
			caKey: caConfig.key,
			caName: this.config.name,
			tlsCACert: tlsCAConfig.cert,
			tlsCAKey: tlsCAConfig.key,
		};

		await this.saveCAConfig(caConfigToSave);
	}

	private async generateCA(commonName: string): Promise<{ cert: string; key: string }> {
		const caConfig = {
			CN: commonName,
			key: {
				algo: 'ecdsa',
				size: 256
			},
			names: [
				{
					O: this.config.organization,
					C: this.config.country,
					L: this.config.locality,
					OU: this.config.organizationalUnit,
					ST: this.config.streetAddress
				}
			],
			ca: {
				expiry: '87600h'
			}
		};

		const caConfigPath = path.join(os.tmpdir(), `${commonName}-config.json`);
		await fs.writeFile(caConfigPath, JSON.stringify(caConfig));

		const outputDir = path.join(os.tmpdir(), commonName);
		await fs.mkdir(outputDir, { recursive: true });

		execSync(`cfssl gencert -initca ${caConfigPath} | cfssljson -bare ${path.join(outputDir, commonName)}`, {
			stdio: 'pipe'
		});

		const cert = await fs.readFile(path.join(outputDir, `${commonName}.pem`), 'utf8');
		const key = await fs.readFile(path.join(outputDir, `${commonName}-key.pem`), 'utf8');

		return { cert, key };
	}

	private validate(): void {
		if (this.config.hosts.length === 0) {
			throw new Error('Hosts must be specified');
		}
		if (!this.config.name) {
			throw new Error('Name must be specified');
		}
	}

	private async saveCAConfig(caConfig: CAConfig): Promise<void> {
		const homeDir = os.homedir();
		const dirPath = this.config.outputDir || path.join(homeDir, `.fabriclaunch/cas/${this.config.name}`);
		const filePath = path.join(dirPath, 'config.json');

		try {
			await fs.mkdir(dirPath, { recursive: true });
			await fs.writeFile(filePath, JSON.stringify(caConfig, null, 2));
		} catch (error) {
			console.error(`Failed to save CA config:`, error);
			throw error;
		}
	}
}
