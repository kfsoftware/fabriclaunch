"use strict";(self.webpackChunkfabriclaunch_docs=self.webpackChunkfabriclaunch_docs||[]).push([[5899],{9560:(e,n,a)=>{a.r(n),a.d(n,{assets:()=>o,contentTitle:()=>s,default:()=>h,frontMatter:()=>r,metadata:()=>c,toc:()=>l});var i=a(1085),t=a(1184);const r={sidebar_position:1},s="Introduction to FabricLaunch222",c={id:"introduction",title:"Introduction to FabricLaunch222",description:"The Onboarding Challenge",source:"@site/docs/introduction.md",sourceDirName:".",slug:"/introduction",permalink:"/fabriclaunch/docs/introduction",draft:!1,unlisted:!1,editUrl:"https://github.com/facebook/docusaurus/tree/main/packages/create-docusaurus/templates/shared/docs/introduction.md",tags:[],version:"current",sidebarPosition:1,frontMatter:{sidebar_position:1},sidebar:"tutorialSidebar",next:{title:"Getting started",permalink:"/fabriclaunch/docs/getting-started"}},o={},l=[{value:"The Onboarding Challenge",id:"the-onboarding-challenge",level:2},{value:"FabricLaunch: Streamlining Fabric Network Onboarding",id:"fabriclaunch-streamlining-fabric-network-onboarding",level:2},{value:"Key Features",id:"key-features",level:3},{value:"FabricLaunch Components",id:"fabriclaunch-components",level:2},{value:"Component Interaction",id:"component-interaction",level:2},{value:"System architecture",id:"system-architecture",level:3},{value:"Baremetal Deployment Approach",id:"baremetal-deployment-approach",level:2},{value:"Use Cases",id:"use-cases",level:2},{value:"Next Steps",id:"next-steps",level:2}];function d(e){const n={h1:"h1",h2:"h2",h3:"h3",li:"li",mermaid:"mermaid",ol:"ol",p:"p",ul:"ul",...(0,t.R)(),...e.components};return(0,i.jsxs)(i.Fragment,{children:[(0,i.jsx)(n.h1,{id:"introduction-to-fabriclaunch222",children:"Introduction to FabricLaunch222"}),"\n",(0,i.jsx)(n.h2,{id:"the-onboarding-challenge",children:"The Onboarding Challenge"}),"\n",(0,i.jsx)(n.p,{children:"Deploying and managing Hyperledger Fabric networks is complex and time-consuming, often taking weeks or months. This process requires expertise in:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Cryptography"}),"\n",(0,i.jsx)(n.li,{children:"Kubernetes"}),"\n",(0,i.jsx)(n.li,{children:"Containers"}),"\n",(0,i.jsx)(n.li,{children:"Docker"}),"\n",(0,i.jsx)(n.li,{children:"Hyperledger Fabric specifics"}),"\n"]}),"\n",(0,i.jsx)(n.p,{children:"These requirements can significantly slow down blockchain adoption and limit its potential impact."}),"\n",(0,i.jsx)(n.h2,{id:"fabriclaunch-streamlining-fabric-network-onboarding",children:"FabricLaunch: Streamlining Fabric Network Onboarding"}),"\n",(0,i.jsx)(n.p,{children:"FabricLaunch automates the onboarding of new organizations to existing Hyperledger Fabric networks. Our focus is on baremetal deployment, without Docker or Kubernetes, making it easier for IT teams familiar with traditional server management."}),"\n",(0,i.jsx)(n.h3,{id:"key-features",children:"Key Features"}),"\n",(0,i.jsxs)(n.ol,{children:["\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsx)(n.p,{children:"Decentralized\nSpread onboarding tasks across your organization. Reduce bottlenecks."}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsx)(n.p,{children:"Governance\nMaintain control and compliance with unified rules."}),"\n"]}),"\n",(0,i.jsxs)(n.li,{children:["\n",(0,i.jsx)(n.p,{children:"Automation\nStreamline processes. Save time and reduce errors."}),"\n"]}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"fabriclaunch-components",children:"FabricLaunch Components"}),"\n",(0,i.jsxs)(n.ol,{children:["\n",(0,i.jsx)(n.li,{children:"FabricLaunch CLI"}),"\n",(0,i.jsx)(n.li,{children:"FabricLaunch Platform"}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"component-interaction",children:"Component Interaction"}),"\n",(0,i.jsx)(n.p,{children:"The following diagrams illustrate the interaction between FabricLaunch components."}),"\n",(0,i.jsx)(n.mermaid,{value:'graph TD\n    A["Client Machine"]\n    B["\ud83d\udee0\ufe0f CLI"]\n    C["Peers"]\n    D["Orderers"]\n    E["Governance Tasks"]\n    F["API"]\n    G[("\ud83d\ude80 FabricLaunch Platform")]\n    H{"Public Data Store"}\n    I["Organizations Data"]\n    J["Peers Data"]\n    K["Orderers Data"]\n    L["Governance Data"]\n    M["Chaincode Tasks"]\n\n    A --\x3e|Installs| B\n    B --\x3e|Starts| C\n    B --\x3e|Starts| D\n    B --\x3e|Connects via| F\n    B --\x3e|Performs| M\n    M --\x3e|Install/Approve/Commit| C\n    F --\x3e|Performs| E\n    F <--\x3e|Interacts with| G\n    G --\x3e|Stores in| H\n    H --\x3e|Includes| I\n    H --\x3e|Includes| J\n    H --\x3e|Includes| K\n    H --\x3e|Includes| L\n\n    classDef client fill:#f9f0ff,stroke:#9933ff,stroke-width:2px;\n    classDef cli fill:#e6f3ff,stroke:#0066cc,stroke-width:2px;\n    classDef component fill:#e6ffe6,stroke:#009933,stroke-width:2px;\n    classDef api fill:#fff0e6,stroke:#ff6600,stroke-width:2px;\n    classDef platform fill:#ffffe6,stroke:#cccc00,stroke-width:2px;\n    classDef datastore fill:#ffe6e6,stroke:#cc0000,stroke-width:2px;\n    classDef data fill:#f0f0f0,stroke:#666666,stroke-width:1px;\n\n    class A client;\n    class B cli;\n    class C,D,E,M component;\n    class F api;\n    class G platform;\n    class H datastore;\n    class I,J,K,L data;'}),"\n",(0,i.jsx)(n.h3,{id:"system-architecture",children:"System architecture"}),"\n",(0,i.jsx)(n.p,{children:"The FabricLaunch CLI interacts with the FabricLaunch Platform API to perform governance tasks and chaincode tasks. The FabricLaunch Platform stores data in a public data store, which includes organization data, peers data, orderers data, and governance data."}),"\n",(0,i.jsx)(n.mermaid,{value:'graph TD\n    A["\ud83d\udee0\ufe0f CLI"]\n    B["File System"]\n    C["Configuration Files"]\n    D["Crypto Materials"]\n    E["Chaincode Source"]\n    F["\ud83d\udd0c API"]\n    G[("\ud83d\ude80 FabricLaunch Platform")]\n    H[("Amazon S3")]\n    I[("PostgreSQL")]\n    \n    A --\x3e|Reads/Writes| B\n    B --\x3e|Contains| C\n    B --\x3e|Contains| D\n    B --\x3e|Contains| E\n    A --\x3e|Connects to| F\n    F <--\x3e|Interacts with| G\n    G --\x3e|Stores Chaincode| H\n    G --\x3e|Stores Non Private Data| I\n    \n    subgraph "Client Machine"\n        A\n        B\n        C\n        D\n        E\n    end\n    \n    subgraph "Cloud Infrastructure"\n        G\n        H\n        I\n    end\n\n    classDef cli fill:#e6f3ff,stroke:#0066cc,stroke-width:2px;\n    classDef fs fill:#f0f0f0,stroke:#666666,stroke-width:1px;\n    classDef api fill:#fff0e6,stroke:#ff6600,stroke-width:2px;\n    classDef platform fill:#ffffe6,stroke:#cccc00,stroke-width:2px;\n    classDef storage fill:#e6ffe6,stroke:#009933,stroke-width:2px;\n\n    class A cli;\n    class B,C,D,E fs;\n    class F api;\n    class G platform;\n    class H,I storage;\n'}),"\n",(0,i.jsx)(n.h2,{id:"baremetal-deployment-approach",children:"Baremetal Deployment Approach"}),"\n",(0,i.jsx)(n.p,{children:"We focus on baremetal deployment because:"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"It's a common deployment method for Fabric networks"}),"\n",(0,i.jsx)(n.li,{children:"Most IT teams are familiar with managing baremetal servers"}),"\n",(0,i.jsx)(n.li,{children:"It offers more direct control over resources"}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"use-cases",children:"Use Cases"}),"\n",(0,i.jsxs)(n.ul,{children:["\n",(0,i.jsx)(n.li,{children:"Enterprise blockchain adoption"}),"\n",(0,i.jsx)(n.li,{children:"Multi-organization consortiums"}),"\n",(0,i.jsx)(n.li,{children:"Regulatory compliance in blockchain networks"}),"\n"]}),"\n",(0,i.jsx)(n.h2,{id:"next-steps",children:"Next Steps"}),"\n",(0,i.jsx)(n.p,{children:"Coming soon: FabricLaunch CLI installation and usage instructions. Stay tuned!"})]})}function h(e={}){const{wrapper:n}={...(0,t.R)(),...e.components};return n?(0,i.jsx)(n,{...e,children:(0,i.jsx)(d,{...e})}):d(e)}}}]);