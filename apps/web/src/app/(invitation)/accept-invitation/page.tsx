import OnboardingForm from '@/components/dashboard/onboarding/form'
import { EXTERNAL_PUBLIC_URL } from '@/constants'
import { currentUser } from '@/lib/auth'
import { getInvitationByToken } from '@/lib/logic'
import { notFound, redirect } from 'next/navigation'

export default async function Page({
	searchParams,
}: {
	searchParams: {
		token: string
	}
}) {
	const user = await currentUser()
	if (!user) {
		return redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent(`${EXTERNAL_PUBLIC_URL}/accept-invitation?token=${searchParams.token}`)}`)
	}
	const invRes = await getInvitationByToken(searchParams.token)
	if (!invRes) {
		return notFound()
	}
	const { organization_invitation: invitation } = invRes
	if (invitation.status === 'ACCEPTED') {
		return (
			<p>
				You have already accepted the invitation. <a href="/dashboard">Go to dashboard</a>
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
	return <OnboardingForm invitation={invitation} />
}
