'use server'
import { auth, nextAuthConfig } from "@/auth"
import crypto from 'crypto'

export const currentUser = async () => {
	const session = await auth()

	return session?.user
}

export async function generateSecureCode(length = 6) {
	// Ensure the code length is between 1 and 6
	if (length < 1 || length > 6) throw new Error('Code length must be between 1 and 6')
	const max = Math.pow(10, length)
	const code = crypto.randomInt(0, max).toString().padStart(length, '0')
	return code
}


export type Provider = {
	id: string;
	name: string;
	type: string;
	style: {
		logo: string;
		bg: string;
		text: string;
	};
};

export async function getProviders(): Promise<Provider[]> {
	const providerKeys: (keyof Provider)[] = ["id", "name", "type", "style"];
	return nextAuthConfig.providers.map((provider) =>
		getKeyValuesFromObject<Provider>(provider, providerKeys)
	);
}

function getKeyValuesFromObject<T>(obj: any, keys: (keyof T)[]): T {
	return keys.reduce((acc, key) => {
		if (obj[key]) {
			acc[key] = obj[key];
		}
		return acc;
	}, {} as T);
}
interface CreateCSRFTokenParams {
	secret: string
	cookieValue?: string
	isPost: boolean
	bodyValue?: string
}

export async function createCSRFToken({
	secret,
	cookieValue,
	isPost,
	bodyValue,
}: CreateCSRFTokenParams) {
	if (cookieValue) {
		const [csrfToken, csrfTokenHash] = cookieValue.split("|")

		const expectedCsrfTokenHash = await createHash(
			`${csrfToken}${secret}`
		)

		if (csrfTokenHash === expectedCsrfTokenHash) {
			// If hash matches then we trust the CSRF token value
			// If this is a POST request and the CSRF Token in the POST request matches
			// the cookie we have already verified is the one we have set, then the token is verified!
			const csrfTokenVerified = isPost && csrfToken === bodyValue

			return { csrfTokenVerified, csrfToken }
		}
	}

	// New CSRF token
	const csrfToken = randomString(32)
	const csrfTokenHash = await createHash(`${csrfToken}${secret}`)
	const cookie = `${csrfToken}|${csrfTokenHash}`

	return { cookie, csrfToken }
}
async function createHash(message: string) {
	const data = new TextEncoder().encode(message)
	const hash = await crypto.subtle.digest("SHA-256", data)
	return Array.from(new Uint8Array(hash))
		.map((b) => b.toString(16).padStart(2, "0"))
		.join("")
		.toString()
}

function randomString(size: number) {
	const i2hex = (i: number) => ("0" + i.toString(16)).slice(-2)
	const r = (a: string, i: number): string => a + i2hex(i)
	const bytes = crypto.getRandomValues(new Uint8Array(size))
	return Array.from(bytes).reduce(r, "")
}