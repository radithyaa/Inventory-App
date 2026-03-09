"use client";

import { Menu } from "lucide-react";
import { useRouter } from "next/navigation";
import { signOutAction } from "@/app/actions";
import { Button } from "./ui/button";
import DarkModeSheet from "./ui/dark-mode-sheet";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "./ui/sheet";
import { useUser } from "./user-provider";

export default function CustomSheet() {
	const { user } = useUser();
	const router = useRouter();

	return (
		<Sheet>
			<SheetTrigger asChild>
				<Button variant={"outline"}>
					<Menu />
				</Button>
			</SheetTrigger>
			<SheetContent className="px-0" side={"bottom"}>
				<SheetHeader className="hidden">Menu</SheetHeader>
				{/* <div className="flex flex-col py-4 w-screen justify-center"> */}
				<Button
					className="mt-4 h-14 w-full rounded-none border-muted py-4"
					onClick={() => router.push("/forms")}
					variant={"ghost"}
				>
					Form
				</Button>
				<Button
					className="h-14 w-full rounded-none border-muted"
					onClick={() => router.push("/dashboard")}
					variant={"ghost"}
				>
					Dashboard
				</Button>
				<Button
					className="h-14 w-full rounded-none border-muted"
					onClick={() => router.push("/products")}
					variant={"ghost"}
				>
					Products
				</Button>
				{user ? (
					<div />
				) : (
					<Button
						className="h-14 w-full rounded-none border-muted"
						onClick={() => router.push("/sign-in")}
						variant={"ghost"}
					>
						Sign In
					</Button>
				)}
				{user ? (
					<Button
						className="h-14 w-full rounded-none border-muted"
						onClick={() => signOutAction()}
						variant={"ghost"}
					>
						Sign Out
					</Button>
				) : (
					<div />
				)}
				<DarkModeSheet />
			</SheetContent>
		</Sheet>
	);
}
