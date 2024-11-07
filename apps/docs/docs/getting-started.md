---
sidebar_position: 2
---

# Getting started

This tutorial will walk you through the local installation of FabricLaunch and how to deploy a Hyperledger Fabric network on your local machine.

These commands can be distributed in multiple machines as long as the nodes have network connectivity between them.

In order to get started with FabricLaunch, you have two options:

1. Watch the video on loom:  https://www.loom.com/share/434f5af313ef447d9268c9fd448be31c
2. Follow the written instructions below.

## Prerequisites
This tutorial has been tested on Ubuntu and MacOS, if you are on Windows, feel free to try it but we can't guarantee it will work.


## Step 1: Install pre requisites

At the time of writing, fabriclaunch has only been tested with Ubuntu 22.04 and 24.04.

These are the tools you'll need to install:

- **cfssl**: to generate certificates and certificate authorities (CAs)
- **Golang**: to run chaincodes
- **Fabric tools**: to interact with the Hyperledger Fabric network, including: 
   + **peer**: to run peers
   + **orderer**: to run orderers
   + **osnadmin**: to join the ordering service nodes to the channel
   + **discover**: to discover peers in the channel
- **fabriclaunch**: to create and manage your Hyperledger Fabric network


### Install cfssl

To install cfssl, run the following commands:

```bash
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson
chmod +x /usr/local/bin/cfssl
chmod +x /usr/local/bin/cfssljson
```

### Install Golang

To install Golang, run the following commands:

```bash
wget "https://go.dev/dl/go1.22.5.linux-amd64.tar.gz"
sudo tar -C /usr/local -xzf go*.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

### Install Fabric tools

To install the Fabric tools, run the following commands:

```bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh 
chmod +x install-fabric.sh
./install-fabric.sh --fabric-version 2.5.9 binary

# and then move the binaries to your PATH

mv bin/discover /usr/local/bin/discover
mv bin/orderer /usr/local/bin/orderer
mv bin/osnadmin /usr/local/bin/osnadmin
mv bin/peer /usr/local/bin/peer
```


### Install fabriclaunch

To install fabriclaunch, first download the appropriate binary for your system:

```bash
# For Linux (x64)
wget https://fabriclaunch.com/fabriclaunch-linux-x64 -O fabriclaunch

# For macOS (Intel)
wget https://fabriclaunch.com/fabriclaunch-darwin-x64 -O fabriclaunch

# For macOS (Apple Silicon)
wget https://fabriclaunch.com/fabriclaunch-darwin-arm64 -O fabriclaunch

# For Windows (x64)
wget https://fabriclaunch.com/fabriclaunch-win32-x64.exe -O fabriclaunch.exe
```

Then make it executable and move it to your PATH (Linux/macOS):
```bash
chmod +x fabriclaunch 
sudo mv fabriclaunch /usr/local/bin/fabriclaunch
```

For Windows, move the `fabriclaunch.exe` to a location in your system PATH.


## Connect to the FabricLaunch platform

You have two options, you can either use a self hosted FabricLaunch platform or use the FabricLaunch platform hosted by us.


To self host the FabricLaunch platform, run the following commands.




There's a video that walks you through the process of setting up a FabricLaunch network. 


For the purposes of the demo, you will need three machines, you can use terraform or 


### Login to the FabricLaunch platform

```bash
fabriclaunch auth login
```

### Create consortium

In order to create the consortium, you need to run the following commands:

```bash
fabriclaunch consortium create "My new consortium"
```

### Create nodes for Org1MSP

In order to create an organization, you need to run the following commands:

```bash
export TENANT_NAME="my-consortium"
export NODE_RUN_MODE="cmd" # or "systemd" in linux
export NODE_REGION="nyc"
export EXTERNAL_HOST="peer01-org1.localho.st"
export MSP_ID="Org1MSP"

fabriclaunch org create ${MSP_ID} --type local
fabriclaunch org register ${MSP_ID} --tenant ${TENANT_NAME}

fabriclaunch peer create org1-peer01 --tenant ${TENANT_NAME} --tenant ${TENANT_NAME} --mode=${NODE_RUN_MODE} --region=${NODE_REGION} --mspId ${MSP_ID} \
  --externalEndpoint="${EXTERNAL_HOST}:7051" \
  --listenAddress="0.0.0.0:7051" \
  --chaincodeAddress="0.0.0.0:7052" \
  --eventsAddress="0.0.0.0:7053" \
  --operationsListenAddress="0.0.0.0:7054" \
  -h localhost -h "${EXTERNAL_HOST}"



export EXTERNAL_HOST="orderer01-org1.localho.st"
fabriclaunch orderer create org1-orderer01 --tenant ${TENANT_NAME} --mode=${NODE_RUN_MODE} --region=${NODE_REGION} --mspId ${MSP_ID} \
  --externalEndpoint="${EXTERNAL_HOST}:7060" \
  --listenAddress="0.0.0.0:7060" \
  --adminAddress="0.0.0.0:7061" \
  --operationsListenAddress="0.0.0.0:7062" \
  -h localhost -h "${EXTERNAL_HOST}"


```

### Create nodes for Org2MSP

```bash
export TENANT_NAME="my-consortium"
export NODE_RUN_MODE="cmd" # or "systemd" in linux
export NODE_REGION="nyc"
export MSP_ID="Org2MSP"

fabriclaunch org create ${MSP_ID} --type local
fabriclaunch org register ${MSP_ID} --tenant ${TENANT_NAME}

export EXTERNAL_HOST="peer01-org2.localho.st"
fabriclaunch peer create org2-peer01 --tenant ${TENANT_NAME} --tenant ${TENANT_NAME} --mode=${NODE_RUN_MODE} --region=${NODE_REGION} --mspId ${MSP_ID} \
  --externalEndpoint="${EXTERNAL_HOST}:8051" \
  --listenAddress="0.0.0.0:8051" \
  --chaincodeAddress="0.0.0.0:8052" \
  --eventsAddress="0.0.0.0:8053" \
  --operationsListenAddress="0.0.0.0:8054" \
  -h localhost -h "${EXTERNAL_HOST}"



export EXTERNAL_HOST="orderer01-org2.localho.st"
fabriclaunch orderer create org2-orderer01 --tenant ${TENANT_NAME} --mode=${NODE_RUN_MODE} --region=${NODE_REGION} --mspId ${MSP_ID} \
  --externalEndpoint="${EXTERNAL_HOST}:8060" \
  --listenAddress="0.0.0.0:8060" \
  --adminAddress="0.0.0.0:8061" \
  --operationsListenAddress="0.0.0.0:8062" \
  -h localhost -h "${EXTERNAL_HOST}"

```

### Create nodes for Org3MSP

```bash

export TENANT_NAME="my-consortium"
export NODE_RUN_MODE="cmd" # or "systemd" in linux
export NODE_REGION="nyc"
export MSP_ID="Org3MSP"

fabriclaunch org create ${MSP_ID} --type local
fabriclaunch org register ${MSP_ID} --tenant ${TENANT_NAME}

export EXTERNAL_HOST="peer01-org3.localho.st"
fabriclaunch peer create org3-peer01 --tenant ${TENANT_NAME} --tenant ${TENANT_NAME} --mode=${NODE_RUN_MODE} --region=${NODE_REGION} --mspId ${MSP_ID} \
  --externalEndpoint="${EXTERNAL_HOST}:9051" \
  --listenAddress="0.0.0.0:9051" \
  --chaincodeAddress="0.0.0.0:9052" \
  --eventsAddress="0.0.0.0:9053" \
  --operationsListenAddress="0.0.0.0:9054" \
  -h localhost -h "${EXTERNAL_HOST}"



export EXTERNAL_HOST="orderer01-org3.localho.st"
fabriclaunch orderer create org3-orderer01 --tenant ${TENANT_NAME} --mode=${NODE_RUN_MODE} --region=${NODE_REGION} --mspId ${MSP_ID} \
  --externalEndpoint="${EXTERNAL_HOST}:9060" \
  --listenAddress="0.0.0.0:9060" \
  --adminAddress="0.0.0.0:9061" \
  --operationsListenAddress="0.0.0.0:9062" \
  -h localhost -h "${EXTERNAL_HOST}"

```



## Governance

### Create a channel

The process to create a channel is as follows:

1. Propose the channel
2. Accept the channel
3. Create the consensus (join the ordering service nodes to the channel)
4. Join the channel (join the peers to the channel)

```bash
export TENANT_NAME="my-consortium"
fabriclaunch channel propose multilocation \
	--mspId=Org1MSP \
  --tenant ${TENANT_NAME} \
	--peerOrgs "Org1MSP,Org2MSP,Org3MSP" \
	--ordererOrgs="Org1MSP,Org2MSP,Org3MSP" \
	--consenters="Org1MSP.org1-orderer01,Org2MSP.org2-orderer01,Org3MSP.org3-orderer01"


# at this point, a notification should be sent to the other organizations to accept the channel proposal

export CHANNEL_PROPOSAL_ID="prop_multilocation_1721752940394"
fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o Org1MSP --tenant ${TENANT_NAME}
fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o Org2MSP --tenant ${TENANT_NAME}
fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o Org3MSP --tenant ${TENANT_NAME}


fabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o Org1MSP --tenant ${TENANT_NAME}
fabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o Org2MSP --tenant ${TENANT_NAME}
fabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o Org3MSP --tenant ${TENANT_NAME}

fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o Org1MSP -p nyc-peer0 --tenant ${TENANT_NAME}
fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o Org2MSP -p fra-peer0 --tenant ${TENANT_NAME}
fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o Org3MSP -p blr-peer0 --tenant ${TENANT_NAME}




```

### Create and deploy a chaincode
```bash
### download chaincode 
wget https://fabriclaunch.com/chaincode-external.zip
unzip chaincode-external.zip


### propose chaincode
export TENANT_NAME="my-consortium"

fabriclaunch chaincode propose fabcar --mspId=Org1MSP --chaincodePath=$PWD/chaincode-external \
	--channel=multilocation --sequence=1 --tenant="${TENANT_NAME}" \
	--endorsementPolicy="OutOf(2, 'Org1MSP.member','Org2MSP.member','Org3MSP.member')" \
	--pdc="$PWD/pdc.json"


export CH_PROPOSAL_ID="<PROP_ID>"

### install, approve and accept the chaincode in the platform

fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org1MSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org2MSP --chaincodeAddress="127.0.0.1:20001" --tenant ${TENANT_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o Org3MSP --chaincodeAddress="127.0.0.1:20002" --tenant ${TENANT_NAME}

# this line commits the chaincode to the channel
fabriclaunch chaincode commit ${CH_PROPOSAL_ID} -o Org1MSP --tenant ${TENANT_NAME}

### run the chaincode in the platform

export CHAINCODE_RUN_MODE="cmd" # or "systemd" in linux

# run in a separate terminal, keep environment variables CH_PROPOSAL_ID, TENANT_NAME
fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=cmd --download --org=Org1MSP --chaincodeAddress="127.0.0.1:20000"

export CHAINCODE_RUN_MODE="cmd" # or "systemd" in linux

# run in a separate terminal, keep environment variables CH_PROPOSAL_ID, TENANT_NAME
fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=cmd --download --org=Org2MSP --chaincodeAddress="127.0.0.1:20001"

export CHAINCODE_RUN_MODE="cmd" # or "systemd" in linux

# run in a separate terminal, keep environment variables CH_PROPOSAL_ID, TENANT_NAME
fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=cmd --download --org=Org3MSP --chaincodeAddress="127.0.0.1:20002"



fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"InitLedger","Args":[]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"InitLedger","Args":[]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org3MSP --call '{"function":"InitLedger","Args":[]}'


fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"CreateAsset","Args":["AssetNYC239","blue","20","owner", "100"]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"CreateAsset","Args":["AssetFRA23","blue","20","owner", "100"]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=Org3MSP --call '{"function":"CreateAsset","Args":["AssetBLR234","blue","20","owner", "100"]}'
 
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"GetAllAssets","Args":[]}'
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org2MSP --call '{"function":"GetAllAssets","Args":[]}'
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org3MSP --call '{"function":"GetAllAssets","Args":[]}'


fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=Org1MSP --call '{"function":"Sum","Args":["2","4"]}'

```
