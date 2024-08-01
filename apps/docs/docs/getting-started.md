---
sidebar_position: 2
---

# Getting started

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

```bash{"title": "xx"}
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

To install fabriclaunch, run the following commands:

```bash
wget https://fabriclaunch.com/fabriclaunch 
chmod +x fabriclaunch 
mv fabriclaunch /usr/local/bin/fabriclaunch
```


## Connect to the FabricLaunch platform

You have two options, you can either use a self hosted FabricLaunch platform or use the FabricLaunch platform hosted by us.


To self host the FabricLaunch platform, run the following commands.




There's a video that walks you through the process of setting up a FabricLaunch network. 


For the purposes of the demo, you will need three machines, you can use terraform or 


### machine 1
```bash
fabriclaunch auth login
# generate a name for a consortium between important companies
export TENANT_NAME="<TENANT_NAME>"

fabriclaunch org create NYCMSP --type local
fabriclaunch org register NYCMSP --tenant ${TENANT_NAME}

export PUBLIC_IP=146.190.78.227
fabriclaunch peer create nyc-peer0 --tenant ${TENANT_NAME} --tenant ${TENANT_NAME} --mode=systemd --region=nyc --mspId NYCMSP \
  --externalEndpoint="${PUBLIC_IP}:7051" \
  --listenAddress="0.0.0.0:7051" \
  --chaincodeAddress="0.0.0.0:7052" \
  --eventsAddress="0.0.0.0:7053" \
  --operationsListenAddress="0.0.0.0:7054" \
  -h localhost -h "${PUBLIC_IP}"


export PUBLIC_IP=146.190.78.227
fabriclaunch peer create nyc-peer1 --tenant ${TENANT_NAME} --mode=systemd --region=nyc --mspId NYCMSP \
  --externalEndpoint="${PUBLIC_IP}:7071" \
  --listenAddress="0.0.0.0:7071" \
  --chaincodeAddress="0.0.0.0:7072" \
  --eventsAddress="0.0.0.0:7073" \
  --operationsListenAddress="0.0.0.0:7074" \
  -h localhost -h "${PUBLIC_IP}"


export PUBLIC_IP=146.190.78.227
fabriclaunch orderer create nyc-orderer0 --tenant ${TENANT_NAME} --mode=systemd --region=nyc --mspId NYCMSP \
  --externalEndpoint="${PUBLIC_IP}:7060" \
  --listenAddress="0.0.0.0:7060" \
  --adminAddress="0.0.0.0:7061" \
  --operationsListenAddress="0.0.0.0:7062" \
  -h localhost

fabriclaunch orderer stop nyc-orderer0 --mspId NYCMSP 

systemctl status fabric-peer-nyc-peer0
systemctl status fabric-orderer-nyc-orderer0
systemctl status fabric-chaincode-multilocation-fabcar.service
journalctl -n 100 -f -u  fabric-chaincode-multilocation-fabcar.service
journalctl -n 100 -f -u fabric-peer-nyc-peer0
journalctl -n 100 -f -u fabric-orderer-nyc-orderer0

```

### fra1
```bash

export TENANT_NAME="supply-chain-consortium"

fabriclaunch org create FRAMSP --type local
fabriclaunch org register FRAMSP --tenant ${TENANT_NAME}

export PUBLIC_IP=161.35.73.182
fabriclaunch peer create  fra-peer0 --region=fr --mspId FRAMSP --tenant ${TENANT_NAME} --mode=systemd \
  --externalEndpoint="${PUBLIC_IP}:7051" \
  --listenAddress="0.0.0.0:7051" \
  --chaincodeAddress="0.0.0.0:7052" \
  --eventsAddress="0.0.0.0:7053" \
  --operationsListenAddress="0.0.0.0:7054" \
  -h localhost -h "${PUBLIC_IP}"


export PUBLIC_IP=161.35.73.182
fabriclaunch orderer create fra-orderer0 --region=fr --mspId FRAMSP --tenant ${TENANT_NAME} --mode=systemd \
  --externalEndpoint="${PUBLIC_IP}:7060" \
  --listenAddress="0.0.0.0:7060" \
  --adminAddress="0.0.0.0:7061" \
  --operationsListenAddress="0.0.0.0:7062" \
  -h localhost

systemctl status fabric-peer-fra-peer0
systemctl status fabric-orderer-fra-orderer0

journalctl -n 100 -f -u fabric-peer-fra-peer0
journalctl -n 100 -f -u fabric-orderer-fra-orderer0

```

### blr1

```bash

export TENANT_NAME="supply-chain-consortium"

fabriclaunch org create BLRMSP --type local
fabriclaunch org register BLRMSP --tenant ${TENANT_NAME}

export PUBLIC_IP=128.199.29.246
fabriclaunch peer create blr-peer0  --region=blr --mspId BLRMSP --tenant ${TENANT_NAME} --mode=systemd \
  --externalEndpoint="${PUBLIC_IP}:7051" \
  --listenAddress="0.0.0.0:7051" \
  --chaincodeAddress="0.0.0.0:7052" \
  --eventsAddress="0.0.0.0:7053" \
  --operationsListenAddress="0.0.0.0:7054" \
  -h localhost -h "${PUBLIC_IP}"


export PUBLIC_IP=128.199.29.246
fabriclaunch orderer create blr-orderer0 --region=blr --mspId BLRMSP --tenant ${TENANT_NAME} --mode=systemd \
  --externalEndpoint="${PUBLIC_IP}:7060" \
  --listenAddress="0.0.0.0:7060" \
  --adminAddress="0.0.0.0:7061" \
  --operationsListenAddress="0.0.0.0:7062" \
  -h localhost


```

### Governance

```bash
export TENANT_NAME="supply-chain-consortium"
fabriclaunch channel propose multilocation \
	--mspId=NYCMSP \
  --tenant ${TENANT_NAME} \
	--peerOrgs "NYCMSP,FRAMSP,BLRMSP" \
	--ordererOrgs="NYCMSP,FRAMSP,BLRMSP" \
	--consenters="NYCMSP.nyc-orderer0,FRAMSP.fra-orderer0,BLRMSP.blr-orderer0"


# at this point, a notification should be sent to the other organizations to accept the channel proposal

export CHANNEL_PROPOSAL_ID="<CHANNEL_PROPOSAL_ID_FROM_PREV_STEP>"

fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o NYCMSP --tenant ${TENANT_NAME}

fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o FRAMSP --tenant ${TENANT_NAME}

fabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o BLRMSP --tenant ${TENANT_NAME}


fabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o NYCMSP --tenant ${TENANT_NAME}
fabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o FRAMSP --tenant ${TENANT_NAME}
fabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o BLRMSP --tenant ${TENANT_NAME}

fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o NYCMSP -p nyc-peer0 --tenant ${TENANT_NAME}
fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o FRAMSP -p fra-peer0 --tenant ${TENANT_NAME}
fabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o BLRMSP -p blr-peer0 --tenant ${TENANT_NAME}




```

## now chaincode
```bash
export TENANT_NAME="supply-chain-consortium"
fabriclaunch chaincode propose fabcar --mspId=NYCMSP --chaincodePath=$PWD/chaincode-external \
	--channel=multilocation --sequence=7 --tenant="${TENANT_NAME}" \
	--endorsementPolicy="OutOf(2, 'NYCMSP.member','FRAMSP.member','BLRMSP.member')" \
	--pdc="$PWD/pdc.json"


export CH_PROPOSAL_ID="<CH_PROPOSAL_ID_FROM_PREV_STEP>"

fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o NYCMSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o FRAMSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}
fabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o BLRMSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}

# this line commits the chaincode to the channel
fabriclaunch chaincode commit ${CH_PROPOSAL_ID} -o NYCMSP --tenant ${TENANT_NAME}

fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=systemd --download --org=NYCMSP --chaincodeAddress="127.0.0.1:20000"

fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=systemd --download --org=FRAMSP --chaincodeAddress="127.0.0.1:20000"

fabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=systemd --download --org=BLRMSP --chaincodeAddress="127.0.0.1:20000"



systemctl status fabric-chaincode-multilocation-fabcar.service
journalctl -u fabric-chaincode-multilocation-fabcar.service -n 100 -f

fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=NYCMSP --call '{"function":"InitLedger","Args":[]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=FRAMSP --call '{"function":"InitLedger","Args":[]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=BLRMSP --call '{"function":"InitLedger","Args":[]}'


fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=NYCMSP --call '{"function":"CreateAsset","Args":["AssetNYC239","blue","20","owner", "100"]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=FRAMSP --call '{"function":"CreateAsset","Args":["AssetFRA23","blue","20","owner", "100"]}'
fabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=BLRMSP --call '{"function":"CreateAsset","Args":["AssetBLR234","blue","20","owner", "100"]}'
 
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=NYCMSP --call '{"function":"GetAllAssets","Args":[]}'
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=FRAMSP --call '{"function":"GetAllAssets","Args":[]}'
fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=BLRMSP --call '{"function":"GetAllAssets","Args":[]}'


fabriclaunch chaincode query --channel=multilocation --name=fabcar --org=NYCMSP --call '{"function":"Sum","Args":[2,4]}'

```
