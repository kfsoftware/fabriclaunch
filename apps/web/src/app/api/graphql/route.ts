import { schema } from "@/graphql";
import { currentUser } from "@/lib/auth";
import { ApolloContext, ApolloUser } from "@/types/apollo";
import { ApolloServer } from "@apollo/server";
import { ApolloServerPluginLandingPageLocalDefault } from "@apollo/server/plugin/landingPage/default";
import { startServerAndCreateNextHandler } from "@as-integrations/next";
import { getToken } from "next-auth/jwt";
import { NextRequest } from "next/server";
import "reflect-metadata";

const server = new ApolloServer({
	schema,
	introspection: true,

	plugins: [
		ApolloServerPluginLandingPageLocalDefault({ footer: false }),
	],

});
const secret = process.env.AUTH_SECRET as string;

const handler = startServerAndCreateNextHandler<NextRequest>(server, {
	context: async (req): Promise<ApolloContext> => {
		let user: ApolloUser | null = null;
		const userCookie = await currentUser()
		if (userCookie) {
			user = {
				id: userCookie.id!,
				email: userCookie.email!,
			};
		} else {
			const existingToken = await getToken({ req: req, secret, salt: "authjs.session-token" });
			if (existingToken) {
				user = {
					id: existingToken.sub!,
					email: existingToken.email!,
				};
			}
		}
		return ({ req, user });
	},
});

export { handler as GET, handler as POST };
