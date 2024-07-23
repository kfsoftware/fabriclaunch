import type { Metadata } from 'next'
import { Manrope } from 'next/font/google'
import { Toaster } from '@repo/ui/sonner'
import PlausibleProvider from 'next-plausible'
import './globals.css'
import { cn } from '@/lib/utils'


const fontHeading = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-heading',
})

const fontBody = Manrope({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})
export const metadata: Metadata = {
	title: 'FabricLaunch - fabriclaunch.com',
	description: 'FabricLaunch is a platform for managing Hyperledger Fabric networks',
}

export default function RootLayout({
	children,
	...restParams
}: Readonly<{
	children: React.ReactNode
	params: any
}>) {
	return (
		<html lang="en">
			<body className={cn(
        'antialiased',
        fontHeading.variable,
        fontBody.variable,
      )}>
				<PlausibleProvider domain={'fabriclaunch.com'}>{children}</PlausibleProvider>
				<Toaster position="top-center" />
			</body>
		</html>
	)
}
