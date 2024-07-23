import { NEXT_PUBLIC_EXTERNAL_URL } from "@/config";
import { createLoginRequestCLI, getLoginRequestByCode } from "@/lib/logic";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
const postBody = z.object({
	redirectUri: z.string(),
});
export const GET = async (req: NextRequest, {
	params
}: {
	params: {
		code: string;
	}
}) => {
	const { code } = params;

	const loginReq = await getLoginRequestByCode(
		code
	);
	if (!loginReq) {
		return NextResponse.json({
			error: "Invalid code",
		}, {
			status: 400,
		});
	}
	// TODO: Check if the login request is expired
	return NextResponse.json({
		token: loginReq.token,
		status: loginReq.status,
	});
}
