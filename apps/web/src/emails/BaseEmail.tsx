// emails/BaseEmail.tsx
import { Html, Head, Preview, Body, Container, Tailwind } from 'jsx-email'

export interface BaseEmailProps {
	previewText: string
	children: React.ReactNode
}

export const BaseEmail: React.FC<BaseEmailProps> = ({ previewText, children }) => (
	<Html>
		<Head />
		<Preview>{previewText}</Preview>
		<Tailwind>
			<Body className="bg-gray-900 text-gray-100 font-sans">
				<Container className="max-w-2xl mx-auto p-8">
					<div className="bg-gray-800 rounded-lg p-6 shadow-lg">{children}</div>
					<p className="text-center text-gray-500 text-sm mt-6">© 2024 FabricLaunch. All rights reserved.</p>
				</Container>
			</Body>
		</Tailwind>
	</Html>
)
