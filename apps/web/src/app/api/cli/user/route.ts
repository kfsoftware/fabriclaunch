import { getToken } from "next-auth/jwt";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";


export async function GET(req: NextRequest) {
	const headerList = headers()
	const secret = process.env.AUTH_SECRET as string;
	const user = await getToken({ req, secret, salt: "authjs.session-token" });
	return NextResponse.json({ user: user });
};
