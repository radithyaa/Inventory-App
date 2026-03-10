import type { NextConfig } from "next";

const s3Url = process.env.NEXT_PUBLIC_S3_ENDPOINT
	? new URL(process.env.NEXT_PUBLIC_S3_ENDPOINT)
	: null;

const nextConfig: NextConfig = {
	/* config options here */
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			{
				protocol: s3Url
					? (s3Url.protocol.replace(":", "") as "http" | "https")
					: "https",
				hostname: s3Url
					? s3Url.hostname
					: "uahiydueryrkswrxufmp.storage.supabase.co",
				port: s3Url?.port || "",
				pathname: "/**",
			},
		],
	},
};

export default nextConfig;
