// create chaincode in HLF

import { Subprocess } from "bun";

// steps
// 1. Provision certs from CA
// 2. Provision folders or volumes if using Docker
// 3. Run peer

export interface StartChaincodeOpts {
	chaincodeName: string
	channelName: string
	chaincodePath: string
	chaincodeAddress: string
	packageId: string
}

export type ChaincodeType = 'local';
export interface IChaincode {
	mspId: string;
	start(): Promise<Subprocess>;
}
