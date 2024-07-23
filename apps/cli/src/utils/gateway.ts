import { signers, type ConnectOptions, type Identity, type Signer } from '@hyperledger/fabric-gateway'

import * as grpc from '@grpc/grpc-js'
import * as crypto from 'crypto'

export function newGrpcConnection(peerEndpoint: string, tlsRootCert: Buffer): grpc.Client {
	const tlsCredentials = grpc.credentials.createSsl(tlsRootCert)
	return new grpc.Client(peerEndpoint, tlsCredentials, {})
}

export async function newConnectOptions(
	client: grpc.Client,
	mspId: string,
	credentials: Uint8Array,
	privateKeyPem: string
): Promise<ConnectOptions> {
	return {
		client,
		identity: await newIdentity(mspId, credentials),
		signer: await newSigner(privateKeyPem),
		// Default timeouts for different gRPC calls
		evaluateOptions: () => {
			return { deadline: Date.now() + 5000 }; // 5 seconds
		},
		endorseOptions: () => {
			return { deadline: Date.now() + 15000 }; // 15 seconds
		},
		submitOptions: () => {
			return { deadline: Date.now() + 5000 }; // 5 seconds
		},
		commitStatusOptions: () => {
			return { deadline: Date.now() + 60000 }; // 1 minute
		},
	};
}

export async function newIdentity(mspId: string, credentials: Uint8Array): Promise<Identity> {
	return { mspId, credentials }
}

export async function newSigner(privateKeyPem: string): Promise<Signer> {
	const privateKey = crypto.createPrivateKey(privateKeyPem)
	return signers.newPrivateKeySigner(privateKey)
}
