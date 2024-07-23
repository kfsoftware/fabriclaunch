import { Certificate, CertificateOpts, IOrg, OrgType } from "./types";

export class VaultOrg implements IOrg {
	type: OrgType = 'vault';
	constructor(
		public mspId: string,
		private vaultAddress: string,
		private readonly vaultToken: string,
		private readonly secretPath: string,
		private readonly transitPath: string,
	) { }
	getCertificateForNode(nodeId: string, opts: CertificateOpts, type: "tls" | "sign"): Promise<Certificate> {
		throw new Error("Method not implemented.");
	}
	init(): Promise<void> {
		throw new Error("Method not implemented.");
	}
	registerUser(username: string, password: string): Promise<void> {
		throw new Error("Method not implemented.");
	}
	enrollUser(username: string, password: string): Promise<void> {
		throw new Error("Method not implemented.");
	}

}