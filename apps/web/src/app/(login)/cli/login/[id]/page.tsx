import LoginPageCLI from '@/components/auth/LoginPage'
import { currentUser } from '@/lib/auth'
import { getLoginRequestCLI } from '@/lib/logic'
import { redirect } from 'next/navigation'

export default async function CLILogin({
	params: { id },
}: {
	params: {
		id: string
	}
}) {
	const user = await currentUser()
	if (!user) {
		return redirect(`/api/auth/signin?callbackUrl=/cli/login/${id}`)
	}
	const loginReq = await getLoginRequestCLI(id)
	if (!loginReq) {
		return <p>Invalid login request</p>
	}
	return (
		<>
			<LoginPageCLI loginReq={loginReq} />
		</>
	)
}
