import { MDXPreview } from '@/components/mdx/MDXPreview'
import { NodeDB, OrganizationDB } from '@/db'
import { getChaincodeProposalBySlug } from '@/lib/logic'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/card'
import Link from 'next/link'

export default function ChaincodeProposalInstructions({
	organization: org,
	peers,
	orderers,
	proposal: { tenant, chaincode_proposal: proposal, organization: proposedOrg },
}: {
	organization: OrganizationDB
	peers: NodeDB[]
	orderers: NodeDB[]
	proposal: Awaited<ReturnType<typeof getChaincodeProposalBySlug>>
}) {
	return (
		<div className="container mx-auto flex items-center justify-center min-h-screen">
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Chaincode deployment instructions for {org.mspId}</CardTitle>
					<CardDescription>Please read the following instructions carefully</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="list-disc pl-6 space-y-2">
						<li>You've been invited to join an organization on our platform.</li>
						<li>By accepting this invitation, you'll become a member of the organization.</li>
						<li>You'll have access to the organization's resources and channels.</li>
						<li>Make sure you understand your role and responsibilities within the organization.</li>
					</ul>
					<MDXPreview
						contents={`# Instructions to accept the chaincode and installing

## Step 1: Install pre requisites

At the time of writing, fabriclaunch has only been tested with Ubuntu 22.04 and 24.04.

These are the tools you'll need to install:

- **cfssl**: to generate TLS certificates
- **Golang**: to run chaincodes
- **Fabric tools**: to interact with the Hyperledger Fabric network, including: 
   + **peer**: to run peers
   + **orderer**: to run orderers
   + **osnadmin**: to join the ordering service nodes to the channel
   + **discover**: to discover peers in the channel
- **fabriclaunch**: to create and manage your Hyperledger Fabric network


### Install cfssl

To install cfssl, run the following commands:

\`\`\`bash
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssl_1.6.5_linux_amd64 -O /usr/local/bin/cfssl
wget https://github.com/cloudflare/cfssl/releases/download/v1.6.5/cfssljson_1.6.5_linux_amd64 -O /usr/local/bin/cfssljson
chmod +x /usr/local/bin/cfssl
chmod +x /usr/local/bin/cfssljson
\`\`\`

### Install Golang

To install Golang, run the following commands:

\`\`\`bash
wget "https://go.dev/dl/go1.22.5.linux-amd64.tar.gz"
sudo tar -C /usr/local -xzf go*.tar.gz
export PATH=$PATH:/usr/local/go/bin
\`\`\`

### Install Fabric tools

To install the Fabric tools, run the following commands:

\`\`\`bash
curl -sSLO https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/install-fabric.sh 
chmod +x install-fabric.sh
./install-fabric.sh --fabric-version 2.5.9 binary

# and then move the binaries to your PATH

mv bin/discover /usr/local/bin/discover
mv bin/orderer /usr/local/bin/orderer
mv bin/osnadmin /usr/local/bin/osnadmin
mv bin/peer /usr/local/bin/peer
\`\`\`


### Install fabriclaunch

To install fabriclaunch, run the following commands:

\`\`\`bash
wget https://fabriclaunch.com/fabriclaunch 
chmod +x fabriclaunch 
mv fabriclaunch /usr/local/bin/fabriclaunch
\`\`\`

## Step 2: Login to fabriclaunch


\`\`\`bash
fabriclaunch auth login
\`\`\`

## Step 3: Accept the proposal

\`\`\`bash
export TENANT_NAME="${tenant.slug}"
export CH_PROPOSAL_ID="${proposal.slug}"

export CHAINCODE_ADDRESS="127.0.0.1:20000" # important! choose a different port for each chaincode

fabriclaunch chaincode accept \${CH_PROPOSAL_ID} -o ${org.mspId} --chaincodeAddress="\${CHAINCODE_ADDRESS}" --tenant \${TENANT_NAME}

\`\`\`


## Step 4: Run the chaincode

\`\`\`bash
export TENANT_NAME="${tenant.slug}"
export CH_PROPOSAL_ID="${proposal.slug}"
export CHAINCODE_ADDRESS="127.0.0.1:20000" # important! choose a different port for each chaincode

fabriclaunch chaincode run \${CH_PROPOSAL_ID} --tenant \${TENANT_NAME} --mode=systemd --download \\
	--org=${org.mspId} --chaincodeAddress="\${CHAINCODE_ADDRESS}"

\`\`\`


## Step 5: Commit the chaincode (optional)
This command will only work if the policies on Hyperledger Fabric are met. In other words, if the majority of the organizations have accepted the chaincode.
\`\`\`bash
export TENANT_NAME="${tenant.slug}"
export CH_PROPOSAL_ID="${proposal.slug}"

fabriclaunch chaincode commit \${CH_PROPOSAL_ID} -o ${org.mspId} --tenant \${TENANT_NAME}

\`\`\`


## Step 6: Test the chaincode (optional)
This command will only work if the chaincode has been committed at least once and the chaincode is running.


If the chaincode installed is the asset one, you can run the following command to initialize the assets:
\`\`\`bash
export TENANT_NAME="${tenant.slug}"
export CHANNEL_NAME="${proposal.slug}"

fabriclaunch chaincode invoke --channel=${proposal.channelName} --name=${proposal.chaincodeName} \\
	 --org=${org.mspId} --call '{"function":"InitLedger","Args":[]}'
\`\`\`

If the chaincode installed is the asset one, you can run the following command to query all the assets:
\`\`\`bash
export TENANT_NAME="${tenant.slug}"
export CHANNEL_NAME="${proposal.slug}"

fabriclaunch chaincode query --channel=${proposal.channelName} --name=${proposal.chaincodeName} \\
	 --org=${org.mspId} --call '{"function":"GetAllAssets","Args":[]}'

\`\`\`

And you are all set!
`}
						withWrapper={true}
					/>
				</CardContent>
				<CardFooter>
					<Button asChild>
						<Link href={`/dashboard/${tenant.slug}`}>Next</Link>
					</Button>
				</CardFooter>
			</Card>
		</div>
	)
}
