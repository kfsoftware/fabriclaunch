```bash
bun run ./src/index.ts channel propose channel5 \
	--peerOrgs "Org1MSP,Org2MSP" \
	--ordererOrgs="OrdererMSP" \
	--consenters="OrdererMSP.orderer0,OrdererMSP.orderer1,OrdererMSP.orderer2"

export PROPOSAL_ID="prop_channel4_1720696888170"

bun run ./src/index.ts channel accept "${PROPOSAL_ID}"  -o Org1MSP

bun run ./src/index.ts channel accept "${PROPOSAL_ID}"  -o Org2MSP

bun run ./src/index.ts channel accept "${PROPOSAL_ID}"  -o OrdererMSP


# consensus creates the channel

bun run ./src/index.ts consensus create "${PROPOSAL_ID}" -o OrdererMSP

bun run ./src/index.ts channel join ${PROPOSAL_ID}  -o Org1MSP -p peer0 -p peer1

bun run ./src/index.ts channel join ${PROPOSAL_ID}  -o Org2MSP -p peer0-org1


# chaincode

bun run ./src/index.ts chaincode propose fabcar5 --chaincodePath=$PWD/fixtures/chaincode-external --channel=channel4 --sequence=4 \
	--endorsementPolicy="OR('Org1MSP.member','Org2MSP.member')" \
	--pdc="$PWD/pdc.json"

export CH_PROPOSAL_ID="prop_channel4_fabcar5_4_1720708535983"
# this line approves the chaincode and uploads it to the platform
bun run ./src/index.ts chaincode accept ${CH_PROPOSAL_ID} -o Org1MSP

# this line approves the chaincode and uploads it to the platform
bun run ./src/index.ts chaincode accept ${CH_PROPOSAL_ID} -o Org2MSP

bun run ./src/index.ts chaincode download ${CH_PROPOSAL_ID} --output=chaincodes

bun run ./src/index.ts chaincode run ${CH_PROPOSAL_ID} --download --org=Org1MSP

# this line commits the chaincode to the channel
bun run ./src/index.ts chaincode commit ${CH_PROPOSAL_ID} -o Org1MSP

bun run ./src/index.ts chaincode query --channel=channel4 --chaincode=fabcar5 --fcn=Test --arg="a" --arg="b" -o Org1MSP --user=admin

bun run ./src/index.ts chaincode invoke --channel=channel4 --chaincode=fabcar5 --fcn=Test --arg="a" --arg="b" -o Org1MSP --user=admin

bun run ./src/index.ts peer create peer0-org2 --mspId Org2MSP \
  --externalEndpoint="192.168.68.57:7151" \
  --listenAddress="0.0.0.0:7151" \
  --chaincodeAddress="0.0.0.0:7152" \
  --eventsAddress="0.0.0.0:7153" \
  --operationsListenAddress="0.0.0.0:7154" \
  -h localhost -h 192.168.68.57

```


### Missing

Get proposals by channel id:
```bash
bun run ./src/index.ts channel getProposals channel5
```

Get chaincode proposals by channel id and chaincode id:
```bash
bun run ./src/index.ts chaincode getProposals channel5 fabcar4
```
