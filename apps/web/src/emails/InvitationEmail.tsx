import { Html, Head, Body, Container, Section, Text, Button, Tailwind } from 'jsx-email'

interface InvitationEmailProps {
	invitationLink: string
	expiresAt: string
}
export const PreviewProps = {
	invitationLink: 'https://example.com/invitation/123',
	expiresAt: '2023-01-01',
} as InvitationEmailProps

const InvitationEmail = ({ invitationLink, expiresAt }: InvitationEmailProps) => {
	return (
		<Html>
			<Head />
			<Tailwind>
				<Body className="bg-[#0e0d0f] text-[#e5e3da] font-sans">
					<Container className="max-w-2xl mx-auto my-8 bg-[#1a1919] rounded-lg shadow-lg overflow-hidden">
						<Section className="bg-[#e5e5e5] p-8 text-center">
							<Text className="text-3xl font-bold text-[#000000]">Organization Invitation</Text>
						</Section>
						<Section className="p-8">
							<Text className="text-[#d9d7cc] text-lg mb-6">
								You've been invited to join and create an organization on our platform.
							</Text>
							<Text className="text-[#d9d7cc] mb-6">Click the button below to accept the invitation:</Text>
							<Container className="w-full">
								<Button href={invitationLink} className="bg-[#e5e5e5] text-[#000000] py-3 px-6 rounded-md font-semibold text-center block mr-12">
									Accept Invitation
								</Button>
							</Container>
							<Text className="text-sm text-[#d9d7cc] mt-6">This invitation expires on {expiresAt}.</Text>
						</Section>
						<Section className="bg-[#262626] p-8 text-center">
							<Text className="text-sm text-[#d9d7cc]">If you have any questions, please contact our support team.</Text>
						</Section>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	)
}

export default InvitationEmail
