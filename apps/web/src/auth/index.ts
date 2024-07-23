import NextAuth, { CredentialsSignin, NextAuthConfig } from "next-auth"
// Your own logic for dealing with plaintext password strings; be careful!
import { accountsTable, authenticatorsTable, db, sessionsTable, usersTable, verificationTokensTable } from "@/db"
import { getOrCreateDefaultTenantForUser, getUserByEmail, getUserById } from "@/lib/logic"
import { DrizzleAdapter } from "@auth/drizzle-adapter"
import { and, eq } from "drizzle-orm"
import GitHubProvider, { GitHubEmail } from "next-auth/providers/github"
import CredentialsProvider from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
const githubApiBaseUrl = "https://api.github.com"
class InvalidCredentials extends CredentialsSignin {
	code = "credentials"
}
export const nextAuthConfig: NextAuthConfig = {
	adapter: DrizzleAdapter(db, {
		accountsTable,
		usersTable,
		authenticatorsTable,
		sessionsTable,
		verificationTokensTable,
	}),
	secret: process.env.AUTH_SECRET,
	session: {
		strategy: 'jwt',
	},
	pages: {
		signIn: '/login'
	},
	callbacks: {
		redirect: ({ baseUrl, url }) => {
			if (url.startsWith("/")) {
				return `${baseUrl}${url}`
			} else if (new URL(url).origin === baseUrl) {
				return url
			}
			return `${baseUrl}/dashboard`
		},


		jwt: ({
			user,
			token
		}) => {
			if (user) {
				token.sub = user.id
			}
			token.exp = Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 // 30 days
			return token
		},
		session: async ({ session, token }) => {
			session.user.id = token.sub
			const accounts = await db.select().from(accountsTable).where(
				and(
					eq(accountsTable.userId, token.sub),
					eq(accountsTable.provider, "github")
				)
			).innerJoin(usersTable, eq(usersTable.id, accountsTable.userId));
			if (accounts.length > 0) {
				const [{ account: githubAccount, user: userDB }] = accounts
				const refreshTimeThreshold = ((githubAccount.expires_at! * 1000) + (120 * 1000))
				const shouldRefresh = githubAccount && githubAccount.expires_at && ((githubAccount.expires_at * 1000) + (120 * 1000)) < Date.now()
				session.user.username = userDB.login!;
			} else {
				const user = await getUserById(token.sub)
				session.user.username = user.name!;
			}
			return session
		}
	},
	providers: [
		CredentialsProvider({
			name: 'Credentials',
			credentials: {
				email: { label: "Email", type: "text", placeholder: "dviejo@kfs.es" },
				password: { label: "Password", type: "password" }
			},
			async authorize(credentials) {
				if (!credentials?.email || !credentials?.password) {
					return null
				}
				const email = credentials.email as string
				const user = await getUserByEmail(email)
				if (!user) {
					// If user doesn't exist, create a new one
					const hashedPassword = await bcrypt.hash(credentials.password as string, 10)
					const [{ id: userId }] = await db.insert(usersTable).values({
						email: email,
						name: email.split('@')[0], // Use part of email as name
						password: hashedPassword,
					}).returning({
						id: usersTable.id,
					})
					const newUser = await getUserById(userId)
					return newUser
				}
				const isValid = await bcrypt.compare(credentials.password as string, user.password)
				if (!isValid) {
					throw new InvalidCredentials("Invalid credentials", {})
				}
				return user
			}
		}),
		GitHubProvider({
			allowDangerousEmailAccountLinking: true,
			userinfo: {
				url: `${githubApiBaseUrl}/user`,
				async request({ tokens, provider }) {
					const profile = await fetch(provider.userinfo?.url as URL, {
						headers: {
							Authorization: `Bearer ${tokens.access_token}`,
							"User-Agent": "authjs",
						},
					}).then(async (res) => await res.json() as any)
					if (!profile.email) {
						// If the user does not have a public email, get another via the GitHub API
						// See https://docs.github.com/en/rest/users/emails#list-public-email-addresses-for-the-authenticated-user
						const res = await fetch(`${githubApiBaseUrl}/user/emails`, {
							headers: {
								Authorization: `Bearer ${tokens.access_token}`,
								"User-Agent": "authjs",
							},
						})
						const responseText = await res.text()
						if (res.ok) {
							const emails: GitHubEmail[] = JSON.parse(responseText)
							profile.email = (emails.find((e) => e.primary) ?? emails[0]).email
						}
					}
					return profile
				},
			},
			account(account) {
				const refresh_token_expires_at = account.refresh_token_expires_in ?
					Math.floor(Date.now() / 1000) + Number(account.refresh_token_expires_in) : null
				return {
					access_token: account.access_token,
					expires_at: account.expires_at,
					refresh_token: account.refresh_token,
					refresh_token_expires_at
				}
			},
			profile(profile) {
				return {
					id: profile.id.toString(),
					name: profile.name ?? profile.login,
					login: profile.login,
					email: profile.email,
					image: profile.avatar_url,
				}
			},
			clientId: process.env.GH_CLIENT_ID,
			clientSecret: process.env.GH_CLIENT_SECRET,
			authorization: {
				url: `https://github.com/login/oauth/authorize`,
				params: {
					scope: 'read:user,user:email,repo',
				},
			},
		}),
	],
}
export const { handlers, signIn, signOut, auth } = NextAuth(nextAuthConfig)