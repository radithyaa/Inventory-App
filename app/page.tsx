import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/ui/footer";

export default function Home() {
	return (
		<div className="wrap flex w-full flex-col">
			{/* Hero Section */}
			<section className="relative top-0 flex h-screen flex-col items-center justify-center gap-12 p-8 md:top-8">
				{/* Background Images */}

				{/* Title */}
				<h1 className="max-w-5xl text-center font-medium text-4xl text-foreground md:text-6xl lg:text-6xl">
					Inventory Web{" "}
					<span className="font-poppins text-primary">
						Teknologi Jaringan Komputer
					</span>
				</h1>

				{/* Description */}
				<p className="max-w-xl text-center font-poppins text-foreground text-lg">
					Web yang mengintegrasikan beberapa teknologi untuk keperluan
					pengelolaan inventaris Jurusan TKJ, membuat pengelolaan semakin mudah
					dan semakin cepat
				</p>

				{/* Buttons */}
				<div className="relative mx-auto -mt-4 flex w-full flex-col items-center justify-center gap-6 sm:flex-row md:max-w-sm md:gap-20">
					<Button asChild variant={"default"}>
						<Link
							className="w-full rounded-sm border px-4 py-2 text-center font-semibold transition-colors duration-200 hover:border-primary hover:bg-transparent hover:text-primary md:w-40"
							href="/forms"
						>
							<span>Form</span>
						</Link>
					</Button>
					<Button asChild variant={"outline"}>
						<Link
							className="w-full rounded-sm border border-primary px-4 py-2 text-center font-semibold text-primary transition-colors duration-200 hover:bg-primary hover:text-white md:w-40"
							href="/sign-in"
						>
							<span>Sign In</span>
						</Link>
					</Button>
				</div>
			</section>
			<Footer />
		</div>
	);
}
