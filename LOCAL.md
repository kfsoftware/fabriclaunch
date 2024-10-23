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

## Self Host FabricLaunch

```bash
cd apps/web
bun dev
```


## Compile the CLI

```bash
export API_URL="http://localhost:3000/api"
bun build src/index.ts --compile --outfile=./fabriclaunch --define process.env.API_URL="$API_URL"
sudo mv ./fabriclaunch /usr/local/bin/fabriclaunch
```
## Step 1: Creation of Org1MSP

### Create local CA for Org1MSP

1. Set up the CA configuration for Org1MSP
2. Generate root certificates for Org1MSP

```bash
# Placeholder for Org1MSP CA setup commands
fabriclaunch auth login
# generate a name for a consortium between important companies
export CONSORTIUM_NAME="morganstate"

fabriclaunch org create Org1MSP --type local
fabriclaunch org register Org1MSP --tenant ${CONSORTIUM_NAME}


```

### Create and launch the peer

1. Generate peer certificates using the Org1MSP CA
2. Configure the peer
3. Start the peer node

```bash

export PUBLIC_IP="peer0-org1.localho.st" # points to 127.0.0.1
# service mode means that will use systemd in linux or launchd in macos
fabriclaunch peer create org1-peer0 --tenant ${CONSORTIUM_NAME} --mode=service --region=nyc --mspId Org1MSP \
  --externalEndpoint="${PUBLIC_IP}:7051" \
  --listenAddress="0.0.0.0:7051" \
  --chaincodeAddress="0.0.0.0:7052" \
  --eventsAddress="0.0.0.0:7053" \
  --operationsListenAddress="0.0.0.0:7054" \
  -h localhost -h "${PUBLIC_IP}"

# fabriclaunch peer stop org1-peer0 --mspId Org1MSP

```
Verify that the peer is running by checking the logs:
```bash
# -k means insecure
curl https://localhost:7051 -k 
```


## Step 2: Creation of OrdererOrg

### Create local CA for OrdererOrg

1. Set up the CA configuration for OrdererOrg
2. Generate root certificates for OrdererOrg

```bash

export CONSORTIUM_NAME="morganstate"
fabriclaunch org create OrdererOrg --type local
fabriclaunch org register OrdererOrg --tenant ${CONSORTIUM_NAME}

```

### Create and launch the three orderers

1. Generate orderer certificates using the OrdererOrg CA
2. Configure the three orderers
3. Start the orderer nodes

```bash
export CONSORTIUM_NAME="morganstate"
export PUBLIC_IP="orderer0-org1.localho.st"
fabriclaunch orderer create orderer0-org1 --tenant ${CONSORTIUM_NAME} --mode=service --region=nyc --mspId OrdererOrg \
  --externalEndpoint="${PUBLIC_IP}:7060" \
  --listenAddress="0.0.0.0:7060" \
  --adminAddress="0.0.0.0:7061" \
  --operationsListenAddress="0.0.0.0:7062" \
  -h localhost -h "${PUBLIC_IP}"


export PUBLIC_IP="orderer1-org1.localho.st"
fabriclaunch orderer create orderer1-org1 --tenant ${CONSORTIUM_NAME} --mode=service --region=nyc --mspId OrdererOrg \
  --externalEndpoint="${PUBLIC_IP}:7070" \
  --listenAddress="0.0.0.0:7070" \
  --adminAddress="0.0.0.0:7071" \
  --operationsListenAddress="0.0.0.0:7072" \
  -h localhost -h "${PUBLIC_IP}"

export PUBLIC_IP="orderer2-org1.localho.st"
fabriclaunch orderer create orderer2-org1 --tenant ${CONSORTIUM_NAME} --mode=service --region=nyc --mspId OrdererOrg \
  --externalEndpoint="${PUBLIC_IP}:7080" \
  --listenAddress="0.0.0.0:7080" \
  --adminAddress="0.0.0.0:7081" \
  --operationsListenAddress="0.0.0.0:7082" \
  -h localhost -h "${PUBLIC_IP}"


# fabriclaunch orderer stop orderer0-org1 --mspId OrdererOrg
# fabriclaunch orderer stop orderer1-org1 --mspId OrdererOrg
# fabriclaunch orderer stop orderer2-org1 --mspId OrdererOrg

```

## Step 3: Creation of the channel

1. Generate channel configuration transaction
2. Create the channel
3. Join the peer to the channel

```bash
export CONSORTIUM_NAME="morganstate"
fabriclaunch channel propose multilocation \
	--mspId=Org1MSP \
  --tenant ${CONSORTIUM_NAME} \
	--peerOrgs "Org1MSP" \
	--ordererOrgs="OrdererOrg" \
	--consenters="OrdererOrg.orderer0-org1,OrdererOrg.orderer1-org1,OrdererOrg.orderer2-org1"

```

### Accept the channel proposal

```bash
export CHANNEL_PROPOSAL_ID="prop_multilocation_1728808683632"
fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o Org1MSP --tenant ${CONSORTIUM_NAME}
fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o OrdererOrg --tenant ${CONSORTIUM_NAME}

# fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o Org2MSP --tenant ${CONSORTIUM_NAME}

```

### Once approved, join orderers and peers
```bash

# join orderers
fabriclaunch consensus create "${CHANNEL_PROPOSAL_ID}" -o OrdererOrg --tenant ${CONSORTIUM_NAME}

# join peers + setting anchor peers
fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o Org1MSP -p org1-peer0 --tenant ${CONSORTIUM_NAME}
fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o Org2MSP -p org2msp-peer0 --tenant ${CONSORTIUM_NAME}
```

## Step 4: Install and deploy the chaincode

1. Package the chaincode
2. Install the chaincode on the peer
3. Approve the chaincode for Org1MSP
4. Commit the chaincode to the channel


### Propose chaincode

```bash
export CONSORTIUM_NAME="morganstate"
fabriclaunch chaincode propose fabcar --mspId=Org1MSP --chaincodePath=$PWD/apps/cli/fixtures/chaincode-external \
	--channel=multilocation --sequence=2 --tenant="${CONSORTIUM_NAME}" \
	--endorsementPolicy="OR('Org1MSP.member')"


```

### Accept chaincode proposal

```bash

export CH_PROPOSAL_ID="prop_multilocation_fabcar_2_1728809712344"

# downloads the chaincode
# installs the chaincode in the peers of the org
# approves the chaincode for the org in Fabric
# sends approval to the platform
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org1MSP --chaincodeAddress="127.0.0.1:20000" --tenant ${CONSORTIUM_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org2MSP --chaincodeAddress="127.0.0.1:20001" --tenant ${CONSORTIUM_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o OrdererOrg --chaincodeAddress="127.0.0.1:20000" --tenant ${CONSORTIUM_NAME}

# fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org2MSP --chaincodeAddress="127.0.0.1:20001" --tenant ${CONSORTIUM_NAME}

# commit the chaincode definition to the channel + notify the platform about the commit
fabriclaunch chaincode commit ${CH_PROPOSAL_ID} -o Org1MSP --tenant ${CONSORTIUM_NAME}

```

### Run the chaincode on the peer orgs

```bash

fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${CONSORTIUM_NAME} --mode=service --download --org=Org1MSP --chaincodeAddress="127.0.0.1:20000"

# IN THE FUTURE, check logs
# fabriclaunch chaincode logs fabcar 
fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${CONSORTIUM_NAME} --mode=service --download --org=Org2MSP --chaincodeAddress="127.0.0.1:20001"

```

## Step 5: Test the Network

1. Invoke a transaction on the chaincode

```bash
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"InitLedger","Args":[]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"InitLedger","Args":[]}'
# fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"InitLedger","Args":[]}'

```

2. Query the ledger

```bash
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"GetAllAssets","Args":[]}'
# fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"GetAllAssets","Args":[]}'
```


### Clean up

```bash

fabriclaunch peer stop org1-peer0 --mspId Org1MSP

fabriclaunch orderer stop orderer0-org1 --mspId OrdererOrg
fabriclaunch orderer stop orderer1-org1 --mspId OrdererOrg
fabriclaunch orderer stop orderer2-org1 --mspId OrdererOrg

# in the future, we will have a command to stop the chaincode
launchctl unload ~/Library/LaunchAgents/com.fabriclaunch.chaincode.org1msp-fabcar.plist

rm ~/Library/LaunchAgents/com.fabriclaunch.orderer.ordererorg.orderer2-org1.plist
rm ~/Library/LaunchAgents/com.fabriclaunch.orderer.ordererorg.orderer1-org1.plist
rm ~/Library/LaunchAgents/com.fabriclaunch.orderer.ordererorg.orderer0-org1.plist
rm ~/Library/LaunchAgents/com.fabriclaunch.peer.org1msp.org1-peer0.plist
rm ~/Library/LaunchAgents/com.fabriclaunch.peer.org2msp.org2msp-peer0.plist
rm ~/Library/LaunchAgents/com.fabriclaunch.chaincode.org1msp-fabcar.plist

rm -rf ~/.fabriclaunch
```

## Finish

Congratulations! You have successfully set up a Hyperledger Fabric network using FabricLaunch, created a channel, and deployed a chaincode. This basic setup includes one peer organization (Org1MSP) with one peer and one orderer organization (OrdererOrg) with three orderers. You can expand this setup to include more organizations, peers, and complex chaincode as needed for your blockchain application.



