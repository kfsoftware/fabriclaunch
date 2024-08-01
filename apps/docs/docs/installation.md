---
sidebar_position: 3
---
# Installation

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


## Install cfssl

To install cfssl, run the following commands:

```bash{"title": "xx"}
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson
chmod +x /usr/local/bin/cfssl
chmod +x /usr/local/bin/cfssljson
```

## Install Golang

To install Golang, run the following commands:

```bash
wget "https://go.dev/dl/go1.22.5.linux-amd64.tar.gz"
sudo tar -C /usr/local -xzf go*.tar.gz
export PATH=$PATH:/usr/local/go/bin
```

## Install Fabric tools

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


## Install fabriclaunch

To install fabriclaunch, run the following commands:

```bash
wget https://fabriclaunch.com/fabriclaunch 
chmod +x fabriclaunch 
mv fabriclaunch /usr/local/bin/fabriclaunch
```

