"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Button } from "./button";

export default function NavLink() {
	const pathname = usePathname();

	const isActive = (path: string) => pathname === path;
	return (
		<>
			<Button
				asChild
				className={`hidden text-md transition-all duration-150 hover:bg-none md:inline-flex ${
					isActive("/forms") ? "text-primary" : "text-muted-foreground"
				}`}
				variant={"link"}
			>
				<Link href="/forms">Form</Link>
			</Button>

			<Button
				asChild
				className={`hidden text-md duration-150 hover:bg-none md:inline-flex ${
					isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
				}`}
				variant={"link"}
			>
				<Link href="/dashboard">Dashboard</Link>
			</Button>

			<Button
				asChild
				className={`hidden text-md duration-150 hover:bg-none md:inline-flex ${
					isActive("/products") ? "text-primary" : "text-muted-foreground"
				}`}
				variant={"link"}
			>
				<Link href="/products">Products</Link>
			</Button>
		</>
	);
}
