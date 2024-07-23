import { Client as MinioClient } from 'minio';
export async function getMinioConfig() {
	const config = {
		minioAccessKey: process.env.MINIO_ACCESS_KEY,
		minioSecretKey: process.env.MINIO_SECRET_KEY,
		minioEndPoint: process.env.MINIO_ENDPOINT,
		minioPort: parseInt(process.env.MINIO_PORT),
		minioUseSSL: process.env.MINIO_USE_SSL === 'true',
		minioRegion: process.env.MINIO_REGION,
		minioBucketName: process.env.MINIO_BUCKET_NAME,
	};
	return config
	
}
export async function getMinio() {
	const config = await getMinioConfig()

	const minioClient = new MinioClient({
		accessKey: config.minioAccessKey,
		secretKey: config.minioSecretKey,
		endPoint: config.minioEndPoint,
		port: config.minioPort,
		useSSL: config.minioUseSSL,
		region: config.minioRegion,
	});
	return minioClient
}