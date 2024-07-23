import { getMinio, getMinioConfig } from '@/lib/minio';
import { NextRequest, NextResponse } from 'next/server';
import { Readable } from 'node:stream';


async function* nodeStreamToIterator(stream: Readable) {
	for await (const chunk of stream) {
		yield new Uint8Array(chunk);
	}
}
function iteratorToStream(iterator: AsyncGenerator<Uint8Array>) {
	return new ReadableStream({
		async pull(controller) {
			const { value, done } = await iterator.next();
			if (done) {
				controller.close();
			} else {
				controller.enqueue(value);
			}
		},
	});
}
export async function GET(req: NextRequest, {
	params: {
		hash
	}
}: {
	params: {
		hash: string

	}
}) {
	const minioConfig = await getMinioConfig()
	const minioClient = await getMinio()
	const chunks = hash.match(/.{8}/g)
	const objectName = chunks.join('/')
	try {
		// Get object from MinIO and pipe it to the response
		const info = await minioClient.statObject(minioConfig.minioBucketName, objectName);
		if (!info) {
			return NextResponse.json({ status: "fail", error: "File not found" }, { status: 404 });
		}
		const {
			contenttype,
			size,
			name,
			hash,
		} = info.metaData
		const stream = await minioClient.getObject(minioConfig.minioBucketName, objectName);
		return new Response(iteratorToStream(nodeStreamToIterator(stream)), {
			headers: {
				// inline content disposition
				'Content-Disposition': `inline; filename="${name}"`,
				'Content-Type': contenttype,
			}
		})
	} catch (error) {
		return NextResponse.json({ status: "fail", error: error.message }, { status: 500 });
	}
}
