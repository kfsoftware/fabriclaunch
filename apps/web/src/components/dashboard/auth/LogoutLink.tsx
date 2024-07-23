import { signOut } from '@/auth'

// create a logout link
export default function LogoutLink() {
	return (
		<form
			action={async () => {
				'use server'
				await signOut()
			}}
			className="w-full cursor-pointer"
		>
			<button type="submit" >
				Logout
			</button>
		</form>
	)
}
