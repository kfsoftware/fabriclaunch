import { NEXT_PUBLIC_EXTERNAL_URL } from "@/config";
import { createLoginRequestCLI } from "@/lib/logic";
import { NextRequest, NextResponse } from "next/server";
import * as z from "zod";
const postBody = z.object({
	redirectUri: z.string(),
});
export const POST = async (req: NextRequest) => {
	const postData = await req.json();
	const safeParsedData = postBody.safeParse(postData);
	if (!safeParsedData.success) {
		return NextResponse.json(safeParsedData.error, {
			status: 400,
		});
	}

	const loginReq = await createLoginRequestCLI(
		safeParsedData.data.redirectUri
	);
	return NextResponse.json({
		...loginReq,
		loginUrl: `${NEXT_PUBLIC_EXTERNAL_URL}/cli/login/${loginReq.id}`
	});
}
