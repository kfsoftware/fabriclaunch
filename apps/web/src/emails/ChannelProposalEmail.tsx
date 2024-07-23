import { BaseEmail } from './BaseEmail'
import { Button, Section, Text } from 'jsx-email'

interface ChannelProposalEmailProps {
	recipientName: string
	channelName: string
	proposedBy: string
	proposalLink: string
}
export const PreviewProps = {
	recipientName: 'Alice',
	channelName: 'My Channel',
	proposedBy: 'Bob',
	proposalLink: 'https://example.com/proposal/123',
} as ChannelProposalEmailProps

const ChannelProposalEmail: React.FC<ChannelProposalEmailProps> = ({ recipientName, channelName, proposedBy, proposalLink }) => (
	<BaseEmail previewText={`New Channel Proposal: ${channelName}`}>
		<Section>
			<Text className="text-xl font-bold mb-4">New Channel Proposal</Text>
			<Text className="mb-4">Hello {recipientName},</Text>
			<Text className="mb-4">
				A new channel "{channelName}" has been proposed by {proposedBy}. Your review and approval are required.
			</Text>
			<Button href={proposalLink} className="bg-blue-600 text-white font-bold py-2 px-4 rounded hover:bg-blue-700">
				Review Proposal
			</Button>
			<Text className="mt-4 text-sm text-gray-400">If you're unable to click the button, please copy and paste this link into your browser: {proposalLink}</Text>
		</Section>
	</BaseEmail>
)

export default ChannelProposalEmail
