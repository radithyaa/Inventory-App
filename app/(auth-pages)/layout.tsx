import Footer from "@/components/ui/footer";

export default async function Layout({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex max-w-7xl flex-col items-center justify-center gap-12">
			{children}
			<Footer />
		</div>
	);
}
