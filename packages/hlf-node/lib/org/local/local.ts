import { execSync } from 'child_process';
import * as EC from "elliptic";
import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { Certificate, CertificateOpts, IOrg, OrgType } from '../types';
import { OrgCertificateGenerator } from './certGen';
const ec = new EC.ec("p256")

export class LocalOrg implements IOrg {
	type: OrgType = 'vault';
	private readonly generator: OrgCertificateGenerator;

	constructor(public mspId: string) {
		this.generator = new OrgCertificateGenerator({
			organization: mspId,
			country: 'ES',
			locality: 'Alicante',
			organizationalUnit: 'Tech',
			streetAddress: 'Alicante',
			name: this.mspId,
			hosts: ['localhost', '127.0.0.1'],
		});
	}
	async delete() {
		const homeDir = os.homedir();
		const orgPath = path.join(homeDir, `.fabriclaunch/nodes/${this.mspId}`);
		await fs.rm(orgPath, { recursive: true });
		const filePath = path.join(homeDir, `.fabriclaunch/cas/${this.mspId}/config.json`);
		await fs.rm(filePath, { recursive: true });

		// delete peers
		const peerPath = path.join(homeDir, `.fabriclaunch/peers/${this.mspId}`);
		await fs.rm(peerPath, { recursive: true });

		// delete orderers
		const ordererPath = path.join(homeDir, `.fabriclaunch/orderers/${this.mspId}`);
		await fs.rm(ordererPath, { recursive: true });
		
	}
	async getCAConfig() {
		const caConfig = await this.generator.readCAConfig();
		return caConfig;
	}

	async init(): Promise<void> {
		// check if CA config exists
		try {
			await this.getCAConfig();
			return
		} catch (error) {
			// create org
		}
		try {
			await this.generator.generateCertificates();
		} catch (error) {
			throw error;
		}
	}
	async signDataAsAdmin(data: Buffer): Promise<{
		cert: string;
		signature: string;
	}> {
		const adminCerts = await this.getAdminCert();
		const keyPair = ec.keyFromPrivate(adminCerts.pk)
		const signature = keyPair.sign(data)
		return {
			cert: adminCerts.cert,
			signature: signature.toDER("hex")
		}
	}
	getAdminCert(): Promise<Certificate> {
		return this.getCertificateForNode('admin', {
			dnsNames: [],
			ipAddresses: [],
			organizationUnit: 'admin',
			organization: this.mspId,
		}, 'sign')
	}
	getAdminTLSCert(): Promise<Certificate> {
		return this.getCertificateForNode('admin', {
			dnsNames: [],
			ipAddresses: [],
			organizationUnit: 'admin',
			organization: this.mspId,
		}, 'tls')
	}

	async getCertificateForNode(nodeId: string, opts: CertificateOpts, type: 'tls' | 'sign'): Promise<Certificate> {
		const certPath = this.getCertificatePath(nodeId, type);

		try {
			const existingCert = await this.readCertificateFromDisk(certPath);
			return existingCert;
		} catch (error) {
			// console.log(chalk.blue(`Certificate not found for ${nodeId} (${type}). Generating new certificate.`));
		}

		const caConfig = await this.generator.readCAConfig();
		let caCert: string;
		let caKey: string;

		if (type === 'tls') {
			caCert = caConfig.tlsCACert;
			caKey = caConfig.tlsCAKey;
		} else if (type === 'sign') {
			caCert = caConfig.caCert;
			caKey = caConfig.caKey;
		} else {
			throw new Error('Invalid certificate type');
		}

		const certificate = await this.generateCertificate(
			{
				commonName: nodeId,
				hosts: [...opts.dnsNames, ...opts.ipAddresses],
				organizationUnit: opts.organizationUnit,
				organization: opts.organization,
			},
			type,
			caCert,
			caKey
		);

		await this.saveCertificateToDisk(certPath, certificate);

		return certificate;
	}

	private getCertificatePath(nodeId: string, type: 'tls' | 'sign'): string {
		const homeDir = os.homedir();
		return path.join(homeDir, `.fabriclaunch/nodes/${this.mspId}/${nodeId}/${type}`);
	}

	private async readCertificateFromDisk(certPath: string): Promise<Certificate> {
		const cert = await fs.readFile(path.join(certPath, 'cert.pem'), 'utf8');
		const key = await fs.readFile(path.join(certPath, 'key.pem'), 'utf8');
		const caCert = await fs.readFile(path.join(certPath, 'ca.pem'), 'utf8');

		return { cert, pk: key, caCert };
	}

	private async saveCertificateToDisk(certPath: string, certificate: Certificate): Promise<void> {
		try {
			await fs.mkdir(certPath, { recursive: true });

			await fs.writeFile(path.join(certPath, 'cert.pem'), certificate.cert);
			await fs.writeFile(path.join(certPath, 'key.pem'), certificate.pk);
			await fs.writeFile(path.join(certPath, 'ca.pem'), certificate.caCert);
		} catch (error) {
			console.error(`Failed to save certificate:`, error);
			throw error;
		}
	}

	private async generateCertificate(
		options: {
			commonName: string;
			hosts: string[];
			organizationUnit: string;
			organization: string;
		},
		profile: "tls" | "sign",
		caCert: string,
		caKey: string
	): Promise<Certificate> {
		const tmpDir = os.tmpdir();
		const caCertPath = path.join(tmpDir, 'ca.pem');
		const caKeyPath = path.join(tmpDir, 'ca-key.pem');
		await fs.writeFile(caCertPath, caCert);
		await fs.writeFile(caKeyPath, caKey);

		const outputDir = path.join(tmpDir, 'cert');
		await fs.mkdir(outputDir, { recursive: true });

		// Create a temporary cert-signing-config.json
		const certSigningConfig = {
			signing: {
				default: {
					expiry: "8760h"
				},
				profiles: {
					"sign": {
						"usages": [
							"signing",
							"key encipherment",
							"cert sign",
							"digital signature"
						],
						"expiry": "175200h"
					},
					"tls": {
						"usages": [
							"signing",
							"key encipherment",
							"server auth",
							"client auth"
						],
						"expiry": "175200h"
					}
				}
			}
		};
		const certSigningConfigPath = path.join(tmpDir, 'cert-signing-config.json');
		await fs.writeFile(certSigningConfigPath, JSON.stringify(certSigningConfig));

		// Create a temporary CSR JSON file
		const csrJson = {
			CN: options.commonName,
			hosts: options.hosts,
			names: [
				{
					O: options.organization,
					OU: options.organizationUnit
				}
			],
			key: {
				algo: "ecdsa",
				size: 256
			}
		};
		const csrJsonPath = path.join(tmpDir, 'csr.json');
		await fs.writeFile(csrJsonPath, JSON.stringify(csrJson));

		const hostsArg = [
			...options.hosts,

		].join(',');
		const command = `cfssl gencert \
			-ca=${caCertPath} \
			-ca-key=${caKeyPath} \
			-config=${certSigningConfigPath} \
			-cn="${options.commonName}" \
			-hostname="${hostsArg}" \
			-profile="${profile}" \
			${csrJsonPath} | cfssljson -bare ${path.join(outputDir, 'client')}`;
		execSync(command, { stdio: 'ignore' });

		const generatedCert = await fs.readFile(path.join(outputDir, 'client.pem'), 'utf8');
		const generatedKey = await fs.readFile(path.join(outputDir, 'client-key.pem'), 'utf8');

		// Clean up temporary files
		await fs.unlink(caCertPath);
		await fs.unlink(caKeyPath);
		await fs.unlink(certSigningConfigPath);
		await fs.unlink(csrJsonPath);

		return {
			cert: generatedCert,
			pk: generatedKey,
			caCert: caCert
		};
	}


}
