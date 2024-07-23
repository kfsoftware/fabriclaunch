import ProfileDropdown from '@/components/dashboard/auth/ProfileDropdown'
import TenantSelector from '@/components/dashboard/tenant/selector'
import { currentUser } from '@/lib/auth'
import { getTenantBySlugAndUserId, getTenantsByUserId } from '@/lib/logic'
import { BitcoinIcon, Building2Icon, CableIcon, DockIcon, HistoryIcon, NetworkIcon } from 'lucide-react'
import Link from 'next/link'
import { redirect } from 'next/navigation'
import { ReactNode } from 'react'
export default async function Layout({
	children,
	params,
}: {
	children: ReactNode
	params: {
		tenantslug: string
	}
}) {
	const user = await currentUser()
	if (!user) return redirect('/api/auth/signin?callbackUrl=/dashboard')
	const tenant = await getTenantBySlugAndUserId(params.tenantslug, user.id)
	console.log('user id', user.id)
	if (!tenant) {
		const tenants = await getTenantsByUserId(user.id)
		if (!tenants.length) {
			return redirect(`/onboarding`)
		}
		return redirect(`/dashboard/${tenants[0].tenant.slug}`)
	}
	return (
		<div className="grid min-h-screen w-full overflow-hidden lg:grid-cols-[280px_1fr]">
			<div className="flex flex-col gap-2 border-r bg-muted/40">
				<div className="flex h-[60px] items-center px-6">
					<Link href="#" className="flex items-center gap-2 font-semibold" prefetch={false}>
						{/* <BitcoinIcon className="h-6 w-6" /> */}
						<span className="">Fabric Launch</span>
					</Link>
				</div>
				<div className="flex-1">
					<nav className="grid items-start px-4 text-sm font-medium">
						<Link
							href={`/dashboard/${params.tenantslug}`}
							className="flex items-center gap-3 rounded-lg bg-accent px-3 py-2 text-accent-foreground transition-all hover:bg-accent/90"
							prefetch={false}
						>
							<NetworkIcon className="h-4 w-4" />
							Organizations
						</Link>
						<Link
							href={`/dashboard/${params.tenantslug}/proposals/channels`}
							className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
							prefetch={false}
						>
							<CableIcon className="h-4 w-4" />
							Channel Management
						</Link>
						<Link
							href={`/dashboard/${params.tenantslug}/proposals/chaincodes`}
							className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
							prefetch={false}
						>
							<DockIcon className="h-4 w-4" />
							Chaincodes
						</Link>
						<Link
							href={`/dashboard/${params.tenantslug}/audit-logs`}
							className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
							prefetch={false}
						>
							<HistoryIcon className="h-4 w-4" />
							Audit logs
						</Link>
						<Link
							href={`/dashboard/${params.tenantslug}/onboarding`}
							className="flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary"
							prefetch={false}
						>
							<Building2Icon className="h-4 w-4" />
							Onboarding
						</Link>
					</nav>
				</div>
			</div>
			<div className="flex flex-col">
				<header className="flex h-14 lg:h-[60px] items-center gap-4 border-b bg-muted/40 px-6">
					<Link href="#" className="lg:hidden" prefetch={false}>
						{/* <BitcoinIcon className="h-6 w-6" />
						<span className="sr-only">Home</span> */}
					</Link>
					<div className="flex-1">
						{/* <h1 className="font-semibold text-lg">Fabric Launch</h1> */}
						<TenantSelector tenantSlug={params.tenantslug} />
					</div>
					<div className="flex flex-1 items-center gap-4 md:ml-auto md:gap-2 lg:gap-4">
						<form className="ml-auto flex-1 sm:flex-initial"></form>
						<ProfileDropdown user={user} />
					</div>
				</header>
				<main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">{children}</main>
			</div>
		</div>
	)
}
