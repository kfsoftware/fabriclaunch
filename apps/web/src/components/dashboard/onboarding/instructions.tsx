import { MDXPreview } from '@/components/mdx/MDXPreview'
import { OrganizationInvitationDB } from '@/db'
import { getInvitationByToken } from '@/lib/logic'
import { Button } from '@repo/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@repo/ui/card'
import Link from 'next/link'
import slugify from 'slugify'

export default function InvitationInstructions({ invitation: { tenant, organization_invitation: invitation } }: { invitation: Awaited<ReturnType<typeof getInvitationByToken>> }) {
	const slugifiedOrgName = slugify(invitation.orgName.toLowerCase())
	return (
		<div className="container mx-auto flex items-center justify-center min-h-screen">
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Instructions to join {tenant.name}</CardTitle>
					<CardDescription>Please read the following instructions carefully</CardDescription>
				</CardHeader>
				<CardContent>
					<ul className="list-disc pl-6 space-y-2">
						<li>You've been invited to join the consortium <span className='font-bold'>{tenant.name}</span> an organization on our platform.</li>
						<li>By accepting this invitation, you'll become a member of the organization.</li>
						<li>You'll have access to the organization's resources and channels.</li>
						<li>Make sure you understand your role and responsibilities within the organization.</li>
					</ul>
					<MDXPreview
						contents={`# Instructions to create and join the Hyperledger Fabric network

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

## Step 3: Create the organization

\`\`\`bash
fabriclaunch org create ${invitation.mspId} --type local

fabriclaunch org register ${invitation.mspId} --tenant=${tenant.slug}
\`\`\`

## Step 4: Create the nodes

\`\`\`bash
export TENANT_NAME="${tenant.slug}"

# create the peer
export ORG_REGION="<region>"
export PUBLIC_IP=$(curl ifconfig.me)
echo "Public IP: \${PUBLIC_IP}"
fabriclaunch peer create ${slugifiedOrgName}-peer0 --tenant \${TENANT_NAME} \\
  --mode=systemd --region="\${ORG_REGION}" --mspId ${invitation.mspId} \\
  --externalEndpoint="\${PUBLIC_IP}:7051" \\
  --listenAddress="0.0.0.0:7051" \\
  --chaincodeAddress="0.0.0.0:7052" \\
  --eventsAddress="0.0.0.0:7053" \\
  --operationsListenAddress="0.0.0.0:7054" \\
  -h localhost

# create the orderer
export PUBLIC_IP=$(curl ifconfig.me)
echo "Public IP: \${PUBLIC_IP}"
fabriclaunch orderer create ${slugifiedOrgName}-orderer0 --tenant \${TENANT_NAME} \\
  --mode=systemd --region="\${ORG_REGION}" --mspId ${invitation.mspId} \\
  --externalEndpoint="\${PUBLIC_IP}:7060" \\
  --listenAddress="0.0.0.0:7060" \\
  --adminAddress="0.0.0.0:7061" \\
  --operationsListenAddress="0.0.0.0:7062" \\
  -h localhost


\`\`\`


And you are all set!

Then, the consortium will need to add you to the channel.
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
