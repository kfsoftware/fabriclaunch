import { Avatar, AvatarFallback, AvatarImage } from '@repo/ui/avatar'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@repo/ui/dropdown-menu'
import Link from 'next/link'
import LogoutLink from '../auth/LogoutLink'
import { User } from 'next-auth'

export default function ProfileDropdown({ user }: { user: User }) {
	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Avatar className="h-9 w-9 cursor-pointer">
					<AvatarImage src={user.image ? user.image : `https://www.gravatar.com/avatar/${user.email!}`} />
					<AvatarFallback>{user.name}</AvatarFallback>
					<span className="sr-only">{user.name}</span>
				</Avatar>
			</DropdownMenuTrigger>
			<DropdownMenuContent className="w-56">
				<DropdownMenuLabel>
					<span className="font-bold">{user.name}</span> <br />
					<span className="font-normal">{user.email}</span>
				</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem >
					<LogoutLink />
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	)
}
