import InvitationInstructions from '@/components/dashboard/onboarding/instructions'
import { getInvitationByToken } from '@/lib/logic'
import Link from 'next/link'
import { notFound } from 'next/navigation'

export default async function Page({
	searchParams,
}: {
	searchParams: {
		token: string
	}
}) {
	const invRes = await getInvitationByToken(searchParams.token)
	if (!invRes) {
		return notFound()
	}
	const { organization_invitation: invitation } = invRes
	if (invitation.status !== 'ACCEPTED') {
		return (
			<p>
				You have not accepted the invitation. <Link href="/dashboard">Go to dashboard</Link>
			</p>
		)
	}
	if (invitation.expiresAt < new Date()) {
		return (
			<p>
				This invitation has expired. Please ask the owner to send you a new one. <a href="/dashboard">Go to dashboard</a>
			</p>
		)
	}
	return <InvitationInstructions invitation={invRes} />
}
