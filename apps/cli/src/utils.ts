import { file } from "bun";
import { createHash } from "crypto";

export async function computeFileHash(filePath: string, algorithm: "md5" | "sha1" | "sha256" = "sha256"): Promise<string> {
	const f = file(filePath);
	const hash = createHash(algorithm);
	const stream = f.stream();
	const reader = stream.getReader();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		hash.update(value);
	}

	return hash.digest("hex");
}

export async function streamToBlob(stream: ReadableStream<Uint8Array>): Promise<Blob> {
	const chunks: Uint8Array[] = [];
	const reader = stream.getReader();

	while (true) {
		const { done, value } = await reader.read();
		if (done) break;
		chunks.push(value);
	}

	return new Blob(chunks);
}