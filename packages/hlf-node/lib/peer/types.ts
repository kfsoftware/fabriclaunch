// create peer in HLF

import { Subprocess } from "bun";

// steps
// 1. Provision certs from CA
// 2. Provision folders or volumes if using Docker
// 3. Run peer

export interface StartPeerOpts {
	id: string;
	listenAddress: string;
	chaincodeAddress: string;
	eventsAddress: string;
	operationsListenAddress: string;
	externalEndpoint: string;
	domainNames?: string[];
}
export interface PeerConfig {
	mode: 'cmd' | 'systemd' | 'docker';
	listenAddress: string;
	chaincodeAddress: string;
	eventsAddress: string;
	operationsListenAddress: string;
	externalEndpoint: string;
	signCert: string;
	signCACert: string;
	signKey: string;
	peerName: string;
	tlsCert: string;
	tlsCACert: string;
	tlsKey: string;
}

export type PeerType = 'local' | 'docker';
export interface IPeer {
	mspId: string;
	type: PeerType;
	start(): Promise<Subprocess>;
}
