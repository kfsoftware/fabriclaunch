import { Loom } from '@/components/landing/Loom'
import Link from 'next/link'
import { Server, Building2, Network, GitBranch, ExternalLink, ClipboardList, Terminal, Cloud, Users, Lock } from 'lucide-react'
import Image from 'next/image'

export default function Page() {
	return (
		<div className="flex flex-col min-h-[100dvh]">
			<header className="px-4 lg:px-6 h-14 flex items-center">
				<Link href="/" className="flex items-center justify-center" prefetch={false}>
					<Image src="/logo_transparent.png" width="40" height="40" alt="Logo" />
					<span className="font-bold text-3xl">FabricLaunch</span>
					<span className="sr-only">Hyperledger Fabric Management Platform</span>
				</Link>
				<nav className="ml-auto flex gap-4 sm:gap-6">
					<Link href="#features" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
						Features
					</Link>
					<Link href="#contact" className="text-sm font-medium hover:underline underline-offset-4" prefetch={false}>
						Contact
					</Link>
				</nav>
			</header>
			<main className="flex-1">
				<section className="w-full py-12 md:py-24 lg:py-32">
					<div className="mx-0 px-4 md:px-6">
						<div className="grid gap-6 lg:grid-cols-[1fr_400px] lg:gap-12 xl:grid-cols-[1fr_800px]">
							<div className="flex flex-col justify-center space-y-4">
								<div className="space-y-2">
									<h1 className="text-3xl font-bold tracking-tighter sm:text-5xl xl:text-6xl/none">Decentralized Hyperledger Fabric Platform made easy </h1>
									<p className="max-w-[600px] text-muted-foreground md:text-xl">
										Streamline your Hyperledger Fabric network with our comprehensive management platform. From node creation to chaincode governance, we've got you covered.
									</p>
								</div>
								<div className="flex flex-col gap-2 min-[400px]:flex-row">
									<Link
										href="https://www.loom.com/share/434f5af313ef447d9268c9fd448be31c"
										target="_blank"
										className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
										prefetch={false}
									>
										View demo
									</Link>
									<Link
										href="mailto:contact@fabriclaunch.com"
										className="inline-flex h-10 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
										prefetch={false}
									>
										Contact us
									</Link>
								</div>
							</div>
							<Loom src="https://www.loom.com/embed/434f5af313ef447d9268c9fd448be31c" />
						</div>
					</div>
				</section>
				<section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-muted">
					<div className="px-4 md:px-6">
						<div className="flex flex-col items-center justify-center space-y-4 text-center">
							<div className="space-y-2">
								<div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Comprehensive Fabric Management</div>
								<h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Powerful Features for Your Fabric Network</h2>
								<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									Our platform provides all the tools you need to manage your Hyperledger Fabric network efficiently and securely.
								</p>
							</div>
						</div>
						<div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
							<div className="flex flex-col justify-center space-y-4">
								<ul className="grid gap-6">
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<Server className="mr-2" /> Node Management
											</h3>
											<p className="text-muted-foreground">Create and manage peers, orderers, and CAs with ease. Run nodes locally or integrate with existing infrastructure.</p>
										</div>
									</li>
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<Building2 className="mr-2" /> Organization Management
											</h3>
											<p className="text-muted-foreground">Create and upload organizations, manage MSP IDs, and handle multi-org setups effortlessly.</p>
										</div>
									</li>
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<Network className="mr-2" /> Channel Management
											</h3>
											<p className="text-muted-foreground">Create channel configs, join channels, and manage channel updates with built-in governance features.</p>
										</div>
									</li>
								</ul>
							</div>
							<div className="flex flex-col justify-center space-y-4">
								<ul className="grid gap-6">
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<GitBranch className="mr-2" /> Chaincode Lifecycle Management
											</h3>
											<p className="text-muted-foreground">Deploy, approve, and commit chaincodes with our streamlined governance process.</p>
										</div>
									</li>
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<ExternalLink className="mr-2" /> External Chaincode Execution
											</h3>
											<p className="text-muted-foreground">Run chaincodes as external services and execute transactions seamlessly.</p>
										</div>
									</li>
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<ClipboardList className="mr-2" /> Comprehensive Logging
											</h3>
											<p className="text-muted-foreground">Keep track of all operations with detailed logs for chaincode commits, node joins, approvals, and more.</p>
										</div>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				<section className="w-full py-12 md:py-24 lg:py-32">
					<div className="px-4 md:px-6">
						<div className="flex flex-col items-center justify-center space-y-4 text-center">
							<div className="space-y-2">
								<div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">Simplified Workflow</div>
								<h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Streamlined Fabric Network Management</h2>
								<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									Our platform simplifies complex Hyperledger Fabric operations, allowing you to focus on building your blockchain applications.
								</p>
							</div>
						</div>
						<div className="mx-auto grid max-w-5xl items-center gap-6 py-12 lg:grid-cols-2 lg:gap-12">
							<div className="flex flex-col justify-center space-y-4">
								<ul className="grid gap-6">
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<Terminal className="mr-2" /> Local CLI Tools
											</h3>
											<p className="text-muted-foreground">Manage your Fabric network components locally with our powerful CLI tools.</p>
										</div>
									</li>
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<Cloud className="mr-2" /> Platform Integration
											</h3>
											<p className="text-muted-foreground">Seamlessly integrate local components with our cloud platform for centralized management.</p>
										</div>
									</li>
								</ul>
							</div>
							<div className="flex flex-col justify-center space-y-4">
								<ul className="grid gap-6">
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<Users className="mr-2" /> Governance Workflows
											</h3>
											<p className="text-muted-foreground">Implement decentralized decision-making for chaincode and channel updates.</p>
										</div>
									</li>
									<li>
										<div className="grid gap-1">
											<h3 className="text-xl font-bold flex items-center">
												<Lock className="mr-2" /> Secure Authentication
											</h3>
											<p className="text-muted-foreground">Login and register securely using PIN codes and remote authentication.</p>
										</div>
									</li>
								</ul>
							</div>
						</div>
					</div>
				</section>

				<section id="contact" className="w-full py-12 md:py-24 lg:py-32">
					<div className="px-4 md:px-6">
						<div className="flex flex-col items-center justify-center space-y-4 text-center">
							<div className="space-y-2">
								<h2 className="text-3xl font-bold tracking-tighter sm:text-5xl">Get in Touch</h2>
								<p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
									Ready to simplify your Hyperledger Fabric management? Contact us for a demo or custom quote.
								</p>
							</div>
							<Link
								href="mailto:contact@fabriclaunch.com"
								className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground shadow transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
							>
								Contact Us
							</Link>
						</div>
					</div>
				</section>
			</main>
			<footer className="flex flex-col gap-2 sm:flex-row py-6 w-full shrink-0 items-center px-4 md:px-6 border-t">
				<p className="text-xs text-gray-500 dark:text-gray-400">FabricLaunch</p>
				<nav className="sm:ml-auto flex gap-4 sm:gap-6">
					{/* <Link className="text-xs hover:underline underline-offset-4" href="#">
						Terms of Service
					</Link>
					<Link className="text-xs hover:underline underline-offset-4" href="#">
						Privacy
					</Link> */}
				</nav>
			</footer>
		</div>
	)
}
