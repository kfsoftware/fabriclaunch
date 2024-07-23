import Link from 'next/link'
import { CircleCheckIcon } from 'lucide-react'

export default function Page() {
	return (
		<div className="w-full min-h-screen bg-background text-foreground">
			<div className="container mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-24 lg:py-32 flex flex-col items-center justify-center">
				<div className="space-y-4 text-center">
					<CircleCheckIcon className="h-16 w-16 text-green-500 mb-4 mx-auto" />
					<h1 className="text-3xl font-bold">Organization Added Successfully</h1>
					<p className="text-muted-foreground">Your new organization has been invited to the Hyperledger Fabric network.</p>
				</div>
				<div className="mt-6 space-y-4">
					<p>He  will receive an email with instructions on how to join the network.</p>
					<div className="flex justify-center">
						<Link
							href="/dashboard"
							className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
							prefetch={false}
						>
							Go to Dashboard
						</Link>
					</div>
				</div>
			</div>
		</div>
	)
}
