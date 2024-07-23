'use client'

import { UserRequestLoginDB } from '@/db'
import { acceptLoginRequestCLI } from '@/lib/logic'
import { Button } from '@repo/ui/button'
import { TerminalIcon } from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
export default function LoginPageCLI({ loginReq }: { loginReq: UserRequestLoginDB }) {
	const [submitting, setSubmitting] = useState(false)
	const confirmLogin = async () => {
		setSubmitting(true)
		try {
			const redirectUri = await acceptLoginRequestCLI(loginReq.id)
			console.log('Logged in successfully!', redirectUri)
			location.href = redirectUri
		} catch (e) {
			toast.error(e.message)
		} finally {
			setSubmitting(false)
		}
	}
	return (
		<div className="flex min-h-[100dvh] flex-col items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto max-w-md text-center">
				<TerminalIcon className="mx-auto h-12 w-12 text-primary" />
				<h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">Confirm CLI Login</h1>
				<p className="mt-4 text-muted-foreground">To complete the login process, please enter the following code into your terminal:</p>
				<div className="mt-6 rounded-md bg-muted p-4">
					<p className="text-2xl font-bold">{loginReq.code}</p>
				</div>
				<div className="mt-6">
					<Button
						disabled={submitting}
						className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
						onClick={async () => {
							console.log('Logged in successfully!')
							await confirmLogin()
						}}
					>
						Confirm Login
					</Button>
				</div>
			</div>
		</div>
	)
}
