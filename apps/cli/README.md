## Login

```bash
bun run ./src/index.ts auth login
```

## Create local org

```bash
bun run ./src/index.ts org create Org1MSP --type local
```

## Create peer
```bash
 bun run ./src/index.ts peer create peer0 --mspId Org1MSP \
  --externalEndpoint="6.tcp.eu.ngrok.io:16375" \
  --listenAddress="0.0.0.0:7051" \
  --chaincodeAddress="0.0.0.0:7052" \
  --eventsAddress="0.0.0.0:7053" \
  --operationsListenAddress="0.0.0.0:7054" \
  -h localhost -h 192.168.68.57


 bun run ./src/index.ts peer create peer1 --mspId Org1MSP \
  --externalEndpoint="2.tcp.eu.ngrok.io:19524" \
  --listenAddress="0.0.0.0:7056" \
  --chaincodeAddress="0.0.0.0:7057" \
  --eventsAddress="0.0.0.0:7058" \
  --operationsListenAddress="0.0.0.0:7059" \
  -h localhost -h 192.168.68.57

```


## Create Orderer
### Create org for orderer
```bash
bun run ./src/index.ts org create OrdererMSP --type local

```
### Create orderer0
```bash
bun run ./src/index.ts orderer create orderer0 --mspId OrdererMSP \
  --externalEndpoint="192.168.68.57:7060" \
  --listenAddress="0.0.0.0:7060" \
  --adminAddress="0.0.0.0:7061" \
  --operationsListenAddress="0.0.0.0:7062" \
  -h localhost
```

### Create orderer1

```bash
bun run ./src/index.ts orderer create orderer1 --mspId OrdererMSP \
  --externalEndpoint="192.168.68.57:7065" \
  --listenAddress="0.0.0.0:7065" \
  --adminAddress="0.0.0.0:7066" \
  --operationsListenAddress="0.0.0.0:7067" \
  -h localhost
```

### Create orderer2

```bash
bun run ./src/index.ts orderer create orderer2 --mspId OrdererMSP \
  --externalEndpoint="192.168.68.57:7068" \
  --listenAddress="0.0.0.0:7068" \
  --adminAddress="0.0.0.0:7069" \
  --operationsListenAddress="0.0.0.0:7070" \
  -h localhost
```