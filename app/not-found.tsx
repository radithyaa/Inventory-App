import Link from "next/link";
import { Button } from "@/components/ui/button";
import Footer from "@/components/ui/footer";

function NotFound() {
	return (
		<div className="">
			<section className="flex h-[75vh] flex-col items-center justify-center">
				<h1 className="mb-4 text-3xl">404</h1>
				<p>The page you are looking for does not exist.</p>
				<Button asChild className="mt-2" variant="outline">
					<Link href="/">Go Home</Link>
				</Button>
			</section>
			<div className="max-h-[20vh]">
				<Footer />
			</div>
		</div>
	);
}

export default NotFound;
