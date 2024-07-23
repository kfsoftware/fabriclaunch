import { NextRequest } from "next/server";

export interface ApolloUser {
	id: string;
	email: string;

}
export interface ApolloContext {
	user?: ApolloUser | null;
	req: NextRequest
}