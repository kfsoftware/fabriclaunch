// types of org: local, vault, hsm

export type OrgType = 'local' | 'vault';
export interface Certificate {
	pk: string;
	cert: string;
	caCert: string;
}
export interface CertificateOpts {
	dnsNames: string[];
	organizationUnit: string;
	organization: string;
	ipAddresses: string[];
}
export interface IOrg {
	mspId: string;
	type: OrgType;
	init(): Promise<void>;
	getCertificateForNode(nodeId: string, opts: CertificateOpts, type: "tls" | "sign"): Promise<Certificate>;
}
