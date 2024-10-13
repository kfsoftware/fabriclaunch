import { ShellError, Subprocess } from 'bun'
import chalk from 'chalk'
import * as fs from 'fs/promises'
import { isIP } from 'net'
import os from 'os'
import path from 'path'
import slugify from 'slugify'
import { IOrg } from '../org'
import { PeerConfig, PeerType, StartPeerOpts } from './types'

const configYamlContent = `NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/cacert.pem
    OrganizationalUnitIdentifier: orderer
`

type StartCmdResponse = {
	mode: 'cmd'
	subprocess: Subprocess
}
type StartServiceResponse = {
	mode: 'service'
	type: 'systemd' | 'launchd'
	serviceName: string
}
type StartDockerResponse = {
	mode: 'docker'
	containerName: string
}

export class LocalPeer {
	type: PeerType = 'local'
	constructor(
		public mspId: string,
		private readonly opts: StartPeerOpts,
		private readonly org: IOrg,
		private readonly mode: 'cmd' | 'service' | 'docker'
	) {}

	async joinChannel(opts: { channelName: string; ordererUrl: string; ordererTLSCert: string }): Promise<void> {
		const { channelName, ordererUrl, ordererTLSCert } = opts

		const homeDir = os.homedir()
		const peerDir = path.join(homeDir, `.fabriclaunch/peers/${slugify(this.opts.id)}`)
		const mspConfigPath = path.join(peerDir, 'config')
		const dataConfigPath = path.join(peerDir, 'data')

		// Set environment variables
		const env = {
			...process.env,
			CORE_PEER_LOCALMSPID: this.mspId,
			CORE_PEER_TLS_ROOTCERT_FILE: path.join(mspConfigPath, 'tlscacerts', 'cacert.pem'),
			CORE_PEER_MSPCONFIGPATH: path.join(mspConfigPath, 'msp'),
			ORDERER_CA: ordererTLSCert,
			CORE_PEER_ADDRESS: this.opts.externalEndpoint,
			FABRIC_CFG_PATH: mspConfigPath,
		}

		// Create a temporary file for the config block
		const tmpConfigBlock = path.join(os.tmpdir(), `config_block_${Date.now()}.pb`)

		try {
			// Fetch the channel configuration block
			const fetchConfigCmd = ['peer', 'channel', 'fetch', 'config', tmpConfigBlock, '-o', ordererUrl, '-c', channelName, '--tls', '--cafile', env.ORDERER_CA]

			const fetchConfigProc = Bun.spawn(fetchConfigCmd, {
				env,
				cwd: dataConfigPath,
			})

			const fetchConfigStatus = await fetchConfigProc.exited
			if (fetchConfigStatus !== 0) {
				throw new Error(`Failed to fetch channel config: ${fetchConfigProc.exitCode}`)
			}

			console.log('Successfully fetched channel config')

			// // Join the channel
			// const joinChannelCmd = ['peer', 'channel', 'join', '-b', tmpConfigBlock]

			// const joinChannelProc = Bun.spawn(joinChannelCmd, {
			// 	env,
			// 	cwd: dataConfigPath,
			// })

			// const joinChannelStatus = await joinChannelProc.exited
			// if (joinChannelStatus !== 0) {
			// 	throw new Error(`Failed to join channel with status code ${joinChannelProc.exitCode}`)
			// }

			// console.log(`Successfully joined channel ${channelName}`)
		} finally {
			// Delete the temporary config block file
			try {
				await fs.unlink(tmpConfigBlock)
				console.log('Temporary config block file deleted')
			} catch (error) {
				console.error('Failed to delete temporary config block file:', error)
			}
		}
	}
	async init(): Promise<PeerConfig> {
		const peerId = `${this.opts.id}.${this.org.mspId}`
		// extract dns name for peer
		const chunks = this.opts.externalEndpoint.split(':')
		const dnsName = chunks[0]
		const ipAddresses = [...this.opts.domainNames.filter((s) => isIP(s)), '127.0.0.1']
		const dnsNames = [...this.opts.domainNames.filter((s) => !isIP(s)), dnsName]
		const tlsCerts = await this.org.getCertificateForNode(
			peerId,
			{
				dnsNames,
				ipAddresses,
				organization: this.org.mspId,
				organizationUnit: 'peer',
			},
			'tls'
		)
		const signCerts = await this.org.getCertificateForNode(
			peerId,
			{
				dnsNames: [],
				ipAddresses: [],
				organization: this.org.mspId,
				organizationUnit: 'peer',
			},
			'sign'
		)
		const slugifiedId = slugify(this.opts.id)
		const homeDir = os.homedir()
		// specific path for peerId
		const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`)
		const dataConfigPath = path.join(dirPath, 'data')
		const mspConfigPath = path.join(dirPath, 'config')
		// ensure certificates are written to configPeerPath into respective paths
		// create folders
		await fs.mkdir(dataConfigPath, { recursive: true })
		await fs.mkdir(mspConfigPath, { recursive: true })
		// write certificates only to configPeerPath, check buildPeerEnvironment for paths

		await fs.writeFile(`${mspConfigPath}/tls.crt`, tlsCerts.cert)
		await fs.writeFile(`${mspConfigPath}/tls.key`, tlsCerts.pk)
		// write signcerts/cert.pem but ensure the path is created
		await fs.mkdir(`${mspConfigPath}/signcerts`, { recursive: true })
		await fs.writeFile(`${mspConfigPath}/signcerts/cert.pem`, signCerts.cert)
		await fs.writeFile(`${mspConfigPath}/cacert.pem`, signCerts.caCert)

		// write cacerts/cacert.pem but ensure the path is created
		await fs.mkdir(`${mspConfigPath}/cacerts`, { recursive: true })
		await fs.writeFile(`${mspConfigPath}/cacerts/cacert.pem`, signCerts.caCert)

		// write tlscacerts/cacert.pem but ensure the path is created
		await fs.mkdir(`${mspConfigPath}/tlscacerts`, { recursive: true })
		await fs.writeFile(`${mspConfigPath}/tlscacerts/cacert.pem`, tlsCerts.caCert)

		// write keystore/key.pem for sign private key but ensure the path is created
		await fs.mkdir(`${mspConfigPath}/keystore`, { recursive: true })
		await fs.writeFile(`${mspConfigPath}/keystore/key.pem`, signCerts.pk)
		const rootExternalBuilderPath = path.join(mspConfigPath, 'ccaas')
		const binExternalBuilderPath = path.join(rootExternalBuilderPath, 'bin')
		// mkdirp
		await fs.mkdir(binExternalBuilderPath, { recursive: true })

		const buildBuilderPath = path.join(binExternalBuilderPath, 'build')
		await fs.writeFile(
			buildBuilderPath,
			`#!/bin/bash

SOURCE=$1
OUTPUT=$3

#external chaincodes expect connection.json file in the chaincode package
if [ ! -f "$SOURCE/connection.json" ]; then
    >&2 echo "$SOURCE/connection.json not found"
    exit 1
fi

#simply copy the endpoint information to specified output location
cp $SOURCE/connection.json $OUTPUT/connection.json

if [ -d "$SOURCE/metadata" ]; then
    cp -a $SOURCE/metadata $OUTPUT/metadata
fi

exit 0
`,
			{ encoding: 'utf8' }
		)
		const newLine = '\\n'
		const detectBuilderPath = path.join(binExternalBuilderPath, 'detect')
		await fs.writeFile(
			detectBuilderPath,
			`#!/bin/bash

METADIR=$2
# check if the "type" field is set to "external"
# crude way without jq which is not in the default fabric peer image
TYPE=$(tr -d '${newLine}' < "$METADIR/metadata.json" | awk -F':' '{ for (i = 1; i < NF; i++){ if ($i~/type/) { print $(i+1); break }}}'| cut -d\\" -f2)

if [ "$TYPE" = "ccaas" ]; then
    exit 0
fi

exit 1
        `
		)

		const releaseBuilderPath = path.join(binExternalBuilderPath, 'release')
		await fs.writeFile(
			releaseBuilderPath,
			`#!/bin/bash


BLD="$1"
RELEASE="$2"

if [ -d "$BLD/metadata" ]; then
   cp -a "$BLD/metadata/"* "$RELEASE/"
fi

#external chaincodes expect artifacts to be placed under "$RELEASE"/chaincode/server
if [ -f $BLD/connection.json ]; then
   mkdir -p "$RELEASE"/chaincode/server
   cp $BLD/connection.json "$RELEASE"/chaincode/server

   #if tls_required is true, copy TLS files (using above example, the fully qualified path for these fils would be "$RELEASE"/chaincode/server/tls)

   exit 0
fi

exit 1
`,
			{ encoding: 'utf8' }
		)
		// make build, detect and release executable

		await fs.chmod(buildBuilderPath, 0o755)
		await fs.chmod(detectBuilderPath, 0o755)
		await fs.chmod(releaseBuilderPath, 0o755)

		// write msp config
		await fs.writeFile(`${mspConfigPath}/config.yaml`, configYamlContent)
		// write peer config
		const coreYamlContent = `
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

###############################################################################
#
#    Peer section
#
###############################################################################
peer:

  # The peer id provides a name for this peer instance and is used when
  # naming docker resources.
  id: jdoe

  # The networkId allows for logical separation of networks and is used when
  # naming docker resources.
  networkId: dev

  # The Address at local network interface this Peer will listen on.
  # By default, it will listen on all network interfaces
  listenAddress: 0.0.0.0:7051

  # The endpoint this peer uses to listen for inbound chaincode connections.
  # If this is commented-out, the listen address is selected to be
  # the peer's address (see below) with port 7052
  # chaincodeListenAddress: 0.0.0.0:7052

  # The endpoint the chaincode for this peer uses to connect to the peer.
  # If this is not specified, the chaincodeListenAddress address is selected.
  # And if chaincodeListenAddress is not specified, address is selected from
  # peer address (see below). If specified peer address is invalid then it
  # will fallback to the auto detected IP (local IP) regardless of the peer
  # addressAutoDetect value.
  # chaincodeAddress: 0.0.0.0:7052

  # When used as peer config, this represents the endpoint to other peers
  # in the same organization. For peers in other organization, see
  # gossip.externalEndpoint for more info.
  # When used as CLI config, this means the peer's endpoint to interact with
  address: 0.0.0.0:7051

  # Whether the Peer should programmatically determine its address
  # This case is useful for docker containers.
  # When set to true, will override peer address.
  addressAutoDetect: false

  # Keepalive settings for peer server and clients
  keepalive:
    # Interval is the duration after which if the server does not see
    # any activity from the client it pings the client to see if it's alive
    interval: 7200s
    # Timeout is the duration the server waits for a response
    # from the client after sending a ping before closing the connection
    timeout: 20s
    # MinInterval is the minimum permitted time between client pings.
    # If clients send pings more frequently, the peer server will
    # disconnect them
    minInterval: 60s
    # Client keepalive settings for communicating with other peer nodes
    client:
      # Interval is the time between pings to peer nodes.  This must
      # greater than or equal to the minInterval specified by peer
      # nodes
      interval: 60s
      # Timeout is the duration the client waits for a response from
      # peer nodes before closing the connection
      timeout: 20s
    # DeliveryClient keepalive settings for communication with ordering
    # nodes.
    deliveryClient:
      # Interval is the time between pings to ordering nodes.  This must
      # greater than or equal to the minInterval specified by ordering
      # nodes.
      interval: 60s
      # Timeout is the duration the client waits for a response from
      # ordering nodes before closing the connection
      timeout: 20s


  # Gossip related configuration
  gossip:
    # Bootstrap set to initialize gossip with.
    # This is a list of other peers that this peer reaches out to at startup.
    # Important: The endpoints here have to be endpoints of peers in the same
    # organization, because the peer would refuse connecting to these endpoints
    # unless they are in the same organization as the peer.
    bootstrap: 127.0.0.1:7051

    # NOTE: orgLeader and useLeaderElection parameters are mutual exclusive.
    # Setting both to true would result in the termination of the peer
    # since this is undefined state. If the peers are configured with
    # useLeaderElection=false, make sure there is at least 1 peer in the
    # organization that its orgLeader is set to true.

    # Defines whenever peer will initialize dynamic algorithm for
    # "leader" selection, where leader is the peer to establish
    # connection with ordering service and use delivery protocol
    # to pull ledger blocks from ordering service.
    useLeaderElection: false
    # Statically defines peer to be an organization "leader",
    # where this means that current peer will maintain connection
    # with ordering service and disseminate block across peers in
    # its own organization. Multiple peers or all peers in an organization
    # may be configured as org leaders, so that they all pull
    # blocks directly from ordering service.
    orgLeader: true

    # Interval for membershipTracker polling
    membershipTrackerInterval: 5s

    # Overrides the endpoint that the peer publishes to peers
    # in its organization. For peers in foreign organizations
    # see 'externalEndpoint'
    endpoint:
    # Maximum count of blocks stored in memory
    maxBlockCountToStore: 10
    # Max time between consecutive message pushes(unit: millisecond)
    maxPropagationBurstLatency: 10ms
    # Max number of messages stored until a push is triggered to remote peers
    maxPropagationBurstSize: 10
    # Number of times a message is pushed to remote peers
    propagateIterations: 1
    # Number of peers selected to push messages to
    propagatePeerNum: 3
    # Determines frequency of pull phases(unit: second)
    # Must be greater than digestWaitTime + responseWaitTime
    pullInterval: 4s
    # Number of peers to pull from
    pullPeerNum: 3
    # Determines frequency of pulling state info messages from peers(unit: second)
    requestStateInfoInterval: 4s
    # Determines frequency of pushing state info messages to peers(unit: second)
    publishStateInfoInterval: 4s
    # Maximum time a stateInfo message is kept until expired
    stateInfoRetentionInterval:
    # Time from startup certificates are included in Alive messages(unit: second)
    publishCertPeriod: 10s
    # Should we skip verifying block messages or not (currently not in use)
    skipBlockVerification: false
    # Dial timeout(unit: second)
    dialTimeout: 3s
    # Connection timeout(unit: second)
    connTimeout: 2s
    # Buffer size of received messages
    recvBuffSize: 20
    # Buffer size of sending messages
    sendBuffSize: 200
    # Time to wait before pull engine processes incoming digests (unit: second)
    # Should be slightly smaller than requestWaitTime
    digestWaitTime: 1s
    # Time to wait before pull engine removes incoming nonce (unit: milliseconds)
    # Should be slightly bigger than digestWaitTime
    requestWaitTime: 1500ms
    # Time to wait before pull engine ends pull (unit: second)
    responseWaitTime: 2s
    # Alive check interval(unit: second)
    aliveTimeInterval: 5s
    # Alive expiration timeout(unit: second)
    aliveExpirationTimeout: 25s
    # Reconnect interval(unit: second)
    reconnectInterval: 25s
    # Max number of attempts to connect to a peer
    maxConnectionAttempts: 120
    # Message expiration factor for alive messages
    msgExpirationFactor: 20
    # This is an endpoint that is published to peers outside of the organization.
    # If this isn't set, the peer will not be known to other organizations.
    externalEndpoint:
    # Leader election service configuration
    election:
      # Longest time peer waits for stable membership during leader election startup (unit: second)
      startupGracePeriod: 15s
      # Interval gossip membership samples to check its stability (unit: second)
      membershipSampleInterval: 1s
      # Time passes since last declaration message before peer decides to perform leader election (unit: second)
      leaderAliveThreshold: 10s
      # Time between peer sends propose message and declares itself as a leader (sends declaration message) (unit: second)
      leaderElectionDuration: 5s

    pvtData:
      # pullRetryThreshold determines the maximum duration of time private data corresponding for a given block
      # would be attempted to be pulled from peers until the block would be committed without the private data
      pullRetryThreshold: 60s
      # As private data enters the transient store, it is associated with the peer's ledger's height at that time.
      # transientstoreMaxBlockRetention defines the maximum difference between the current ledger's height upon commit,
      # and the private data residing inside the transient store that is guaranteed not to be purged.
      # Private data is purged from the transient store when blocks with sequences that are multiples
      # of transientstoreMaxBlockRetention are committed.
      transientstoreMaxBlockRetention: 1000
      # pushAckTimeout is the maximum time to wait for an acknowledgement from each peer
      # at private data push at endorsement time.
      pushAckTimeout: 3s
      # Block to live pulling margin, used as a buffer
      # to prevent peer from trying to pull private data
      # from peers that is soon to be purged in next N blocks.
      # This helps a newly joined peer catch up to current
      # blockchain height quicker.
      btlPullMargin: 10
      # the process of reconciliation is done in an endless loop, while in each iteration reconciler tries to
      # pull from the other peers the most recent missing blocks with a maximum batch size limitation.
      # reconcileBatchSize determines the maximum batch size of missing private data that will be reconciled in a
      # single iteration.
      reconcileBatchSize: 10
      # reconcileSleepInterval determines the time reconciler sleeps from end of an iteration until the beginning
      # of the next reconciliation iteration.
      reconcileSleepInterval: 1m
      # reconciliationEnabled is a flag that indicates whether private data reconciliation is enable or not.
      reconciliationEnabled: true
      # skipPullingInvalidTransactionsDuringCommit is a flag that indicates whether pulling of invalid
      # transaction's private data from other peers need to be skipped during the commit time and pulled
      # only through reconciler.
      skipPullingInvalidTransactionsDuringCommit: false
      # implicitCollectionDisseminationPolicy specifies the dissemination  policy for the peer's own implicit collection.
      # When a peer endorses a proposal that writes to its own implicit collection, below values override the default values
      # for disseminating private data.
      # Note that it is applicable to all channels the peer has joined. The implication is that requiredPeerCount has to
      # be smaller than the number of peers in a channel that has the lowest numbers of peers from the organization.
      implicitCollectionDisseminationPolicy:
        # requiredPeerCount defines the minimum number of eligible peers to which the peer must successfully
        # disseminate private data for its own implicit collection during endorsement. Default value is 0.
        requiredPeerCount: 0
        # maxPeerCount defines the maximum number of eligible peers to which the peer will attempt to
        # disseminate private data for its own implicit collection during endorsement. Default value is 1.
        maxPeerCount: 1

    # Gossip state transfer related configuration
    state:
      # indicates whenever state transfer is enabled or not
      # default value is true, i.e. state transfer is active
      # and takes care to sync up missing blocks allowing
      # lagging peer to catch up to speed with rest network
      enabled: false
      # checkInterval interval to check whether peer is lagging behind enough to
      # request blocks via state transfer from another peer.
      checkInterval: 10s
      # responseTimeout amount of time to wait for state transfer response from
      # other peers
      responseTimeout: 3s
      # batchSize the number of blocks to request via state transfer from another peer
      batchSize: 10
      # blockBufferSize reflects the size of the re-ordering buffer
      # which captures blocks and takes care to deliver them in order
      # down to the ledger layer. The actual buffer size is bounded between
      # 0 and 2*blockBufferSize, each channel maintains its own buffer
      blockBufferSize: 20
      # maxRetries maximum number of re-tries to ask
      # for single state transfer request
      maxRetries: 3

  # TLS Settings
  tls:
    # Require server-side TLS
    enabled:  false
    # Require client certificates / mutual TLS.
    # Note that clients that are not configured to use a certificate will
    # fail to connect to the peer.
    clientAuthRequired: false
    # X.509 certificate used for TLS server
    cert:
      file: tls/server.crt
    # Private key used for TLS server (and client if clientAuthEnabled
    # is set to true
    key:
      file: tls/server.key
    # Trusted root certificate chain for tls.cert
    rootcert:
      file: tls/ca.crt
    # Set of root certificate authorities used to verify client certificates
    clientRootCAs:
      files:
        - tls/ca.crt
    # Private key used for TLS when making client connections.  If
    # not set, peer.tls.key.file will be used instead
    clientKey:
      file:
    # X.509 certificate used for TLS when making client connections.
    # If not set, peer.tls.cert.file will be used instead
    clientCert:
      file:

  # Authentication contains configuration parameters related to authenticating
  # client messages
  authentication:
    # the acceptable difference between the current server time and the
    # client's time as specified in a client request message
    timewindow: 15m

  # Path on the file system where peer will store data (eg ledger). This
  # location must be access control protected to prevent unintended
  # modification that might corrupt the peer operations.
  fileSystemPath: ${dataConfigPath}

  # BCCSP (Blockchain crypto provider): Select which crypto implementation or
  # library to use
  BCCSP:
    Default: SW
    # Settings for the SW crypto provider (i.e. when DEFAULT: SW)
    SW:
      # TODO: The default Hash and Security level needs refactoring to be
      # fully configurable. Changing these defaults requires coordination
      # SHA2 is hardcoded in several places, not only BCCSP
      Hash: SHA2
      Security: 256
      # Location of Key Store
      FileKeyStore:
        # If "", defaults to 'mspConfigPath'/keystore
        KeyStore:
    # Settings for the PKCS#11 crypto provider (i.e. when DEFAULT: PKCS11)
    PKCS11:
      # Location of the PKCS11 module library
      Library:
      # Token Label
      Label:
      # User PIN
      Pin:
      Hash:
      Security:

  # Path on the file system where peer will find MSP local configurations
  mspConfigPath: msp

  # Identifier of the local MSP
  # ----!!!!IMPORTANT!!!-!!!IMPORTANT!!!-!!!IMPORTANT!!!!----
  # Deployers need to change the value of the localMspId string.
  # In particular, the name of the local MSP ID of a peer needs
  # to match the name of one of the MSPs in each of the channel
  # that this peer is a member of. Otherwise this peer's messages
  # will not be identified as valid by other nodes.
  localMspId: SampleOrg

  # CLI common client config options
  client:
    # connection timeout
    connTimeout: 3s

  # Delivery service related config
  deliveryclient:
    # It sets the total time the delivery service may spend in reconnection
    # attempts until its retry logic gives up and returns an error
    reconnectTotalTimeThreshold: 3600s

    # It sets the delivery service <-> ordering service node connection timeout
    connTimeout: 3s

    # It sets the delivery service maximal delay between consecutive retries
    reConnectBackoffThreshold: 3600s

    # A list of orderer endpoint addresses which should be overridden
    # when found in channel configurations.
    addressOverrides:
    #  - from:
    #    to:
    #    caCertsFile:
    #  - from:
    #    to:
    #    caCertsFile:

  # Type for the local MSP - by default it's of type bccsp
  localMspType: bccsp

  # Used with Go profiling tools only in none production environment. In
  # production, it should be disabled (eg enabled: false)
  profile:
    enabled:     false
    listenAddress: 0.0.0.0:6060

  # Handlers defines custom handlers that can filter and mutate
  # objects passing within the peer, such as:
  #   Auth filter - reject or forward proposals from clients
  #   Decorators  - append or mutate the chaincode input passed to the chaincode
  #   Endorsers   - Custom signing over proposal response payload and its mutation
  # Valid handler definition contains:
  #   - A name which is a factory method name defined in
  #     core/handlers/library/library.go for statically compiled handlers
  #   - library path to shared object binary for pluggable filters
  # Auth filters and decorators are chained and executed in the order that
  # they are defined. For example:
  # authFilters:
  #   -
  #     name: FilterOne
  #     library: /opt/lib/filter.so
  #   -
  #     name: FilterTwo
  # decorators:
  #   -
  #     name: DecoratorOne
  #   -
  #     name: DecoratorTwo
  #     library: /opt/lib/decorator.so
  # Endorsers are configured as a map that its keys are the endorsement system chaincodes that are being overridden.
  # Below is an example that overrides the default ESCC and uses an endorsement plugin that has the same functionality
  # as the default ESCC.
  # If the 'library' property is missing, the name is used as the constructor method in the builtin library similar
  # to auth filters and decorators.
  # endorsers:
  #   escc:
  #     name: DefaultESCC
  #     library: /etc/hyperledger/fabric/plugin/escc.so
  handlers:
    authFilters:
      -
        name: DefaultAuth
      -
        name: ExpirationCheck    # This filter checks identity x509 certificate expiration
    decorators:
      -
        name: DefaultDecorator
    endorsers:
      escc:
        name: DefaultEndorsement
        library:
    validators:
      vscc:
        name: DefaultValidation
        library:

  #    library: /etc/hyperledger/fabric/plugin/escc.so
  # Number of goroutines that will execute transaction validation in parallel.
  # By default, the peer chooses the number of CPUs on the machine. Set this
  # variable to override that choice.
  # NOTE: overriding this value might negatively influence the performance of
  # the peer so please change this value only if you know what you're doing
  validatorPoolSize:

  # The discovery service is used by clients to query information about peers,
  # such as - which peers have joined a certain channel, what is the latest
  # channel config, and most importantly - given a chaincode and a channel,
  # what possible sets of peers satisfy the endorsement policy.
  discovery:
    enabled: true
    # Whether the authentication cache is enabled or not.
    authCacheEnabled: true
    # The maximum size of the cache, after which a purge takes place
    authCacheMaxSize: 1000
    # The proportion (0 to 1) of entries that remain in the cache after the cache is purged due to overpopulation
    authCachePurgeRetentionRatio: 0.75
    # Whether to allow non-admins to perform non channel scoped queries.
    # When this is false, it means that only peer admins can perform non channel scoped queries.
    orgMembersAllowedAccess: false

  # Limits is used to configure some internal resource limits.
  limits:
    # Concurrency limits the number of concurrently running requests to a service on each peer.
    # Currently this option is only applied to endorser service and deliver service.
    # When the property is missing or the value is 0, the concurrency limit is disabled for the service.
    concurrency:
      # endorserService limits concurrent requests to endorser service that handles chaincode deployment, query and invocation,
      # including both user chaincodes and system chaincodes.
      endorserService: 2500
      # deliverService limits concurrent event listeners registered to deliver service for blocks and transaction events.
      deliverService: 2500

###############################################################################
#
#    VM section
#
###############################################################################
vm:

  # Endpoint of the vm management system.  For docker can be one of the following in general
  # unix:///var/run/docker.sock
  # http://localhost:2375
  # https://localhost:2376
  endpoint: ""

  # settings for docker vms
  docker:
    tls:
      enabled: false
      ca:
        file: docker/ca.crt
      cert:
        file: docker/tls.crt
      key:
        file: docker/tls.key

    # Enables/disables the standard out/err from chaincode containers for
    # debugging purposes
    attachStdout: false

    # Parameters on creating docker container.
    # Container may be efficiently created using ipam & dns-server for cluster
    # NetworkMode - sets the networking mode for the container. Supported
    # Dns - a list of DNS servers for the container to use.
    # Docker Host Config are not supported and will not be used if set.
    # LogConfig - sets the logging driver (Type) and related options
    # (Config) for Docker. For more info,
    # https://docs.docker.com/engine/admin/logging/overview/
    # Note: Set LogConfig using Environment Variables is not supported.
    hostConfig:
      NetworkMode: host
      Dns:
      # - 192.168.0.1
      LogConfig:
        Type: json-file
        Config:
          max-size: "50m"
          max-file: "5"
      Memory: 2147483648

###############################################################################
#
#    Chaincode section
#
###############################################################################
chaincode:

  # The id is used by the Chaincode stub to register the executing Chaincode
  # ID with the Peer and is generally supplied through ENV variables
  id:
    path:
    name:

  # Generic builder environment, suitable for most chaincode types
  builder: $(DOCKER_NS)/fabric-ccenv:$(TWO_DIGIT_VERSION)

  pull: false

  golang:
    # golang will never need more than baseos
    runtime: $(DOCKER_NS)/fabric-baseos:$(TWO_DIGIT_VERSION)

    # whether or not golang chaincode should be linked dynamically
    dynamicLink: false

  java:
    # This is an image based on java:openjdk-8 with addition compiler
    # tools added for java shim layer packaging.
    # This image is packed with shim layer libraries that are necessary
    # for Java chaincode runtime.
    runtime: $(DOCKER_NS)/fabric-javaenv:$(TWO_DIGIT_VERSION)

  node:
    # This is an image based on node:$(NODE_VER)-alpine
    runtime: $(DOCKER_NS)/fabric-nodeenv:$(TWO_DIGIT_VERSION)

  # List of directories to treat as external builders and launchers for
  # chaincode. The external builder detection processing will iterate over the
  # builders in the order specified below.
  externalBuilders:
    - name: ccaas_builder
      path: ${rootExternalBuilderPath}
  # The maximum duration to wait for the chaincode build and install process
  # to complete.
  installTimeout: 8m0s

  # Timeout duration for starting up a container and waiting for Register
  # to come through.
  startuptimeout: 5m0s

  # Timeout duration for Invoke and Init calls to prevent runaway.
  # This timeout is used by all chaincodes in all the channels, including
  # system chaincodes.
  # Note that during Invoke, if the image is not available (e.g. being
  # cleaned up when in development environment), the peer will automatically
  # build the image, which might take more time. In production environment,
  # the chaincode image is unlikely to be deleted, so the timeout could be
  # reduced accordingly.
  executetimeout: 30s

  # There are 2 modes: "dev" and "net".
  # In dev mode, user runs the chaincode after starting peer from
  # command line on local machine.
  # In net mode, peer will run chaincode in a docker container.
  mode: net

  # keepalive in seconds. In situations where the communication goes through a
  # proxy that does not support keep-alive, this parameter will maintain connection
  # between peer and chaincode.
  # A value <= 0 turns keepalive off
  keepalive: 0

  # enabled system chaincodes
  system:
    _lifecycle: enable
    cscc: enable
    lscc: enable
    escc: enable
    vscc: enable
    qscc: enable

  # Logging section for the chaincode container
  logging:
    # Default level for all loggers within the chaincode container
    level:  info
    # Override default level for the 'shim' logger
    shim:   warning
    # Format for the chaincode container logs
    format: '%{color}%{time:2006-01-02 15:04:05.000 MST} [%{module}] %{shortfunc} -> %{level:.4s} %{id:03x}%{color:reset} %{message}'

###############################################################################
#
#    Ledger section - ledger configuration encompasses both the blockchain
#    and the state
#
###############################################################################
ledger:

  blockchain:
  snapshots:
    rootDir: ${dataConfigPath}/snapshots

  state:
    # stateDatabase - options are "goleveldb", "CouchDB"
    # goleveldb - default state database stored in goleveldb.
    # CouchDB - store state database in CouchDB
    stateDatabase: goleveldb
    # Limit on the number of records to return per query
    totalQueryLimit: 100000
    couchDBConfig:
      # It is recommended to run CouchDB on the same server as the peer, and
      # not map the CouchDB container port to a server port in docker-compose.
      # Otherwise proper security must be provided on the connection between
      # CouchDB client (on the peer) and server.
      couchDBAddress: 127.0.0.1:5984
      # This username must have read and write authority on CouchDB
      username:
      # The password is recommended to pass as an environment variable
      # during start up (eg CORE_LEDGER_STATE_COUCHDBCONFIG_PASSWORD).
      # If it is stored here, the file must be access control protected
      # to prevent unintended users from discovering the password.
      password:
      # Number of retries for CouchDB errors
      maxRetries: 3
      # Number of retries for CouchDB errors during peer startup.
      # The delay between retries doubles for each attempt.
      # Default of 10 retries results in 11 attempts over 2 minutes.
      maxRetriesOnStartup: 10
      # CouchDB request timeout (unit: duration, e.g. 20s)
      requestTimeout: 35s
      # Limit on the number of records per each CouchDB query
      # Note that chaincode queries are only bound by totalQueryLimit.
      # Internally the chaincode may execute multiple CouchDB queries,
      # each of size internalQueryLimit.
      internalQueryLimit: 1000
      # Limit on the number of records per CouchDB bulk update batch
      maxBatchUpdateSize: 1000
      # Warm indexes after every N blocks.
      # This option warms any indexes that have been
      # deployed to CouchDB after every N blocks.
      # A value of 1 will warm indexes after every block commit,
      # to ensure fast selector queries.
      # Increasing the value may improve write efficiency of peer and CouchDB,
      # but may degrade query response time.
      warmIndexesAfterNBlocks: 1
      # Create the _global_changes system database
      # This is optional.  Creating the global changes database will require
      # additional system resources to track changes and maintain the database
      createGlobalChangesDB: false
      # CacheSize denotes the maximum mega bytes (MB) to be allocated for the in-memory state
      # cache. Note that CacheSize needs to be a multiple of 32 MB. If it is not a multiple
      # of 32 MB, the peer would round the size to the next multiple of 32 MB.
      # To disable the cache, 0 MB needs to be assigned to the cacheSize.
      cacheSize: 64

  history:
    # enableHistoryDatabase - options are true or false
    # Indicates if the history of key updates should be stored.
    # All history 'index' will be stored in goleveldb, regardless if using
    # CouchDB or alternate database for the state.
    enableHistoryDatabase: true

  pvtdataStore:
    # the maximum db batch size for converting
    # the ineligible missing data entries to eligible missing data entries
    collElgProcMaxDbBatchSize: 5000
    # the minimum duration (in milliseconds) between writing
    # two consecutive db batches for converting the ineligible missing data entries to eligible missing data entries
    collElgProcDbBatchesInterval: 1000

###############################################################################
#
#    Operations section
#
###############################################################################
operations:
  # host and port for the operations server
  listenAddress: 127.0.0.1:9443

  # TLS configuration for the operations endpoint
  tls:
    # TLS enabled
    enabled: false

    # path to PEM encoded server certificate for the operations server
    cert:
      file:

    # path to PEM encoded server key for the operations server
    key:
      file:

    # most operations service endpoints require client authentication when TLS
    # is enabled. clientAuthRequired requires client certificate authentication
    # at the TLS layer to access all resources.
    clientAuthRequired: false

    # paths to PEM encoded ca certificates to trust for client authentication
    clientRootCAs:
      files: []

###############################################################################
#
#    Metrics section
#
###############################################################################
metrics:
  # metrics provider is one of statsd, prometheus, or disabled
  provider: disabled

  # statsd configuration
  statsd:
    # network type: tcp or udp
    network: udp

    # statsd server address
    address: 127.0.0.1:8125

    # the interval at which locally cached counters and gauges are pushed
    # to statsd; timings are pushed immediately
    writeInterval: 10s

    # prefix is prepended to all emitted statsd metrics
    prefix:
`
		await fs.writeFile(`${mspConfigPath}/core.yaml`, coreYamlContent)

		// what about tlscacerts/cacert.pem?
		// ensure directory is created
		await fs.mkdir(`${mspConfigPath}/tlscacerts`, { recursive: true })
		// write tls ca cert
		await fs.writeFile(`${mspConfigPath}/tlscacerts/cacert.pem`, tlsCerts.caCert)
		const peerConfig: PeerConfig = {
			mode: this.mode,
			chaincodeAddress: this.opts.chaincodeAddress,
			eventsAddress: this.opts.eventsAddress,
			listenAddress: this.opts.listenAddress,
			operationsListenAddress: this.opts.operationsListenAddress,
			externalEndpoint: this.opts.externalEndpoint,
			peerName: this.opts.id,
			signCert: signCerts.cert,
			signCACert: signCerts.caCert,
			signKey: signCerts.pk,
			tlsCert: tlsCerts.cert,
			tlsCACert: tlsCerts.caCert,
			tlsKey: tlsCerts.pk,
		}
		const configPath = path.join(homeDir, `.fabriclaunch/nodes/${this.mspId}/${peerId}/config.json`)
		await fs.writeFile(configPath, JSON.stringify(peerConfig))
		return peerConfig
	}
	async stop(): Promise<void> {
		switch (this.mode) {
			case 'cmd': {
				throw new Error("Can't stop peer process using cmd mode")
			}
			case 'service': {
				const platform = os.platform()
				if (platform === 'linux') {
					await this.stopSystemdService()
				} else if (platform === 'darwin') {
					await this.stopLaunchdService()
				} else {
					throw new Error(`Unsupported platform for service mode: ${platform}`)
				}
				break
			}
		}
	}

	async start(): Promise<StartCmdResponse | StartServiceResponse | StartDockerResponse> {
		const slugifiedId = slugify(this.opts.id)
		const homeDir = os.homedir()
		const dirPath = path.join(homeDir, `.fabriclaunch/peers/${slugifiedId}`)
		const mspConfigPath = path.join(dirPath, 'config')
		const dataConfigPath = path.join(dirPath, 'data')
		// find peer binary and throw error if not found
		const peerBinary = await this.findPeerBinary()
		if (!peerBinary) {
			throw new Error('Peer binary not found')
		}
		const cmd = this.buildPeerCommand(peerBinary)
		const env = this.buildPeerEnvironment(mspConfigPath)

		switch (this.mode) {
			case 'cmd':
				return this.startCmd(cmd, env)
			case 'service':
				return this.startService(cmd, env, dirPath)
			case 'docker':
				return this.startDocker(env, mspConfigPath, dataConfigPath)
			default:
				throw new Error(`Invalid mode: ${this.mode}`)
		}
	}
	private async findPeerBinary(): Promise<string> {
		const platform = os.platform()
		let findPeerBinaryCommand: string[]

		if (platform === 'win32') {
			findPeerBinaryCommand = ['where', 'peer']
		} else {
			findPeerBinaryCommand = ['which', 'peer']
		}

		const result = Bun.spawnSync(findPeerBinaryCommand)

		if (result.exitCode !== 0) {
			throw new Error('Failed to find peer binary')
		}

		const peerBinaryPath = result.stdout.toString().trim()

		if (!peerBinaryPath) {
			throw new Error('Peer binary not found in PATH')
		}

		return peerBinaryPath
	}
	private startCmd(cmd: string, env: NodeJS.ProcessEnv): StartCmdResponse {
		try {
			const proc = Bun.spawn(cmd.split(' '), {
				stdio: ['pipe', 'pipe', 'pipe'],
				env,
				onExit: (code) => {
					console.log(chalk.blueBright(`Peer process exited with code ${code}`))
				},
			})
			;(() => {
				new Response(proc.stdout).body.pipeTo(
					new WritableStream({
						write(chunk) {
							console.log(chalk.blueBright(Buffer.from(chunk).toString('utf-8')))
						},
					})
				)
				new Response(proc.stderr).body.pipeTo(
					new WritableStream({
						write(chunk) {
							console.log(chalk.blueBright(Buffer.from(chunk).toString('utf-8')))
						},
					})
				)
			})()

			return {
				mode: 'cmd',
				subprocess: proc,
			}
		} catch (error) {
			console.error('Failed to start peer node:', (error as ShellError).message)
			throw error
		}
	}

	private async startService(cmd: string, env: NodeJS.ProcessEnv, dirPath: string): Promise<StartServiceResponse> {
		const platform = os.platform()
		try {
			if (platform === 'linux') {
				await this.createSystemdService(cmd, env, dirPath)
				await this.startSystemdService()
				return { mode: 'service', type: 'systemd', serviceName: this.serviceName }
			} else if (platform === 'darwin') {
				await this.createLaunchdService(cmd, env, dirPath)
				await this.startLaunchdService()
				return { mode: 'service', type: 'launchd', serviceName: this.serviceName }
			} else {
				throw new Error(`Unsupported platform for service mode: ${platform}`)
			}
		} catch (error) {
			console.error(`Failed to start ${this.serviceName}:`, error)
			throw error
		}
	}

	private startDocker(env: NodeJS.ProcessEnv, mspConfigPath: string, dataConfigPath: string): StartDockerResponse {
		try {
			const envArrayCmd = Object.entries(env).map(([key, value]) => `-e ${key}=${value}`)
			const containerName = this.getContainerName()
			const p = Bun.spawnSync({
				cmd: [
					'docker',
					'run',
					'-d',
					'--name',
					containerName,
					...envArrayCmd,
					'-v',
					`${mspConfigPath}:/etc/hyperledger/fabric/msp`,
					'-v',
					`${dataConfigPath}:/var/hyperledger/production`,
					'-p',
					`${this.opts.listenAddress.split(':')[1]}:7051`,
					'-p',
					`${this.opts.chaincodeAddress.split(':')[1]}:7052`,
					'-p',
					`${this.opts.eventsAddress.split(':')[1]}:7053`,
					'-p',
					`${this.opts.operationsListenAddress.split(':')[1]}:9443`,
					'hyperledger/fabric-peer:2.5.9',
					'peer',
					'node',
					'start',
				],
			})
			if (p.exitCode !== 0) {
				throw new Error(p.stderr.toString())
			}
			return {
				mode: 'docker',
				containerName,
			}
		} catch (error) {
			console.error('Failed to start peer container:', error)
			throw error
		}
	}

	private async createSystemdService(cmd: string, env: NodeJS.ProcessEnv, dirPath: string): Promise<void> {
		const envString = Object.entries(env)
			.map(([key, value]) => `Environment="${key}=${value}"`)
			.join('\n')

		const serviceContent = `
[Unit]
Description=Hyperledger Fabric Peer - ${this.opts.id}
After=network.target

[Service]
Type=simple
WorkingDirectory=${dirPath}
ExecStart=${cmd}
Restart=on-failure
RestartSec=10
LimitNOFILE=65536
${envString}

[Install]
WantedBy=multi-user.target
`

		try {
			await fs.writeFile(this.serviceFilePath, serviceContent, { mode: 0o644 })
		} catch (error) {
			console.error('Failed to create systemd service file:', error)
			throw error
		}
	}

	private async createLaunchdService(cmd: string, env: NodeJS.ProcessEnv, dirPath: string): Promise<void> {
		const envString = Object.entries(env)
			.map(
				([key, value]) => `<key>${key}</key>
    <string>${value}</string>`
			)
			.join('\n')
		// ${cmd.split(' ').map((c) => `<string>${c}</string>`).join('\n')}

		let serviceContent = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>Label</key>
  <string>${this.launchdServiceName}</string>
  <key>ProgramArguments</key>
  <array>
      <string>/bin/bash</string>
      <string>-c</string>
      <string>${cmd}</string>
  </array>
  <key>RunAtLoad</key>
  <true/>
  <key>StandardOutPath</key>
  <string>${dirPath}/${this.serviceName}.log</string>
  <key>StandardErrorPath</key>
  <string>${dirPath}/${this.serviceName}.err</string>
  <key>EnvironmentVariables</key>
  <dict>
    ${envString}
  </dict>
</dict>
</plist>
`
		const serviceContent1 = `
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>${this.launchdServiceName}</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>-c</string>
        <string>echo "Hello from launchd111 $(date)" >> ${os.homedir()}/launchd_test.log</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>StandardOutPath</key>
    <string>${os.homedir()}/launchd_test.out</string>
    <key>StandardErrorPath</key>
    <string>${os.homedir()}/launchd_test.err</string>
</dict>
</plist>

`
		try {
			await fs.writeFile(this.launchdPlistPath, serviceContent, { mode: 0o644 })
		} catch (error) {
			console.error('Failed to create launchd service file:', error)
			throw error
		}
	}

	private async startSystemdService(): Promise<void> {
		try {
			await this.execSystemctl('daemon-reload')
			await this.execSystemctl('enable', this.serviceName)
			await this.execSystemctl('start', this.serviceName)
			await this.execSystemctl('restart', this.serviceName)
		} catch (error) {
			throw error
		}
	}

	private async startLaunchdService(): Promise<void> {
		try {
			// unload and stop service
			await this.stopLaunchdService()
			const loadResult = Bun.spawnSync({
				cmd: ['launchctl', 'load', this.launchdPlistPath],
			})
			if (loadResult.exitCode !== 0) {
				throw new Error(`Failed to load service: ${loadResult.stderr.toString()}`)
			}

			const startResult = Bun.spawnSync({
				cmd: ['launchctl', 'start', this.launchdServiceName],
			})
			if (startResult.exitCode !== 0) {
				throw new Error(`Failed to start service: ${startResult.stderr.toString()}`)
			}
		} catch (error) {
			console.error('Failed to start launchd service:', error)
			throw error
		}
	}

	private async stopSystemdService(): Promise<void> {
		try {
			await this.execSystemctl('stop', this.serviceName)
		} catch (error) {
			console.error(`Failed to stop ${this.serviceName}:`, error)
			throw error
		}
	}

	private async stopLaunchdService(): Promise<void> {
		try {
			Bun.spawnSync({
				cmd: ['launchctl', 'stop', this.serviceName],
			})
			Bun.spawnSync({
				cmd: ['launchctl', 'unload', this.launchdPlistPath],
			})
		} catch (error) {
			console.error(`Failed to stop ${this.serviceName}:`, error)
			throw error
		}
	}

	private getContainerName(): string {
		return `${this.org.mspId.toLowerCase()}-${slugify(this.opts.id)}`
	}

	private execSystemctl(command: string, service?: string) {
		const r = Bun.spawnSync({
			cmd: service ? ['sudo', 'systemctl', command, service] : ['sudo', 'systemctl', command],
		})
		return r
	}

	private buildPeerCommand(peerBinary: string): string {
		return `${peerBinary} node start`
	}

	private buildPeerEnvironment(mspConfigPath: string): NodeJS.ProcessEnv {
		return {
			CORE_PEER_MSPCONFIGPATH: mspConfigPath,
			FABRIC_CFG_PATH: mspConfigPath,
			CORE_PEER_TLS_ROOTCERT_FILE: `${mspConfigPath}/tlscacerts/cacert.pem`,
			CORE_PEER_TLS_KEY_FILE: `${mspConfigPath}/tls.key`,
			CORE_PEER_TLS_CLIENTCERT_FILE: `${mspConfigPath}/tls.crt`,
			CORE_PEER_TLS_CLIENTKEY_FILE: `${mspConfigPath}/tls.key`,
			CORE_PEER_TLS_CERT_FILE: `${mspConfigPath}/tls.crt`,
			CORE_PEER_TLS_CLIENTAUTHREQUIRED: 'false',
			CORE_PEER_TLS_CLIENTROOTCAS_FILES: `${mspConfigPath}/tlscacerts/cacert.pem`,
			CORE_PEER_ADDRESS: this.opts.externalEndpoint,
			CORE_PEER_GOSSIP_EXTERNALENDPOINT: this.opts.externalEndpoint,
			CORE_PEER_GOSSIP_ENDPOINT: this.opts.externalEndpoint,
			CORE_PEER_LISTENADDRESS: this.opts.listenAddress,
			CORE_PEER_CHAINCODELISTENADDRESS: this.opts.chaincodeAddress,
			CORE_PEER_EVENTS_ADDRESS: this.opts.eventsAddress,
			CORE_OPERATIONS_LISTENADDRESS: this.opts.operationsListenAddress,
			CORE_PEER_NETWORKID: 'peer01-nid',
			CORE_PEER_LOCALMSPID: this.mspId,
			CORE_PEER_ID: this.opts.id,
			CORE_OPERATIONS_TLS_ENABLED: 'false',
			CORE_OPERATIONS_TLS_CLIENTAUTHREQUIRED: 'false',
			CORE_PEER_GOSSIP_ORGLEADER: 'true',
			CORE_PEER_GOSSIP_BOOTSTRAP: this.opts.externalEndpoint,
			CORE_PEER_PROFILE_ENABLED: 'true',
			CORE_PEER_ADDRESSAUTODETECT: 'false',
			CORE_LOGGING_GOSSIP: 'info',
			FABRIC_LOGGING_SPEC: 'info',
			CORE_LOGGING_LEDGER: 'info',
			CORE_LOGGING_MSP: 'info',
			CORE_PEER_COMMITTER_ENABLED: 'true',
			CORE_PEER_DISCOVERY_TOUCHPERIOD: '60s',
			CORE_PEER_GOSSIP_USELEADERELECTION: 'false',
			CORE_PEER_DISCOVERY_PERIOD: '60s',
			CORE_METRICS_PROVIDER: 'prometheus',
			CORE_LOGGING_CAUTHDSL: 'info',
			CORE_LOGGING_POLICIES: 'info',
			CORE_LEDGER_STATE_STATEDATABASE: 'goleveldb',
			CORE_PEER_TLS_ENABLED: 'true',
			CORE_LOGGING_GRPC: 'info',
			CORE_LOGGING_PEER: 'info',
		}
	}

	private get serviceName(): string {
		return `fabric-peer-${slugify(this.opts.id)}`
	}
	private get launchdServiceName(): string {
		return `com.fabriclaunch.peer.${this.org.mspId.toLowerCase()}.${slugify(this.opts.id)}`
	}

	private get serviceFilePath(): string {
		return `/etc/systemd/system/${this.serviceName}.service`
	}

	private get launchdPlistPath(): string {
		return `${os.homedir()}/Library/LaunchAgents/${this.launchdServiceName}.plist`
	}

	async renewCertificates(): Promise<void> {
		const peerId = `${this.opts.id}.${this.org.mspId}`

		await this.org.renewCertificate(peerId, 'tls')

		// Renew signing certificates
		await this.org.renewCertificate(peerId, 'sign')
		await this.restart()
	}
	private async restart(): Promise<void> {
		await this.stop()
		await this.start()
	}
}
