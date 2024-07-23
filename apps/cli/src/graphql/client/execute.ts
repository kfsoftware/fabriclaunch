import { API_URL } from '../../constants'
import { storage } from '../../storage'
import type { TypedDocumentString } from './graphql'

// Define types for GraphQL errors
type GraphQLError = {
	message: string;
	locations?: { line: number; column: number }[];
	path?: string[];
	extensions?: Record<string, any>;
}

// Define a type for the GraphQL response
type GraphQLResponse<T> = {
	data?: T;
	errors?: GraphQLError[];
}

export async function execute<TResult, TVariables>(
	query: TypedDocumentString<TResult, TVariables>,
	...[variables]: TVariables extends Record<string, never> ? [] : [TVariables]
): Promise<GraphQLResponse<TResult>> {
	const token = storage.getAuthToken()
	const headers: Record<string, string> = {
		'Content-Type': 'application/json',
		Accept: 'application/graphql-response+json',
	}
	if (token) {
		headers['Authorization'] = `Bearer ${token}`
	}

	const response = await fetch(`${API_URL}/graphql`, {
		method: 'POST',
		headers,
		body: JSON.stringify({
			query,
			variables
		})
	})

	if (!response.ok) {
		if (response.status === 400) {
			const res = await response.json()
			return res
		} else {
			throw new Error(`Failed to fetch: ${response.statusText}`)
		}
	}

	const result: GraphQLResponse<TResult> = await response.json()

	return result
}
