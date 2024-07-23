import type { LocalOrg } from "@repo/hlf-node";
import { $ } from "bun";
import fs from "fs/promises";
import { createTempFileSync } from "./file";
const getDiscoverConfigPathForOrg = async (localOrg: LocalOrg) => {
	const adminCert = await localOrg.getAdminCert()

	const { path: signCertPath } = createTempFileSync()
	const { path: signKeyPath } = createTempFileSync()
	const { path: tlsCAPath } = createTempFileSync()
	const caConfig = await localOrg.getCAConfig()
	await fs.writeFile(signCertPath, adminCert.cert)
	await fs.writeFile(signKeyPath, adminCert.pk)
	await fs.writeFile(tlsCAPath, caConfig.tlsCACert)

	const discoverConfigYaml = `
version: 0
tlsconfig:
  certpath: ""
  keypath: ""
  peercacertpath: ${tlsCAPath}
  timeout: 0s
signerconfig:
  mspid: ${localOrg.mspId}
  identitypath: ${signCertPath}
  keypath: ${signKeyPath}
`
	const { path: discoverConfigPath } = createTempFileSync()
	await fs.writeFile(discoverConfigPath, discoverConfigYaml)
	return discoverConfigPath
}

interface ChannelConfigDiscover {
	msps: {
		[key: string]: MSP;
	};
	orderers: {
		[key: string]: Orderer;
	};
}

interface MSP {
	name: string;
	root_certs: string[];
	intermediate_certs?: string[];
	admins: string[];
	crypto_config: CryptoConfig;
	tls_root_certs?: string[];
	fabric_node_ous?: FabricNodeOUs;
}

interface CryptoConfig {
	signature_hash_family: string;
	identity_identifier_hash_function: string;
}

interface FabricNodeOUs {
	enable: boolean;
	client_ou_identifier: OUIdentifier;
	peer_ou_identifier: OUIdentifier;
}

interface OUIdentifier {
	certificate: string;
	organizational_unit_identifier: string;
}

interface Orderer {
	endpoint: EndpointInfo[];
}

interface EndpointInfo {
	host: string;
	port: number;
}

export const discoverChannelConfig = async (localOrg: LocalOrg, channelId: string, peerAddress: string): Promise<ChannelConfigDiscover> => {
	const discoverConfigPath = await getDiscoverConfigPathForOrg(localOrg)
	const res = $`discover --configFile ${discoverConfigPath} config --channel ${channelId} --server ${peerAddress}`
	return res.json() as unknown as ChannelConfigDiscover
}

interface Peer {
	MSPID: string;
	LedgerHeight: number;
	Endpoint: string;
	Identity: string;
	Chaincodes: string[] | null;
}

interface PeerList extends Array<Peer> { }

export function getOnePeerPerOrg(peerList: PeerList): Peer[] {
	const orgMap = new Map<string, Peer>();

	for (const peer of peerList) {
		if (!orgMap.has(peer.MSPID) || peer.LedgerHeight > orgMap.get(peer.MSPID)!.LedgerHeight) {
			orgMap.set(peer.MSPID, peer);
		}
	}

	return Array.from(orgMap.values());
}
export const discoverPeersConfig = async (localOrg: LocalOrg, channelId: string, peerAddress: string): Promise<PeerList> => {
	const discoverConfigPath = await getDiscoverConfigPathForOrg(localOrg)
	const res = $`discover --configFile ${discoverConfigPath} peers --channel ${channelId} --server ${peerAddress}`
	return res.json() as unknown as PeerList
}
