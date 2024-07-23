import LoginPage2 from '@/components/auth/LoginPage2'
import { auth, nextAuthConfig } from '@/auth'
import { createCSRFToken, getProviders } from '@/lib/auth'
import { cookies } from 'next/headers'
import { getCsrfToken } from 'next-auth/react'
// import { getProviders } from 'next-auth/react'

export default async function SignIn({
	searchParams,
}: {
	searchParams: {
		callbackUrl: string
	}
}) {
	const providers = await getProviders()
	// const csrfTokenCookie = await cookies().get('csrfToken')
	// const csrfToken = await getCsrfToken()
	// const {
	// 	csrfToken,
	// 	cookie: csrfCookie,
	// 	csrfTokenVerified,
	// } = await createCSRFToken({
	// 	secret: process.env.NEXTAUTH_SECRET as string,
	// 	cookieValue: csrfTokenCookie?.value as string,
	// 	isPost: false,
	// 	bodyValue: '',
	// })
	// console.log('csrfToken', csrfToken)
	// console.log('csrfToken', csrfToken)

	// cookies().set('csrfToken', csrfToken, {
	// 	name: 'csrfToken',
	// })
	console.log('providers', providers)
	return <LoginPage2 providers={providers} callbackUrl={searchParams.callbackUrl} />
}
