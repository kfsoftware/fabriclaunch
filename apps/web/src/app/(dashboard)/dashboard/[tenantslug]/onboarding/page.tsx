/**
 * v0 by Vercel.
 * @see https://v0.dev/t/WsfogkTgeCL
 * Documentation: https://v0.dev/docs#integrating-generated-code-into-your-nextjs-app
 */
import OnboardingSubmitForm from '@/components/dashboard/onboarding/submit'
import { currentUser } from '@/lib/auth'
import { getTenantBySlugAndUserId, getTenantsByUserId } from '@/lib/logic'
import { redirect } from 'next/navigation'

export default async function Page({
	params,
}: {
	params: {
		tenantslug: string
	}
}) {
	const user = await currentUser()
	if (!user) return redirect('/api/auth/signin')
	const tenant = await getTenantBySlugAndUserId(params.tenantslug, user.id)
	if (!tenant) {
		const tenants = await getTenantsByUserId(user.id)
		return redirect(`/dashboard/${tenants[0].tenant.slug}`)
	}
	return (
		<div className="w-full min-h-screen ">
			<div className="container mx-auto max-w-4xl px-4 md:px-6 py-12 md:py-24 lg:py-32">
				<div className="space-y-4">
					<h1 className="text-3xl font-bold">Add New Organization</h1>
					<p className="text-muted-foreground">Add a new Hyperledger Fabric organization to the channel.</p>
				</div>
				<div className="mt-6 space-y-4">
					<p>To add a new organization to the Hyperledger Fabric network, follow these steps:</p>
					<ol className="space-y-2 list-decimal pl-6">
						<li>Use the FabricLaunch tool to generate the necessary configuration files for your organization.</li>
						<li>Fill out the form below with the organization name, email address, and optional MSP ID for your organization.</li>
						<li>Once submitted, you will receive an email with instructions on how to join the network.</li>
					</ol>
				</div>
				<div className="mt-8">
					<OnboardingSubmitForm tenant={tenant} />
				</div>
			</div>
		</div>
	)
}
