import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Image from "next/image";
import Navbar from "@/components/navbar";
import Providers from "@/components/providers";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const defaultUrl = process.env.VERCEL_URL
	? `https://${process.env.VERCEL_URL}`
	: "http://localhost:3000";

export const metadata = {
	metadataBase: new URL(defaultUrl),
	title: "Inventory Tkj Pengkolan Tech",
	description:
		"The efficient way to helps create, monitor, and manage your inventory",
};

const geistSans = Geist({
	display: "swap",
	subsets: ["latin"],
});

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html className={geistSans.className} lang="en" suppressHydrationWarning>
			<body className="h-screen overflow-x-hidden bg-background text-foreground">
				<ThemeProvider
					attribute="class"
					defaultTheme="light"
					disableTransitionOnChange
					enableSystem
				>
					<Providers>
						<TooltipProvider>
							<Navbar />
							<main className="flex min-h-[91vh] w-full flex-col items-center gap-20">
								<div className="absolute top-16 -z-50 hidden h-screen w-screen md:block">
									<Image
										alt="Circle"
										className="absolute -top-60 -right-56 w-3/5 opacity-90 md:hidden lg:block"
										height={100}
										src="/circle.svg"
										width={100}
									/>
									<Image
										alt="Computer"
										className="absolute right-20 bottom-32 w-14 animate-bounceY"
										height={100}
										src="/Computer.svg"
										width={100}
									/>
									<Image
										alt="Gear"
										className="absolute top-28 left-32 w-14 animate-bounceY sm:top-20"
										height={100}
										src="/Gear.svg"
										width={100}
									/>
									<Image
										alt="Wrench"
										className="absolute top-[3.75rem] right-64 w-14 animate-bounceY"
										height={100}
										src="/Wrench.svg"
										width={100}
									/>
									<Image
										alt="Circle"
										className="absolute bottom-4 -left-72 w-3/5 opacity-90 md:hidden lg:block"
										height={100}
										src="/circle.svg"
										width={100}
									/>
								</div>
								{children}
								<Toaster />
							</main>
						</TooltipProvider>
					</Providers>
				</ThemeProvider>
			</body>
		</html>
	);
}
