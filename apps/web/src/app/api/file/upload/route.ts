import { getMinio, getMinioConfig } from '@/lib/minio';
import fs from "fs";
import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { Readable } from "node:stream";
import { fileSync } from 'tmp';
function readerToReadableStream(reader: ReadableStream<Uint8Array>) {
	const r = reader.getReader();
	const readerStream = new Readable({
		read(size) {
			r.read().then(({ done, value }) => {
				if (done) {
					this.push(null);
					return;
				}
				this.push(value);
			})
		},
	});
	return readerStream;

}
function calculateHash(r: Readable) {
	return new Promise<string>((resolve, reject) => {
		const hash = crypto.createHash('sha256')
		hash.setEncoding('hex')
		r.on('end', function () {
			hash.end()
			resolve(hash.read())
		})
		r.on('error', (err) => {
			reject(err)
		})
		r.pipe(hash)
	})
}

export async function POST(req: Request) {
	let cleanup: () => void;
	try {
		const minioClient = await getMinio()
		const config = await getMinioConfig()
		const formData = await req.formData();
		const file = formData.get("file") as File;
		const tmpName = fileSync()
		cleanup = tmpName.removeCallback;
		const mainStream = readerToReadableStream(file.stream());
		const writeStream = fs.createWriteStream(tmpName.name);
		await new Promise((resolve, reject) => {
			writeStream.on('finish', resolve);
			writeStream.on('error', reject);
			mainStream.pipe(writeStream);
		})
		const hash = await calculateHash(fs.createReadStream(tmpName.name));
		const chunks = hash.match(/.{8}/g)
		const objectName = chunks.join('/')
		await minioClient.fPutObject(config.minioBucketName, objectName, tmpName.name, {
			'contentType': file.type,
			'size': file.size,
			'name': file.name,
			'hash': hash,
		});
		let thumbnailId: string | null = null;
		return NextResponse.json({
			fileName: file.name,
			contentType: file.type,
			status: "success",
			id: hash,
			hash,
			objectName,
			thumbnailId
		});
	} catch (e) {
		console.error(e);
		return NextResponse.json({ status: "fail", error: e.message });
	} finally {
		if (cleanup) {
			cleanup();
		}
	}
}
