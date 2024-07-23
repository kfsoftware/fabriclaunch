'use client'
import { Button } from '@repo/ui/button'
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuGroup, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'

import { TenantDB } from '@/db'
import { BuildingIcon, ChevronDownIcon } from 'lucide-react'
import { useRouter } from 'next/navigation'
import TenantCreateButton from './create'
import { getTenantsByUserId } from '@/lib/logic'
export default function TenantDropdown({ tenant, tenants, selectedTenantSlug }: { tenant: TenantDB; tenants: Awaited<ReturnType<typeof getTenantsByUserId>>; selectedTenantSlug: string }) {
	const router = useRouter()
	const setTenantCB = (slug: string) => {
		router.replace(location.pathname.replace(selectedTenantSlug, slug))
	}
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="flex items-center gap-2">
					<BuildingIcon className="h-5 w-5" />
					<span>{tenant.name}</span>
					<ChevronDownIcon className="h-4 w-4" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent
				align="start"
				className="w-[300px] max-h-[400px] overflow-y-auto "
				style={{
					zIndex: 9999,
				}}
			>
				<DropdownMenuLabel className="px-4 py-3 font-medium">Select Consortium</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					{tenants.map(({ tenant }) => (
						<DropdownMenuCheckboxItem
							key={tenant.id}
							checked={tenant.slug === selectedTenantSlug}
							onSelect={(e) => {
								setTenantCB(tenant.slug)
							}}
						>
							<div className="flex items-center justify-between">
								<span>{tenant.name}</span>
							</div>
						</DropdownMenuCheckboxItem>
					))}
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem onSelect={(e) => e.preventDefault()}>
					<TenantCreateButton />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
