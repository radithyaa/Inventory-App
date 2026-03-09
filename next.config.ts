import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	/* config options here */
	typescript: {
		ignoreBuildErrors: true,
	},
	images: {
		remotePatterns: [
			new URL(
				"https://scmahytklrtrwrrvthnu.storage.supabase.co/storage/v1/object/public/product-attachments/**"
			),
		],
	},
	eslint: {
		ignoreDuringBuilds: true,
	},
};

export default nextConfig;
