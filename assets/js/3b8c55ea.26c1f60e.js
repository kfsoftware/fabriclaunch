"use strict";(self.webpackChunkfabriclaunch_docs=self.webpackChunkfabriclaunch_docs||[]).push([[6803],{7292:(n,l,e)=>{e.r(l),e.d(l,{assets:()=>c,contentTitle:()=>a,default:()=>h,frontMatter:()=>i,metadata:()=>r,toc:()=>o});var s=e(1085),t=e(1184);const i={sidebar_position:3},a="Installation",r={id:"installation",title:"Installation",description:"At the time of writing, fabriclaunch has only been tested with Ubuntu 22.04 and 24.04.",source:"@site/docs/installation.md",sourceDirName:".",slug:"/installation",permalink:"/fabriclaunch/docs/installation",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/installation.md",tags:[],version:"current",sidebarPosition:3,frontMatter:{sidebar_position:3},sidebar:"tutorialSidebar",previous:{title:"Getting started",permalink:"/fabriclaunch/docs/getting-started"},next:{title:"Deployment on DigitalOcean",permalink:"/fabriclaunch/docs/deployments/digitalocean"}},c={},o=[{value:"Install cfssl",id:"install-cfssl",level:2},{value:"Install Golang",id:"install-golang",level:2},{value:"Install Fabric tools",id:"install-fabric-tools",level:2},{value:"Install fabriclaunch",id:"install-fabriclaunch",level:2}];function d(n){const l={code:"code",h1:"h1",h2:"h2",li:"li",p:"p",pre:"pre",strong:"strong",ul:"ul",...(0,t.R)(),...n.components};return(0,s.jsxs)(s.Fragment,{children:[(0,s.jsx)(l.h1,{id:"installation",children:"Installation"}),"\n",(0,s.jsx)(l.p,{children:"At the time of writing, fabriclaunch has only been tested with Ubuntu 22.04 and 24.04."}),"\n",(0,s.jsx)(l.p,{children:"These are the tools you'll need to install:"}),"\n",(0,s.jsxs)(l.ul,{children:["\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"cfssl"}),": to generate certificates and certificate authorities (CAs)"]}),"\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"Golang"}),": to run chaincodes"]}),"\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"Fabric tools"}),": to interact with the Hyperledger Fabric network, including:","\n",(0,s.jsxs)(l.ul,{children:["\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"peer"}),": to run peers"]}),"\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"orderer"}),": to run orderers"]}),"\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"osnadmin"}),": to join the ordering service nodes to the channel"]}),"\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"discover"}),": to discover peers in the channel"]}),"\n"]}),"\n"]}),"\n",(0,s.jsxs)(l.li,{children:[(0,s.jsx)(l.strong,{children:"fabriclaunch"}),": to create and manage your Hyperledger Fabric network"]}),"\n"]}),"\n",(0,s.jsx)(l.h2,{id:"install-cfssl",children:"Install cfssl"}),"\n",(0,s.jsx)(l.p,{children:"To install cfssl, run the following commands:"}),"\n",(0,s.jsx)(l.pre,{children:(0,s.jsx)(l.code,{className:'language-bash{"title":',metastring:'"xx"}',children:"wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl\nwget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson\nchmod +x /usr/local/bin/cfssl\nchmod +x /usr/local/bin/cfssljson\n"})}),"\n",(0,s.jsx)(l.h2,{id:"install-golang",children:"Install Golang"}),"\n",(0,s.jsx)(l.p,{children:"To install Golang, run the following commands:"}),"\n",(0,s.jsx)(l.pre,{children:(0,s.jsx)(l.code,{className:"language-bash",children:'wget "https://go.dev/dl/go1.22.5.linux-amd64.tar.gz"\nsudo tar -C /usr/local -xzf go*.tar.gz\nexport PATH=$PATH:/usr/local/go/bin\n'})}),"\n",(0,s.jsx)(l.h2,{id:"install-fabric-tools",children:"Install Fabric tools"}),"\n",(0,s.jsx)(l.p,{children:"To install the Fabric tools, run the following commands:"}),"\n",(0,s.jsx)(l.pre,{children:(0,s.jsx)(l.code,{className:"language-bash",children:"curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh \nchmod +x install-fabric.sh\n./install-fabric.sh --fabric-version 2.5.9 binary\n\n# and then move the binaries to your PATH\n\nmv bin/discover /usr/local/bin/discover\nmv bin/orderer /usr/local/bin/orderer\nmv bin/osnadmin /usr/local/bin/osnadmin\nmv bin/peer /usr/local/bin/peer\n"})}),"\n",(0,s.jsx)(l.h2,{id:"install-fabriclaunch",children:"Install fabriclaunch"}),"\n",(0,s.jsx)(l.p,{children:"To install fabriclaunch, run the following commands:"}),"\n",(0,s.jsx)(l.pre,{children:(0,s.jsx)(l.code,{className:"language-bash",children:"wget https://fabriclaunch.com/fabriclaunch \nchmod +x fabriclaunch \nmv fabriclaunch /usr/local/bin/fabriclaunch\n"})})]})}function h(n={}){const{wrapper:l}={...(0,t.R)(),...n.components};return l?(0,s.jsx)(l,{...n,children:(0,s.jsx)(d,{...n})}):d(n)}},1184:(n,l,e)=>{e.d(l,{R:()=>a,x:()=>r});var s=e(4041);const t={},i=s.createContext(t);function a(n){const l=s.useContext(i);return s.useMemo((function(){return"function"==typeof n?n(l):{...l,...n}}),[l,n])}function r(n){let l;return l=n.disableParentContext?"function"==typeof n.components?n.components(t):n.components||t:a(n.components),s.createElement(i.Provider,{value:l},n.children)}}}]);