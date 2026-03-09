import ProductForm from "@/components/product-form";
import Footer from "@/components/ui/footer";

export default function Forms() {
	return (
		<div className="flex w-full flex-col items-center justify-center">
			<ProductForm />
			<Footer />
		</div>
	);
}
