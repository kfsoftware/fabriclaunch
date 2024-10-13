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
	renewCertificate(nodeId: string, type: "tls" | "sign"): Promise<Certificate>;
	getAdminCert(): Promise<Certificate>;
	prepareAdminCertMSP(adminMspPath: string): Promise<void>;
	getAdminTLSCert(): Promise<Certificate>;
}
export interface CertificateInfo {
	subject: {
		common_name: string;
		organization: string;
		organizational_unit: string;
		names: string[];
	};
	issuer: {
		common_name: string;
		country: string;
		organization: string;
		organizational_unit: string;
		locality: string;
		province: string;
		names: string[];
	};
	serial_number: string;
	sans: string[];
	not_before: string;
	not_after: string;
	sigalg: string;
	authority_key_id: string;
	subject_key_id: string;
	pem: string;
}
