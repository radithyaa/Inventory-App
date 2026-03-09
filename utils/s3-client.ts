import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";

// Supabase S3 Compatibility Config
const endpoint = process.env.NEXT_PUBLIC_S3_ENDPOINT;
const accessKeyId = process.env.NEXT_PUBLIC_S3_ACCESS_KEY;
const secretAccessKey = process.env.NEXT_PUBLIC_S3_SECRET_KEY;
const region = "ap-southeast-1";
export const bucketName =
	process.env.NEXT_PUBLIC_S3_BUCKET || "product-attachments";

if (!(endpoint && accessKeyId && secretAccessKey)) {
	console.warn("S3 Credentials are missing. Image upload will not work.");
}

export const s3Client = new S3Client({
	region,
	endpoint,
	credentials: {
		accessKeyId: accessKeyId || "",
		secretAccessKey: secretAccessKey || "",
	},
	forcePathStyle: true, // Required for Supabase S3
});

/**
 * Uploads a file to Supabase Storage via S3 API
 * Fixes: TypeError: readableStream.getReader is not a function by converting File to Uint8Array
 */
export async function uploadToS3(file: File): Promise<string> {
	// 1. Convert File to ArrayBuffer then Uint8Array for browser stability
	const arrayBuffer = await file.arrayBuffer();
	const fileBuffer = new Uint8Array(arrayBuffer);

	const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;

	const command = new PutObjectCommand({
		Bucket: bucketName,
		Key: fileName,
		Body: fileBuffer, // Using Uint8Array instead of File/Blob object
		ContentType: file.type,
		// Note: ACL 'public-read' is often ignored by Supabase S3 but good to have if policies allow
	});

	try {
		await s3Client.send(command);

		// Construct the public URL correctly for Supabase Storage
		// The S3 endpoint for Supabase is typically: https://[ref].supabase.co/storage/v1/s3
		// The public object URL is: https://[ref].supabase.co/storage/v1/object/public/[bucket]/[key]
		const baseUrl = endpoint?.replace("/s3", "");
		return `${baseUrl}/object/public/${bucketName}/${fileName}`;
	} catch (error) {
		console.error("Detailed S3 Upload Error:", error);
		throw error;
	}
}
