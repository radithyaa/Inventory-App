import { Geist } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";
import Navbar from "@/components/navbar";
import { Toaster } from "@/components/ui/sonner";
import Image from "next/image";

const defaultUrl = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : "http://localhost:3000";

export const metadata = {
  metadataBase: new URL(defaultUrl),
  title: "Inventory Tkj Pengkolan Tech",
  description: "The efficient way to helps create, monitor, and manage your inventory",
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
    <html lang="en" className={geistSans.className} suppressHydrationWarning>
      <body className="bg-background text-foreground overflow-x-hidden h-screen ">
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <Navbar/>
          <main className="flex flex-col gap-20 w-full items-center min-h-[91vh]">
          <div className="absolute hidden w-screen h-screen -z-50 md:block top-16">
            <Image
              src="/circle.svg"
              alt="Circle" width={100} height={100}
              className="absolute w-3/5 -top-60 opacity-90 -right-56 md:hidden lg:block"
            />
            <Image
              src="/Computer.svg"
              alt="Computer" width={100} height={100}
              className="absolute w-14 bottom-32 right-20 animate-bounceY"
            />
            <Image
              src="/Gear.svg"
              alt="Gear" width={100} height={100}
              className="absolute w-14 top-28 sm:top-20 left-32 animate-bounceY"
            />
            <Image
              src="/Wrench.svg"
              alt="Wrench" width={100} height={100}
              className="absolute w-14 top-[3.75rem] right-64 animate-bounceY"
            />
            <Image
              src="/circle.svg"
              alt="Circle" width={100} height={100}
              className="absolute w-3/5 bottom-4 opacity-90 -left-72 md:hidden lg:block"
            />
          </div>
            {children}
            <Toaster/>
          </main>
        </ThemeProvider>
      </body>
    </html>
  );
}
