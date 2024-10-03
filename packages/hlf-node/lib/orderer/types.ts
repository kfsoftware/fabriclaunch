import { Subprocess } from "bun";

// create orderer in HLF
export interface StartOrdererOpts {
	id: string;
	listenAddress: string;
	adminAddress: string;
	operationsListenAddress: string;
	externalEndpoint: string;
	domainNames?: string[];
}
export interface IOrderer {
	mspId: string;
	type: OrdererType;
	start(): Promise<Subprocess>;
}
export interface OrdererConfig {
	mode: 'cmd' | 'service' | 'docker';
	listenAddress: string;
	adminAddress: string;
	operationsListenAddress: string;
	externalEndpoint: string;
	signCert: string;
	signCACert: string;
	signKey: string;
	ordererName: string;
	tlsCert: string;
	tlsCACert: string;
	tlsKey: string;
}
// steps
// 1. Provision certs from CA
// 2. Provision folders or volumes if using Docker
// 3. Run orderer

export type OrdererType = 'local' | 'docker';
