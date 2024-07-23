// emails/ChaincodeProposalEmail.tsx
import { BaseEmail } from './BaseEmail'
import { Button, Section, Text } from 'jsx-email'

interface ChaincodeProposalEmailProps {
	recipientName: string
	chaincodeName: string
	channelName: string
	proposedBy: string
	proposalLink: string
}

const ChaincodeProposalEmail: React.FC<ChaincodeProposalEmailProps> = ({ recipientName, chaincodeName, channelName, proposedBy, proposalLink }) => (
	<BaseEmail previewText={`New Chaincode Proposal: ${chaincodeName}`}>
		<Section>
			<Text className="text-xl font-bold mb-4">New Chaincode Proposal</Text>
			<Text className="mb-4">Hello {recipientName},</Text>
			<Text className="mb-4">
				A new chaincode "{chaincodeName}" has been proposed for the channel "{channelName}" by {proposedBy}. Your review and approval are required.
			</Text>
			<Button href={proposalLink} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
				Review Proposal
			</Button>
			<Text className="mt-4 text-sm text-gray-400">If you're unable to click the button, please copy and paste this link into your browser: {proposalLink}</Text>
		</Section>
	</BaseEmail>
)

export default ChaincodeProposalEmail