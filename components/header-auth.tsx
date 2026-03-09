"use client";

import Link from "next/link";
import { signOutAction } from "@/app/actions";
import { useUser } from "@/components/user-provider";
import { Button } from "./ui/button";

export default function AuthButton() {
	const { user } = useUser();

	return user ? (
		<div className="hidden items-center gap-4 sm:flex">
			<form action={signOutAction}>
				<Button
					className="border-primary text-primary hover:text-red"
					type="submit"
					variant={"outline"}
				>
					Sign out
				</Button>
			</form>
		</div>
	) : (
		<div className="flex gap-2">
			<Button asChild size="sm" variant={"outline"}>
				<Link href="/sign-in">Sign In</Link>
			</Button>
		</div>
	);
}
