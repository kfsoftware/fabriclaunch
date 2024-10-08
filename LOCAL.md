# Tutorial: Setting up a Hyperledger Fabric Network with FabricLaunch

This tutorial will guide you through the process of setting up a Hyperledger Fabric network using FabricLaunch. We'll create a network with one peer organization (Org1MSP) containing one peer and one orderer organization (OrdererOrg) containing three orderers. Then, we'll create a channel and install and deploy a chaincode.

## Prerequisites

- FabricLaunch installed and configured
- Docker and Docker Compose installed
- Basic understanding of Hyperledger Fabric concepts


Download dependencies:
```bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh && chmod +x install-fabric.sh
./install-fabric.sh --fabric-version 2.5.9 binary
sudo mv bin/configtxgen /usr/local/bin/configtxgen
sudo mv bin/configtxlator /usr/local/bin/configtxlator
sudo mv bin/cryptogen /usr/local/bin/cryptogen
sudo mv bin/discover /usr/local/bin/discover
sudo mv bin/fabric-ca-client /usr/local/bin/fabric-ca-client
sudo mv bin/fabric-ca-server /usr/local/bin/fabric-ca-server
sudo mv bin/ledgerutil /usr/local/bin/ledgerutil
sudo mv bin/orderer /usr/local/bin/orderer
sudo mv bin/osnadmin /usr/local/bin/osnadmin
sudo mv bin/peer /usr/local/bin/peer
sudo wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl
sudo wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson
sudo chmod +x /usr/local/bin/cfssl
sudo chmod +x /usr/local/bin/cfssljson
```

## Step 1: Creation of Org1MSP

### Create local CA for Org1MSP

1. Set up the CA configuration for Org1MSP
2. Generate root certificates for Org1MSP

```bash
# Placeholder for Org1MSP CA setup commands
fabriclaunch auth login
# generate a name for a consortium between important companies
export TENANT_NAME="tenant"

fabriclaunch org create Org1MSP --type local
fabriclaunch org register Org1MSP --tenant ${TENANT_NAME}

```

### Create and launch the peer

1. Generate peer certificates using the Org1MSP CA
2. Configure the peer
3. Start the peer node

```bash

export PUBLIC_IP="peer0-org1.localho.st" # points to 127.0.0.1
# service mode means that will use systemd in linux or launchd in macos
fabriclaunch peer create org1-peer0 --tenant ${TENANT_NAME} --mode=service --region=nyc --mspId Org1MSP \
  --externalEndpoint="${PUBLIC_IP}:7051" \
  --listenAddress="0.0.0.0:7051" \
  --chaincodeAddress="0.0.0.0:7052" \
  --eventsAddress="0.0.0.0:7053" \
  --operationsListenAddress="0.0.0.0:7054" \
  -h localhost -h "${PUBLIC_IP}"

fabriclaunch peer stop org1-peer0

```

## Step 2: Creation of OrdererOrg

### Create local CA for OrdererOrg

1. Set up the CA configuration for OrdererOrg
2. Generate root certificates for OrdererOrg

```bash

export TENANT_NAME="tenant"
fabriclaunch org create OrdererOrg --type local
fabriclaunch org register OrdererOrg --tenant ${TENANT_NAME}

```

### Create and launch the three orderers

1. Generate orderer certificates using the OrdererOrg CA
2. Configure the three orderers
3. Start the orderer nodes

```bash
export TENANT_NAME="tenant"
export PUBLIC_IP="orderer0-org1.localho.st"
fabriclaunch orderer create orderer0-org1 --tenant ${TENANT_NAME} --mode=service --region=nyc --mspId OrdererOrg \
  --externalEndpoint="${PUBLIC_IP}:7060" \
  --listenAddress="0.0.0.0:7060" \
  --adminAddress="0.0.0.0:7061" \
  --operationsListenAddress="0.0.0.0:7062" \
  -h localhost -h "${PUBLIC_IP}"


export PUBLIC_IP="orderer1-org1.localho.st"
fabriclaunch orderer create orderer1-org1 --tenant ${TENANT_NAME} --mode=service --region=nyc --mspId OrdererOrg \
  --externalEndpoint="${PUBLIC_IP}:7070" \
  --listenAddress="0.0.0.0:7070" \
  --adminAddress="0.0.0.0:7071" \
  --operationsListenAddress="0.0.0.0:7072" \
  -h localhost -h "${PUBLIC_IP}"

export PUBLIC_IP="orderer2-org1.localho.st"
fabriclaunch orderer create orderer2-org1 --tenant ${TENANT_NAME} --mode=service --region=nyc --mspId OrdererOrg \
  --externalEndpoint="${PUBLIC_IP}:7080" \
  --listenAddress="0.0.0.0:7080" \
  --adminAddress="0.0.0.0:7081" \
  --operationsListenAddress="0.0.0.0:7082" \
  -h localhost -h "${PUBLIC_IP}"


```

## Step 3: Creation of the channel

1. Generate channel configuration transaction
2. Create the channel
3. Join the peer to the channel

```bash
export TENANT_NAME="tenant"
fabriclaunch channel propose multilocation \
	--mspId=Org1MSP \
  --tenant ${TENANT_NAME} \
	--peerOrgs "Org1MSP" \
	--ordererOrgs="OrdererOrg" \
	--consenters="OrdererOrg.orderer0-org1,OrdererOrg.orderer1-org1,OrdererOrg.orderer2-org1"

```

### Accept the channel proposal

```bash
export CHANNEL_PROPOSAL_ID="prop_multilocation_1728401939102"
fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o Org1MSP --tenant ${TENANT_NAME}
fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o OrdererOrg --tenant ${TENANT_NAME}

# fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o Org2MSP --tenant ${TENANT_NAME}

```

### Once approved, join orderers and peers
```bash

# join orderers
fabriclaunch consensus create "${CHANNEL_PROPOSAL_ID}" -o OrdererOrg --tenant ${TENANT_NAME}

# join peers
fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o Org1MSP -p org1-peer0 --tenant ${TENANT_NAME}
# fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o Org2MSP -p org2msp-peer0 --tenant ${TENANT_NAME}
```

## Step 4: Install and deploy the chaincode

1. Package the chaincode
2. Install the chaincode on the peer
3. Approve the chaincode for Org1MSP
4. Commit the chaincode to the channel


### Propose chaincode

```bash
export TENANT_NAME="tenant"
fabriclaunch chaincode propose fabcar --mspId=Org1MSP --chaincodePath=$PWD/apps/cli/fixtures/chaincode-external \
	--channel=multilocation --sequence=1 --tenant="${TENANT_NAME}" \
	--endorsementPolicy="OR('Org1MSP.member')"


```

### Accept chaincode proposal

```bash

export CH_PROPOSAL_ID="prop_multilocation_fabcar_1_1728402430652"

fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org1MSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org2MSP --chaincodeAddress="127.0.0.1:20001" --tenant ${TENANT_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o OrdererOrg --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}


fabriclaunch chaincode commit ${CH_PROPOSAL_ID} -o Org1MSP --tenant ${TENANT_NAME}

```

### Run the chaincode on the peer orgs

```bash
# 
fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=service --download --org=Org1MSP --chaincodeAddress="127.0.0.1:20000"
fabriclaunch chaincode logs fabcar

fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=service --download --org=Org2MSP --chaincodeAddress="127.0.0.1:20001"

```

## Step 5: Test the Network

1. Invoke a transaction on the chaincode

```bash
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"InitLedger","Args":[]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"InitLedger","Args":[]}'

```

2. Query the ledger

```bash
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"GetAllAssets","Args":[]}'
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"GetAllAssets","Args":[]}'
```

## Finish

Congratulations! You have successfully set up a Hyperledger Fabric network using FabricLaunch, created a channel, and deployed a chaincode. This basic setup includes one peer organization (Org1MSP) with one peer and one orderer organization (OrdererOrg) with three orderers. You can expand this setup to include more organizations, peers, and complex chaincode as needed for your blockchain application.



