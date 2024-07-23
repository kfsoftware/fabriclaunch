'use client'
import { toast } from 'sonner'
import { Button } from '@repo/ui/button'
import { Input } from '@repo/ui/input'
import { Label } from '@repo/ui/label'
import { signIn } from 'next-auth/react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { getProviders } from '@/lib/auth'
import { EXTERNAL_PUBLIC_URL } from '@/constants'

export default function LoginPage2({ callbackUrl, providers }: { callbackUrl: string; providers: Awaited<ReturnType<typeof getProviders>> }) {
	const [email, setEmail] = useState('')
	const [password, setPassword] = useState('')

	const router = useRouter()
	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault()
		const result = await signIn('credentials', {
			email,
			password,
			redirect: false,
			callbackUrl: callbackUrl || '/dashboard',
		})
		if (result?.error) {
			// Handle error (e.g., show error message)
			toast.error(`Sign in failed: ${result.error}`)
		} else {
			console.log('Sign in successful', result)
			// Redirect to dashboard on successful sign in
			const url = new URL(result.url)
			// push with pathname and search params
			router.push(`${url.pathname}${url.search ? `${url.search}` : ''}`)
		}
	}

	const handleGithubSignIn = () => {
		signIn('github', {
			redirect: true,
			callbackUrl: callbackUrl || `${EXTERNAL_PUBLIC_URL}/dashboard`,
		})
	}

	return (
		<div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-12 sm:px-6 lg:px-8">
			<div className="mx-auto w-full max-w-md space-y-8">
				<div>
					<h2 className="mt-6 text-center text-3xl font-bold tracking-tight text-foreground">Sign in to your account</h2>
					<p className="mt-2 text-center text-sm text-muted-foreground">
						Or{' '}
						<Link href="/signup" className="font-medium text-primary hover:text-primary/80">
							sign up for a new account
						</Link>
					</p>
				</div>
				<form className="space-y-6" onSubmit={handleSubmit}>
					<div>
						<Label htmlFor="email" className="block text-sm font-medium text-muted-foreground">
							Email address
						</Label>
						<div className="mt-1">
							<Input
								id="email"
								name="email"
								type="email"
								autoComplete="email"
								required
								value={email}
								onChange={(e) => setEmail(e.target.value)}
								className="block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
							/>
						</div>
					</div>
					<div>
						<div className="flex items-center justify-between">
							<Label htmlFor="password" className="block text-sm font-medium text-muted-foreground">
								Password
							</Label>
							<div className="text-sm">
								<Link href="/forgot-password" className="font-medium text-primary hover:text-primary/80">
									Forgot your password?
								</Link>
							</div>
						</div>
						<div className="mt-1">
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								className="block w-full appearance-none rounded-md border border-input bg-background px-3 py-2 placeholder-muted-foreground shadow-sm focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary sm:text-sm"
							/>
						</div>
					</div>
					<div>
						<Button
							type="submit"
							className="flex w-full justify-center rounded-md bg-primary px-3 py-2 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
						>
							Sign in
						</Button>
					</div>
				</form>
				<div className="relative">
					<div className="absolute inset-0 flex items-center">
						<div className="w-full border-t border-muted" />
					</div>
					<div className="relative flex justify-center text-sm">
						<span className="bg-background px-2 text-muted-foreground">Or continue with</span>
					</div>
				</div>
				{providers
					.filter((i) => i.type === 'oauth')
					.map((provider) => (
						<Button
							type="submit"
							variant="outline"
							className="flex w-full justify-center rounded-md border-gray-300 bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm hover:bg-gray-50"
							onClick={handleGithubSignIn}
						>
							<GithubIcon className="mr-2 h-5 w-5" />
							Sign in with {provider.name}
						</Button>
					))}
			</div>
		</div>
	)
}

function GithubIcon(props) {
	return (
		<svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
			<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
			<path d="M9 18c-4.51 2-5-2-7-2" />
		</svg>
	)
}
