
import { Subprocess } from 'bun';
import chalk from 'chalk';
import { ExecException } from 'child_process';
import fs from "fs/promises";
import { isIP } from 'net';
import os from "os";
import path from 'path';
import slugify from 'slugify';
import { IOrg } from '../org';
import { OrdererConfig, OrdererType, StartOrdererOpts } from "./types";

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
    mode: "cmd";
    subprocess: Subprocess;
}
type StartSystemdResponse = {
    mode: "systemd";
    serviceName: string;
}
type StartDockerResponse = {
    mode: "docker";
    containerName: string;
}


export class LocalOrderer {
    type: OrdererType = 'local'
    constructor(
        public mspId: string,
        private opts: StartOrdererOpts,
        private readonly org: IOrg,
        private readonly mode: "cmd" | "systemd" | "docker"
    ) { }
    async init(): Promise<OrdererConfig> {
        const ordererId = `${this.opts.id}.${this.org.mspId}`;
        const chunks = this.opts.externalEndpoint.split(':');
        const dnsName = chunks[0];
        const ipAddresses = [...this.opts.domainNames.filter(s => isIP(s)), "127.0.0.1"]
        const dnsNames = [...this.opts.domainNames.filter(s => !isIP(s)), dnsName]
        const tlsCerts = await this.org.getCertificateForNode(ordererId, {
            dnsNames,
            ipAddresses,
            organization: this.org.mspId,
            organizationUnit: 'orderer'
        }, 'tls');
        const signCerts = await this.org.getCertificateForNode(ordererId, {
            dnsNames: [],
            ipAddresses: [],
            organization: this.org.mspId,
            organizationUnit: 'orderer'
        }, 'sign');
        const slugifiedId = slugify(this.opts.id);
        const homeDir = os.homedir();

        // specific path for ordererId
        const dirPath = path.join(homeDir, `.fabriclaunch/orderers/${slugifiedId}`);
        const dataConfigPath = path.join(dirPath, 'data');
        const mspConfigPath = path.join(dirPath, 'config');

        // ensure certificates are written to configOrdererPath into respective paths
        // create folders
        await fs.mkdir(dataConfigPath, { recursive: true });
        await fs.mkdir(mspConfigPath, { recursive: true });

        // write certificates only to configOrdererPath, check buildOrdererEnvironment for paths
        await fs.writeFile(`${mspConfigPath}/tls.crt`, tlsCerts.cert);
        await fs.writeFile(`${mspConfigPath}/tls.key`, tlsCerts.pk);
        // write signcerts/cert.pem but ensure the path is created
        await fs.mkdir(`${mspConfigPath}/signcerts`, { recursive: true });
        await fs.writeFile(`${mspConfigPath}/signcerts/cert.pem`, signCerts.cert);
        await fs.writeFile(`${mspConfigPath}/cacert.pem`, signCerts.caCert);

        // write cacerts/cacert.pem but ensure the path is created
        await fs.mkdir(`${mspConfigPath}/cacerts`, { recursive: true });
        await fs.writeFile(`${mspConfigPath}/cacerts/cacert.pem`, signCerts.caCert);

        // write tlscacerts/cacert.pem but ensure the path is created
        await fs.mkdir(`${mspConfigPath}/tlscacerts`, { recursive: true });
        await fs.writeFile(`${mspConfigPath}/tlscacerts/cacert.pem`, tlsCerts.caCert);

        // write keystore/key.pem for sign private key but ensure the path is created
        await fs.mkdir(`${mspConfigPath}/keystore`, { recursive: true });
        await fs.writeFile(`${mspConfigPath}/keystore/key.pem`, signCerts.pk);

        // write msp config
        await fs.writeFile(`${mspConfigPath}/config.yaml`, configYamlContent);

        const ordererYamlTemplate = `
# Copyright IBM Corp. All Rights Reserved.
#
# SPDX-License-Identifier: Apache-2.0
#

---
################################################################################
#
#   Orderer Configuration
#
#   - This controls the type and configuration of the orderer.
#
################################################################################
General:
    # Listen address: The IP on which to bind to listen.
    ListenAddress: 127.0.0.1

    # Listen port: The port on which to bind to listen.
    ListenPort: 7050

    # TLS: TLS settings for the GRPC server.
    TLS:
        # Require server-side TLS
        Enabled: false
        # PrivateKey governs the file location of the private key of the TLS certificate.
        PrivateKey: tls/server.key
        # Certificate governs the file location of the server TLS certificate.
        Certificate: tls/server.crt
        # RootCAs contains a list of additional root certificates used for verifying certificates
        # of other orderer nodes during outbound connections.
        # It is not required to be set, but can be used to augment the set of TLS CA certificates
        # available from the MSPs of each channel’s configuration.
        RootCAs:
          - tls/ca.crt
        # Require client certificates / mutual TLS for inbound connections.
        ClientAuthRequired: false
        # If mutual TLS is enabled, ClientRootCAs contains a list of additional root certificates
        # used for verifying certificates of client connections.
        # It is not required to be set, but can be used to augment the set of TLS CA certificates
        # available from the MSPs of each channel’s configuration.
        ClientRootCAs:
    # Keepalive settings for the GRPC server.
    Keepalive:
        # ServerMinInterval is the minimum permitted time between client pings.
        # If clients send pings more frequently, the server will
        # disconnect them.
        ServerMinInterval: 60s
        # ServerInterval is the time between pings to clients.
        ServerInterval: 7200s
        # ServerTimeout is the duration the server waits for a response from
        # a client before closing the connection.
        ServerTimeout: 20s

    # Since all nodes should be consistent it is recommended to keep
    # the default value of 100MB for MaxRecvMsgSize & MaxSendMsgSize
    # Max message size in bytes the GRPC server and client can receive
    MaxRecvMsgSize: 104857600
    # Max message size in bytes the GRPC server and client can send
    MaxSendMsgSize: 104857600

    # Cluster settings for ordering service nodes that communicate with other ordering service nodes
    # such as Raft based ordering service.
    Cluster:
        # SendBufferSize is the maximum number of messages in the egress buffer.
        # Consensus messages are dropped if the buffer is full, and transaction
        # messages are waiting for space to be freed.
        SendBufferSize: 100

        # ClientCertificate governs the file location of the client TLS certificate
        # used to establish mutual TLS connections with other ordering service nodes.
        # If not set, the server General.TLS.Certificate is re-used.
        ClientCertificate:
        # ClientPrivateKey governs the file location of the private key of the client TLS certificate.
        # If not set, the server General.TLS.PrivateKey is re-used.
        ClientPrivateKey:

        # The below 4 properties should be either set together, or be unset together.
        # If they are set, then the orderer node uses a separate listener for intra-cluster
        # communication. If they are unset, then the general orderer listener is used.
        # This is useful if you want to use a different TLS server certificates on the
        # client-facing and the intra-cluster listeners.

        # ListenPort defines the port on which the cluster listens to connections.
        ListenPort:
        # ListenAddress defines the IP on which to listen to intra-cluster communication.
        ListenAddress:
        # ServerCertificate defines the file location of the server TLS certificate used for intra-cluster
        # communication.
        ServerCertificate:
        # ServerPrivateKey defines the file location of the private key of the TLS certificate.
        ServerPrivateKey:

    # Bootstrap method: The method by which to obtain the bootstrap block
    # system channel is specified. The option can be one of:
    #   "file" - path to a file containing the genesis block or config block of system channel
    #   "none" - allows an orderer to start without a system channel configuration
    BootstrapMethod: file

    # Bootstrap file: The file containing the bootstrap block to use when
    # initializing the orderer system channel and BootstrapMethod is set to
    # "file".  The bootstrap file can be the genesis block, and it can also be
    # a config block for late bootstrap of some consensus methods like Raft.
    # Generate a genesis block by updating $FABRIC_CFG_PATH/configtx.yaml and
    # using configtxgen command with "-outputBlock" option.
    # Defaults to file "genesisblock" (in $FABRIC_CFG_PATH directory) if not specified.
    BootstrapFile:

    # LocalMSPDir is where to find the private crypto material needed by the
    # orderer. It is set relative here as a default for dev environments but
    # should be changed to the real location in production.
    LocalMSPDir: msp

    # LocalMSPID is the identity to register the local MSP material with the MSP
    # manager. IMPORTANT: The local MSP ID of an orderer needs to match the MSP
    # ID of one of the organizations defined in the orderer system channel's
    # /Channel/Orderer configuration. The sample organization defined in the
    # sample configuration provided has an MSP ID of "SampleOrg".
    LocalMSPID: SampleOrg

    # Enable an HTTP service for Go "pprof" profiling as documented at:
    # https://golang.org/pkg/net/http/pprof
    Profile:
        Enabled: false
        Address: 0.0.0.0:6060

    # BCCSP configures the blockchain crypto service providers.
    BCCSP:
        # Default specifies the preferred blockchain crypto service provider
        # to use. If the preferred provider is not available, the software
        # based provider ("SW") will be used.
        # Valid providers are:
        #  - SW: a software based crypto provider
        #  - PKCS11: a CA hardware security module crypto provider.
        Default: SW

        # SW configures the software based blockchain crypto provider.
        SW:
            # TODO: The default Hash and Security level needs refactoring to be
            # fully configurable. Changing these defaults requires coordination
            # SHA2 is hardcoded in several places, not only BCCSP
            Hash: SHA2
            Security: 256
            # Location of key store. If this is unset, a location will be
            # chosen using: 'LocalMSPDir'/keystore
            FileKeyStore:
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
            FileKeyStore:
                KeyStore:

    # Authentication contains configuration parameters related to authenticating
    # client messages
    Authentication:
        # the acceptable difference between the current server time and the
        # client's time as specified in a client request message
        TimeWindow: 15m


################################################################################
#
#   SECTION: File Ledger
#
#   - This section applies to the configuration of the file ledger.
#
################################################################################
FileLedger:

    # Location: The directory to store the blocks in.
    Location: ${dataConfigPath}

################################################################################
#
#   SECTION: Kafka
#
#   - This section applies to the configuration of the Kafka-based orderer, and
#     its interaction with the Kafka cluster.
#
################################################################################
Kafka:

    # Retry: What do if a connection to the Kafka cluster cannot be established,
    # or if a metadata request to the Kafka cluster needs to be repeated.
    Retry:
        # When a new channel is created, or when an existing channel is reloaded
        # (in case of a just-restarted orderer), the orderer interacts with the
        # Kafka cluster in the following ways:
        # 1. It creates a Kafka producer (writer) for the Kafka partition that
        # corresponds to the channel.
        # 2. It uses that producer to post a no-op CONNECT message to that
        # partition
        # 3. It creates a Kafka consumer (reader) for that partition.
        # If any of these steps fail, they will be re-attempted every
        # <ShortInterval> for a total of <ShortTotal>, and then every
        # <LongInterval> for a total of <LongTotal> until they succeed.
        # Note that the orderer will be unable to write to or read from a
        # channel until all of the steps above have been completed successfully.
        ShortInterval: 5s
        ShortTotal: 10m
        LongInterval: 5m
        LongTotal: 12h
        # Affects the socket timeouts when waiting for an initial connection, a
        # response, or a transmission. See Config.Net for more info:
        # https://godoc.org/github.com/Shopify/sarama#Config
        NetworkTimeouts:
            DialTimeout: 10s
            ReadTimeout: 10s
            WriteTimeout: 10s
        # Affects the metadata requests when the Kafka cluster is in the middle
        # of a leader election.See Config.Metadata for more info:
        # https://godoc.org/github.com/Shopify/sarama#Config
        Metadata:
            RetryBackoff: 250ms
            RetryMax: 3
        # What to do if posting a message to the Kafka cluster fails. See
        # Config.Producer for more info:
        # https://godoc.org/github.com/Shopify/sarama#Config
        Producer:
            RetryBackoff: 100ms
            RetryMax: 3
        # What to do if reading from the Kafka cluster fails. See
        # Config.Consumer for more info:
        # https://godoc.org/github.com/Shopify/sarama#Config
        Consumer:
            RetryBackoff: 2s
    # Settings to use when creating Kafka topics.  Only applies when
    # Kafka.Version is v0.10.1.0 or higher
    Topic:
        # The number of Kafka brokers across which to replicate the topic
        ReplicationFactor: 3
    # Verbose: Enable logging for interactions with the Kafka cluster.
    Verbose: false

    # TLS: TLS settings for the orderer's connection to the Kafka cluster.
    TLS:

      # Enabled: Use TLS when connecting to the Kafka cluster.
      Enabled: false

      # PrivateKey: PEM-encoded private key the orderer will use for
      # authentication.
      PrivateKey:
        # As an alternative to specifying the PrivateKey here, uncomment the
        # following "File" key and specify the file name from which to load the
        # value of PrivateKey.
        #File: path/to/PrivateKey

      # Certificate: PEM-encoded signed public key certificate the orderer will
      # use for authentication.
      Certificate:
        # As an alternative to specifying the Certificate here, uncomment the
        # following "File" key and specify the file name from which to load the
        # value of Certificate.
        #File: path/to/Certificate

      # RootCAs: PEM-encoded trusted root certificates used to validate
      # certificates from the Kafka cluster.
      RootCAs:
        # As an alternative to specifying the RootCAs here, uncomment the
        # following "File" key and specify the file name from which to load the
        # value of RootCAs.
        #File: path/to/RootCAs

    # SASLPlain: Settings for using SASL/PLAIN authentication with Kafka brokers
    SASLPlain:
      # Enabled: Use SASL/PLAIN to authenticate with Kafka brokers
      Enabled: false
      # User: Required when Enabled is set to true
      User:
      # Password: Required when Enabled is set to true
      Password:

    # Kafka protocol version used to communicate with the Kafka cluster brokers
    # (defaults to 0.10.2.0 if not specified)
    Version:

################################################################################
#
#   Debug Configuration
#
#   - This controls the debugging options for the orderer
#
################################################################################
Debug:

    # BroadcastTraceDir when set will cause each request to the Broadcast service
    # for this orderer to be written to a file in this directory
    BroadcastTraceDir:

    # DeliverTraceDir when set will cause each request to the Deliver service
    # for this orderer to be written to a file in this directory
    DeliverTraceDir:

################################################################################
#
#   Operations Configuration
#
#   - This configures the operations server endpoint for the orderer
#
################################################################################
Operations:
    # host and port for the operations server
    ListenAddress: 127.0.0.1:8443

    # TLS configuration for the operations endpoint
    TLS:
        # TLS enabled
        Enabled: false

        # Certificate is the location of the PEM encoded TLS certificate
        Certificate:

        # PrivateKey points to the location of the PEM-encoded key
        PrivateKey:

        # Most operations service endpoints require client authentication when TLS
        # is enabled. ClientAuthRequired requires client certificate authentication
        # at the TLS layer to access all resources.
        ClientAuthRequired: false

        # Paths to PEM encoded ca certificates to trust for client authentication
        ClientRootCAs: []

################################################################################
#
#   Metrics Configuration
#
#   - This configures metrics collection for the orderer
#
################################################################################
Metrics:
    # The metrics provider is one of statsd, prometheus, or disabled
    Provider: disabled

    # The statsd configuration
    Statsd:
      # network type: tcp or udp
      Network: udp

      # the statsd server address
      Address: 127.0.0.1:8125

      # The interval at which locally cached counters and gauges are pushed
      # to statsd; timings are pushed immediately
      WriteInterval: 30s

      # The prefix is prepended to all emitted statsd metrics
      Prefix:

################################################################################
#
#   Admin Configuration
#
#   - This configures the admin server endpoint for the orderer
#
################################################################################
Admin:
    # host and port for the admin server
    ListenAddress: 127.0.0.1:9443

    # TLS configuration for the admin endpoint
    TLS:
        # TLS enabled
        Enabled: false

        # Certificate is the location of the PEM encoded TLS certificate
        Certificate:

        # PrivateKey points to the location of the PEM-encoded key
        PrivateKey:

        # Most admin service endpoints require client authentication when TLS
        # is enabled. ClientAuthRequired requires client certificate authentication
        # at the TLS layer to access all resources.
        #
        # NOTE: When TLS is enabled, the admin endpoint requires mutual TLS. The
        # orderer will panic on startup if this value is set to false.
        ClientAuthRequired: true

        # Paths to PEM encoded ca certificates to trust for client authentication
        ClientRootCAs: []

################################################################################
#
#   Channel participation API Configuration
#
#   - This provides the channel participation API configuration for the orderer.
#   - Channel participation uses the ListenAddress and TLS settings of the Admin
#     service.
#
################################################################################
ChannelParticipation:
    # Channel participation API is enabled.
    Enabled: false

    # The maximum size of the request body when joining a channel.
    MaxRequestBodySize: 1 MB


################################################################################
#
#   Consensus Configuration
#
#   - This section contains config options for a consensus plugin. It is opaque
#     to orderer, and completely up to consensus implementation to make use of.
#
################################################################################
Consensus:
    # The allowed key-value pairs here depend on consensus plugin. For etcd/raft,
    # we use following options:

    # WALDir specifies the location at which Write Ahead Logs for etcd/raft are
    # stored. Each channel will have its own subdir named after channel ID.
    WALDir: ${dataConfigPath}/etcdraft/wal

    # SnapDir specifies the location at which snapshots for etcd/raft are
    # stored. Each channel will have its own subdir named after channel ID.
    SnapDir: ${dataConfigPath}/etcdraft/snapshot


`
        await fs.writeFile(`${mspConfigPath}/orderer.yaml`, ordererYamlTemplate)
        const ordererConfig: OrdererConfig = {
            mode: this.mode,
            adminAddress: this.opts.adminAddress,
            listenAddress: this.opts.listenAddress,
            operationsListenAddress: this.opts.operationsListenAddress,
            externalEndpoint: this.opts.externalEndpoint,
            ordererName: this.opts.id,
            signCert: signCerts.cert,
            signCACert: signCerts.caCert,
            signKey: signCerts.pk,
            tlsCert: tlsCerts.cert,
            tlsCACert: tlsCerts.caCert,
            tlsKey: tlsCerts.pk,
        }
        const configPath = path.join(homeDir, `.fabriclaunch/nodes/${this.mspId}/${ordererId}/config.json`);
        await fs.writeFile(configPath, JSON.stringify(ordererConfig));
        return ordererConfig
    }


    async stop(): Promise<void> {
        switch (this.mode) {
            case "cmd": {
                throw new Error("Can't stop peer process using cmd mode");
            }
            case "systemd": {
                await this.stopService();
                await this.removeService();
                break
            }
        }
    }
    private execSystemctl(command: string, service?: string) {
        const r = Bun.spawnSync({
            cmd: service ? ['sudo', 'systemctl', command, service] : ['sudo', 'systemctl', command],
        })
        return r
    }

    private async stopService(): Promise<void> {
        try {
            await this.execSystemctl('stop', this.serviceName);
            console.log(`Stopped ${this.serviceName}`);
        } catch (error) {
            console.error(`Failed to stop ${this.serviceName}:`, error);
            throw error;
        }
    }

    private async removeService(): Promise<void> {
        try {
            await this.stopService();
            await this.execSystemctl('disable', this.serviceName);
            await fs.unlink(this.serviceFilePath);
            console.log(`Removed ${this.serviceName}`);
        } catch (error) {
            console.error(`Failed to remove ${this.serviceName}:`, error);
            throw error;
        }
    }
    async start(): Promise<StartCmdResponse | StartSystemdResponse | StartDockerResponse> {
        const slugifiedId = slugify(this.opts.id);
        const homeDir = os.homedir();
        const dirPath = path.join(homeDir, `.fabriclaunch/orderers/${slugifiedId}`);
        const mspConfigPath = path.join(dirPath, 'config');
        const cmd = this.buildOrdererCommand();
        const env = this.buildOrdererEnvironment(mspConfigPath);

        switch (this.mode) {
            case "cmd": {
                try {
                    const proc = Bun.spawn(cmd.split(" "), {
                        stdio: ["pipe", "pipe", "pipe"],
                        env,
                        onExit: (code) => {
                            console.log(chalk.blueBright(`Orderer process exited with code ${code}`));
                        }
                    });
                    (() => {
                        new Response(proc.stdout).body.pipeTo(new WritableStream({
                            write(chunk) {
                                console.log(chalk.blueBright(Buffer.from(chunk).toString("utf-8")));
                            }
                        }));
                        new Response(proc.stderr).body.pipeTo(new WritableStream({
                            write(chunk) {
                                console.log(chalk.blueBright(Buffer.from(chunk).toString("utf-8")));
                            }
                        }));
                    })()

                    return {
                        mode: "cmd",
                        subprocess: proc
                    }
                } catch (error) {
                    console.error('Failed to start orderer node:', (error as ExecException).message);
                    throw error;
                }
            }
            case "systemd": {
                try {
                    await this.createSystemdService();
                    await this.startService();

                    return {
                        mode: "systemd",
                        serviceName: this.serviceName,
                    }
                } catch (error) {
                    console.error(`Failed to start ${this.serviceName}:`, error);
                    throw error;
                }
            }
            default:
                throw new Error(`Invalid mode: ${this.mode}`);
        }
    }


    private async createSystemdService(): Promise<void> {
        const homeDir = os.homedir();
        const dirPath = path.join(homeDir, `.fabriclaunch/orderers/${slugify(this.opts.id)}`);
        const mspConfigPath = path.join(dirPath, 'config');
        const cmd = this.buildOrdererCommand();
        const env = this.buildOrdererEnvironment(mspConfigPath);

        const envString = Object.entries(env)
            .map(([key, value]) => `Environment="${key}=${value}"`)
            .join('\n');

        const serviceContent = `
[Unit]
Description=Hyperledger Fabric Orderer - ${this.opts.id}
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
`;

        try {
            await fs.writeFile(this.serviceFilePath, serviceContent, { mode: 0o644 });
        } catch (error) {
            console.error('Failed to create systemd service file:', error);
            throw error;
        }
    }

    private async startService(): Promise<void> {
        try {
            await this.execSystemctl('daemon-reload');
            await this.execSystemctl('enable', this.serviceName);
            await this.execSystemctl('start', this.serviceName);
            await this.execSystemctl('restart', this.serviceName);
            
        } catch (error) {
            throw error;
        }
    }

    private get serviceName(): string {
        return `fabric-orderer-${slugify(this.opts.id)}.service`;
    }

    private get serviceFilePath(): string {
        return `/etc/systemd/system/${this.serviceName}`;
    }
    private buildOrdererCommand(): string {
        return 'orderer';
    }

    private buildOrdererEnvironment(mspConfigPath: string): NodeJS.ProcessEnv {
        const [host, port] = this.opts.listenAddress.split(':');
        return {
            FABRIC_CFG_PATH: mspConfigPath,
            ORDERER_ADMIN_TLS_CLIENTROOTCAS: `${mspConfigPath}/tlscacerts/cacert.pem`,
            ORDERER_ADMIN_TLS_PRIVATEKEY: `${mspConfigPath}/tls.key`,
            ORDERER_ADMIN_TLS_CERTIFICATE: `${mspConfigPath}/tls.crt`,
            ORDERER_ADMIN_TLS_ROOTCAS: `${mspConfigPath}/tlscacerts/cacert.pem`,
            ORDERER_FILELEDGER_LOCATION: `${mspConfigPath}/data`,
            ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE: `${mspConfigPath}/tls.crt`,
            ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY: `${mspConfigPath}/tls.key`,
            ORDERER_GENERAL_CLUSTER_ROOTCAS: `${mspConfigPath}/tlscacerts/cacert.pem`,
            ORDERER_GENERAL_LOCALMSPDIR: mspConfigPath,
            ORDERER_GENERAL_TLS_CLIENTROOTCAS: `${mspConfigPath}/tlscacerts/cacert.pem`,
            ORDERER_GENERAL_TLS_CERTIFICATE: `${mspConfigPath}/tls.crt`,
            ORDERER_GENERAL_TLS_PRIVATEKEY: `${mspConfigPath}/tls.key`,
            ORDERER_GENERAL_TLS_ROOTCAS: `${mspConfigPath}/tlscacerts/cacert.pem`,
            ORDERER_ADMIN_LISTENADDRESS: this.opts.adminAddress,
            ORDERER_GENERAL_LISTENADDRESS: host,
            ORDERER_OPERATIONS_LISTENADDRESS: this.opts.operationsListenAddress,
            ORDERER_GENERAL_LOCALMSPID: this.mspId,
            ORDERER_GENERAL_LISTENPORT: port,
            ORDERER_ADMIN_TLS_ENABLED: 'true',
            ORDERER_CHANNELPARTICIPATION_ENABLED: 'true',
            ORDERER_GENERAL_BATCHSIZE_MAXMESSAGECOUNT: '10',
            ORDERER_GENERAL_BATCHTIMEOUT: '1s',
            ORDERER_GENERAL_BOOTSTRAPMETHOD: 'none',
            ORDERER_GENERAL_GENESISPROFILE: 'initial',
            ORDERER_GENERAL_LEDGERTYPE: 'file',
            FABRIC_LOGGING_SPEC: 'info',
            ORDERER_GENERAL_MAXWINDOWSIZE: '1000',
            ORDERER_GENERAL_ORDERERTYPE: 'etcdraft',
            ORDERER_GENERAL_TLS_CLIENTAUTHREQUIRED: 'false',
            ORDERER_GENERAL_TLS_ENABLED: 'true',
            ORDERER_METRICS_PROVIDER: 'prometheus',
            ORDERER_OPERATIONS_TLS_ENABLED: 'false',
        };
    }
}