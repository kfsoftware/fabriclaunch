"use strict";(self.webpackChunkfabriclaunch_docs=self.webpackChunkfabriclaunch_docs||[]).push([[7924],{1258:(n,e,r)=>{r.r(e),r.d(e,{assets:()=>l,contentTitle:()=>s,default:()=>h,frontMatter:()=>t,metadata:()=>o,toc:()=>i});var a=r(1085),c=r(1184);const t={sidebar_position:2},s="Getting started",o={id:"getting-started",title:"Getting started",description:"In order to get started with FabricLaunch, you have two options:",source:"@site/docs/getting-started.md",sourceDirName:".",slug:"/getting-started",permalink:"/fabriclaunch/docs/getting-started",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/getting-started.md",tags:[],version:"current",sidebarPosition:2,frontMatter:{sidebar_position:2},sidebar:"tutorialSidebar",previous:{title:"Introduction to FabricLaunch",permalink:"/fabriclaunch/docs/introduction"},next:{title:"Installation",permalink:"/fabriclaunch/docs/installation"}},l={},i=[{value:"Prerequisites",id:"prerequisites",level:2},{value:"Step 1: Install pre requisites",id:"step-1-install-pre-requisites",level:2},{value:"Install cfssl",id:"install-cfssl",level:3},{value:"Install Golang",id:"install-golang",level:3},{value:"Install Fabric tools",id:"install-fabric-tools",level:3},{value:"Install fabriclaunch",id:"install-fabriclaunch",level:3},{value:"Connect to the FabricLaunch platform",id:"connect-to-the-fabriclaunch-platform",level:2},{value:"machine 1",id:"machine-1",level:3},{value:"fra1",id:"fra1",level:3},{value:"blr1",id:"blr1",level:3},{value:"Governance",id:"governance",level:3},{value:"now chaincode",id:"now-chaincode",level:2}];function d(n){const e={a:"a",code:"code",h1:"h1",h2:"h2",h3:"h3",li:"li",ol:"ol",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,c.R)(),...n.components};return(0,a.jsxs)(a.Fragment,{children:[(0,a.jsx)(e.h1,{id:"getting-started",children:"Getting started"}),"\n",(0,a.jsx)(e.p,{children:"In order to get started with FabricLaunch, you have two options:"}),"\n",(0,a.jsxs)(e.ol,{children:["\n",(0,a.jsxs)(e.li,{children:["Watch the video on loom:  ",(0,a.jsx)(e.a,{href:"https://www.loom.com/share/434f5af313ef447d9268c9fd448be31c",children:"https://www.loom.com/share/434f5af313ef447d9268c9fd448be31c"})]}),"\n",(0,a.jsx)(e.li,{children:"Follow the written instructions below."}),"\n"]}),"\n",(0,a.jsx)(e.h2,{id:"prerequisites",children:"Prerequisites"}),"\n",(0,a.jsx)(e.p,{children:"This tutorial has been tested on Ubuntu and MacOS, if you are on Windows, feel free to try it but we can't guarantee it will work."}),"\n",(0,a.jsx)(e.h2,{id:"step-1-install-pre-requisites",children:"Step 1: Install pre requisites"}),"\n",(0,a.jsx)(e.p,{children:"At the time of writing, fabriclaunch has only been tested with Ubuntu 22.04 and 24.04."}),"\n",(0,a.jsx)(e.p,{children:"These are the tools you'll need to install:"}),"\n",(0,a.jsxs)(e.ul,{children:["\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"cfssl"}),": to generate certificates and certificate authorities (CAs)"]}),"\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"Golang"}),": to run chaincodes"]}),"\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"Fabric tools"}),": to interact with the Hyperledger Fabric network, including:","\n",(0,a.jsxs)(e.ul,{children:["\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"peer"}),": to run peers"]}),"\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"orderer"}),": to run orderers"]}),"\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"osnadmin"}),": to join the ordering service nodes to the channel"]}),"\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"discover"}),": to discover peers in the channel"]}),"\n"]}),"\n"]}),"\n",(0,a.jsxs)(e.li,{children:[(0,a.jsx)(e.strong,{children:"fabriclaunch"}),": to create and manage your Hyperledger Fabric network"]}),"\n"]}),"\n",(0,a.jsx)(e.h3,{id:"install-cfssl",children:"Install cfssl"}),"\n",(0,a.jsx)(e.p,{children:"To install cfssl, run the following commands:"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:'language-bash{"title":',metastring:'"xx"}',children:"wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl\nwget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson\nchmod +x /usr/local/bin/cfssl\nchmod +x /usr/local/bin/cfssljson\n"})}),"\n",(0,a.jsx)(e.h3,{id:"install-golang",children:"Install Golang"}),"\n",(0,a.jsx)(e.p,{children:"To install Golang, run the following commands:"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:'wget "https://go.dev/dl/go1.22.5.linux-amd64.tar.gz"\nsudo tar -C /usr/local -xzf go*.tar.gz\nexport PATH=$PATH:/usr/local/go/bin\n'})}),"\n",(0,a.jsx)(e.h3,{id:"install-fabric-tools",children:"Install Fabric tools"}),"\n",(0,a.jsx)(e.p,{children:"To install the Fabric tools, run the following commands:"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:"curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh \nchmod +x install-fabric.sh\n./install-fabric.sh --fabric-version 2.5.9 binary\n\n# and then move the binaries to your PATH\n\nmv bin/discover /usr/local/bin/discover\nmv bin/orderer /usr/local/bin/orderer\nmv bin/osnadmin /usr/local/bin/osnadmin\nmv bin/peer /usr/local/bin/peer\n"})}),"\n",(0,a.jsx)(e.h3,{id:"install-fabriclaunch",children:"Install fabriclaunch"}),"\n",(0,a.jsx)(e.p,{children:"To install fabriclaunch, run the following commands:"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:"wget https://fabriclaunch.com/fabriclaunch \nchmod +x fabriclaunch \nmv fabriclaunch /usr/local/bin/fabriclaunch\n"})}),"\n",(0,a.jsx)(e.h2,{id:"connect-to-the-fabriclaunch-platform",children:"Connect to the FabricLaunch platform"}),"\n",(0,a.jsx)(e.p,{children:"You have two options, you can either use a self hosted FabricLaunch platform or use the FabricLaunch platform hosted by us."}),"\n",(0,a.jsx)(e.p,{children:"To self host the FabricLaunch platform, run the following commands."}),"\n",(0,a.jsx)(e.p,{children:"There's a video that walks you through the process of setting up a FabricLaunch network."}),"\n",(0,a.jsx)(e.p,{children:"For the purposes of the demo, you will need three machines, you can use terraform or"}),"\n",(0,a.jsx)(e.h3,{id:"machine-1",children:"machine 1"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:'fabriclaunch auth login\n# generate a name for a consortium between important companies\nexport TENANT_NAME="<TENANT_NAME>"\n\nfabriclaunch org create NYCMSP --type local\nfabriclaunch org register NYCMSP --tenant ${TENANT_NAME}\n\nexport PUBLIC_IP=146.190.78.227\nfabriclaunch peer create nyc-peer0 --tenant ${TENANT_NAME} --tenant ${TENANT_NAME} --mode=systemd --region=nyc --mspId NYCMSP \\\n  --externalEndpoint="${PUBLIC_IP}:7051" \\\n  --listenAddress="0.0.0.0:7051" \\\n  --chaincodeAddress="0.0.0.0:7052" \\\n  --eventsAddress="0.0.0.0:7053" \\\n  --operationsListenAddress="0.0.0.0:7054" \\\n  -h localhost -h "${PUBLIC_IP}"\n\n\nexport PUBLIC_IP=146.190.78.227\nfabriclaunch peer create nyc-peer1 --tenant ${TENANT_NAME} --mode=systemd --region=nyc --mspId NYCMSP \\\n  --externalEndpoint="${PUBLIC_IP}:7071" \\\n  --listenAddress="0.0.0.0:7071" \\\n  --chaincodeAddress="0.0.0.0:7072" \\\n  --eventsAddress="0.0.0.0:7073" \\\n  --operationsListenAddress="0.0.0.0:7074" \\\n  -h localhost -h "${PUBLIC_IP}"\n\n\nexport PUBLIC_IP=146.190.78.227\nfabriclaunch orderer create nyc-orderer0 --tenant ${TENANT_NAME} --mode=systemd --region=nyc --mspId NYCMSP \\\n  --externalEndpoint="${PUBLIC_IP}:7060" \\\n  --listenAddress="0.0.0.0:7060" \\\n  --adminAddress="0.0.0.0:7061" \\\n  --operationsListenAddress="0.0.0.0:7062" \\\n  -h localhost\n\nfabriclaunch orderer stop nyc-orderer0 --mspId NYCMSP \n\nsystemctl status fabric-peer-nyc-peer0\nsystemctl status fabric-orderer-nyc-orderer0\nsystemctl status fabric-chaincode-multilocation-fabcar.service\njournalctl -n 100 -f -u  fabric-chaincode-multilocation-fabcar.service\njournalctl -n 100 -f -u fabric-peer-nyc-peer0\njournalctl -n 100 -f -u fabric-orderer-nyc-orderer0\n\n'})}),"\n",(0,a.jsx)(e.h3,{id:"fra1",children:"fra1"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:'\nexport TENANT_NAME="supply-chain-consortium"\n\nfabriclaunch org create FRAMSP --type local\nfabriclaunch org register FRAMSP --tenant ${TENANT_NAME}\n\nexport PUBLIC_IP=161.35.73.182\nfabriclaunch peer create  fra-peer0 --region=fr --mspId FRAMSP --tenant ${TENANT_NAME} --mode=systemd \\\n  --externalEndpoint="${PUBLIC_IP}:7051" \\\n  --listenAddress="0.0.0.0:7051" \\\n  --chaincodeAddress="0.0.0.0:7052" \\\n  --eventsAddress="0.0.0.0:7053" \\\n  --operationsListenAddress="0.0.0.0:7054" \\\n  -h localhost -h "${PUBLIC_IP}"\n\n\nexport PUBLIC_IP=161.35.73.182\nfabriclaunch orderer create fra-orderer0 --region=fr --mspId FRAMSP --tenant ${TENANT_NAME} --mode=systemd \\\n  --externalEndpoint="${PUBLIC_IP}:7060" \\\n  --listenAddress="0.0.0.0:7060" \\\n  --adminAddress="0.0.0.0:7061" \\\n  --operationsListenAddress="0.0.0.0:7062" \\\n  -h localhost\n\nsystemctl status fabric-peer-fra-peer0\nsystemctl status fabric-orderer-fra-orderer0\n\njournalctl -n 100 -f -u fabric-peer-fra-peer0\njournalctl -n 100 -f -u fabric-orderer-fra-orderer0\n\n'})}),"\n",(0,a.jsx)(e.h3,{id:"blr1",children:"blr1"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:'\nexport TENANT_NAME="supply-chain-consortium"\n\nfabriclaunch org create BLRMSP --type local\nfabriclaunch org register BLRMSP --tenant ${TENANT_NAME}\n\nexport PUBLIC_IP=128.199.29.246\nfabriclaunch peer create blr-peer0  --region=blr --mspId BLRMSP --tenant ${TENANT_NAME} --mode=systemd \\\n  --externalEndpoint="${PUBLIC_IP}:7051" \\\n  --listenAddress="0.0.0.0:7051" \\\n  --chaincodeAddress="0.0.0.0:7052" \\\n  --eventsAddress="0.0.0.0:7053" \\\n  --operationsListenAddress="0.0.0.0:7054" \\\n  -h localhost -h "${PUBLIC_IP}"\n\n\nexport PUBLIC_IP=128.199.29.246\nfabriclaunch orderer create blr-orderer0 --region=blr --mspId BLRMSP --tenant ${TENANT_NAME} --mode=systemd \\\n  --externalEndpoint="${PUBLIC_IP}:7060" \\\n  --listenAddress="0.0.0.0:7060" \\\n  --adminAddress="0.0.0.0:7061" \\\n  --operationsListenAddress="0.0.0.0:7062" \\\n  -h localhost\n\n\n'})}),"\n",(0,a.jsx)(e.h3,{id:"governance",children:"Governance"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:'export TENANT_NAME="supply-chain-consortium"\nfabriclaunch channel propose multilocation \\\n\t--mspId=NYCMSP \\\n  --tenant ${TENANT_NAME} \\\n\t--peerOrgs "NYCMSP,FRAMSP,BLRMSP" \\\n\t--ordererOrgs="NYCMSP,FRAMSP,BLRMSP" \\\n\t--consenters="NYCMSP.nyc-orderer0,FRAMSP.fra-orderer0,BLRMSP.blr-orderer0"\n\n\n# at this point, a notification should be sent to the other organizations to accept the channel proposal\n\nexport CHANNEL_PROPOSAL_ID="<CHANNEL_PROPOSAL_ID_FROM_PREV_STEP>"\n\nfabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o NYCMSP --tenant ${TENANT_NAME}\n\nfabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o FRAMSP --tenant ${TENANT_NAME}\n\nfabriclaunch channel accept "${CHANNEL_PROPOSAL_ID}"  -o BLRMSP --tenant ${TENANT_NAME}\n\n\nfabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o NYCMSP --tenant ${TENANT_NAME}\nfabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o FRAMSP --tenant ${TENANT_NAME}\nfabriclaunch consensus create  "${CHANNEL_PROPOSAL_ID}" -o BLRMSP --tenant ${TENANT_NAME}\n\nfabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o NYCMSP -p nyc-peer0 --tenant ${TENANT_NAME}\nfabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o FRAMSP -p fra-peer0 --tenant ${TENANT_NAME}\nfabriclaunch channel join ${CHANNEL_PROPOSAL_ID}  -o BLRMSP -p blr-peer0 --tenant ${TENANT_NAME}\n\n\n\n\n'})}),"\n",(0,a.jsx)(e.h2,{id:"now-chaincode",children:"now chaincode"}),"\n",(0,a.jsx)(e.pre,{children:(0,a.jsx)(e.code,{className:"language-bash",children:'export TENANT_NAME="supply-chain-consortium"\nfabriclaunch chaincode propose fabcar --mspId=NYCMSP --chaincodePath=$PWD/chaincode-external \\\n\t--channel=multilocation --sequence=7 --tenant="${TENANT_NAME}" \\\n\t--endorsementPolicy="OutOf(2, \'NYCMSP.member\',\'FRAMSP.member\',\'BLRMSP.member\')" \\\n\t--pdc="$PWD/pdc.json"\n\n\nexport CH_PROPOSAL_ID="<CH_PROPOSAL_ID_FROM_PREV_STEP>"\n\nfabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o NYCMSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}\nfabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o FRAMSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}\nfabriclaunch chaincode accept ${CH_PROPOSAL_ID} -o BLRMSP --chaincodeAddress="127.0.0.1:20000" --tenant ${TENANT_NAME}\n\n# this line commits the chaincode to the channel\nfabriclaunch chaincode commit ${CH_PROPOSAL_ID} -o NYCMSP --tenant ${TENANT_NAME}\n\nfabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=systemd --download --org=NYCMSP --chaincodeAddress="127.0.0.1:20000"\n\nfabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=systemd --download --org=FRAMSP --chaincodeAddress="127.0.0.1:20000"\n\nfabriclaunch chaincode run ${CH_PROPOSAL_ID} --tenant ${TENANT_NAME} --mode=systemd --download --org=BLRMSP --chaincodeAddress="127.0.0.1:20000"\n\n\n\nsystemctl status fabric-chaincode-multilocation-fabcar.service\njournalctl -u fabric-chaincode-multilocation-fabcar.service -n 100 -f\n\nfabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=NYCMSP --call \'{"function":"InitLedger","Args":[]}\'\nfabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=FRAMSP --call \'{"function":"InitLedger","Args":[]}\'\nfabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=BLRMSP --call \'{"function":"InitLedger","Args":[]}\'\n\n\nfabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=NYCMSP --call \'{"function":"CreateAsset","Args":["AssetNYC239","blue","20","owner", "100"]}\'\nfabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=FRAMSP --call \'{"function":"CreateAsset","Args":["AssetFRA23","blue","20","owner", "100"]}\'\nfabriclaunch chaincode invoke --channel=multilocation --name=fabcar --org=BLRMSP --call \'{"function":"CreateAsset","Args":["AssetBLR234","blue","20","owner", "100"]}\'\n \nfabriclaunch chaincode query --channel=multilocation --name=fabcar --org=NYCMSP --call \'{"function":"GetAllAssets","Args":[]}\'\nfabriclaunch chaincode query --channel=multilocation --name=fabcar --org=FRAMSP --call \'{"function":"GetAllAssets","Args":[]}\'\nfabriclaunch chaincode query --channel=multilocation --name=fabcar --org=BLRMSP --call \'{"function":"GetAllAssets","Args":[]}\'\n\n\nfabriclaunch chaincode query --channel=multilocation --name=fabcar --org=NYCMSP --call \'{"function":"Sum","Args":[2,4]}\'\n\n'})})]})}function h(n={}){const{wrapper:e}={...(0,c.R)(),...n.components};return e?(0,a.jsx)(e,{...n,children:(0,a.jsx)(d,{...n})}):d(n)}},1184:(n,e,r)=>{r.d(e,{R:()=>s,x:()=>o});var a=r(4041);const c={},t=a.createContext(c);function s(n){const e=a.useContext(t);return a.useMemo((function(){return"function"==typeof n?n(e):{...e,...n}}),[e,n])}function o(n){let e;return e=n.disableParentContext?"function"==typeof n.components?n.components(c):n.components||c:s(n.components),a.createElement(t.Provider,{value:e},n.children)}}}]);