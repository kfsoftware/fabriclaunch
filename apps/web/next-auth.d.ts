import NextAuth from "next-auth"

declare module "next-auth" {
	/**
	 * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
	 */
	interface Session {
		user: {
			name: string
			email: string
			id: string
			image: string
			/** username. */
			username: string
		}
	}
}