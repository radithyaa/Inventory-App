"use client";

import Image from "next/image";
import Link from "next/link";
import CustomSheet from "./custom-sheet";
import HeaderAuth from "./header-auth";
import { ThemeSwitcher } from "./theme-switcher";
import NavLink from "./ui/navlink";

export default function Navbar() {
	return (
		<nav className="h-16 w-full border-b border-b-foreground/10">
			<div className="container mx-auto flex h-full items-center justify-between px-3 md:px-4 lg:px-6">
				<div className="flex items-center space-x-4">
					<div className="flex items-center">
						<Image
							alt="logo"
							className="self-center"
							height={"40"}
							src="/logo.png"
							width={"40"}
						/>
						<Link
							className="flex flex-row items-center gap-2 font-semibold text-md text-primary"
							href="/"
						>
							Inventory Tkj
						</Link>
					</div>
				</div>
				<div className="hidden self-center sm:gap-20 md:flex md:gap-20 lg:gap-56">
					<NavLink />
				</div>
				<div className="hidden items-center space-x-1 md:flex md:space-x-2 lg:space-x-2">
					<HeaderAuth />
					<ThemeSwitcher />
				</div>
				<div className="flex items-center md:hidden">
					<CustomSheet />
				</div>
			</div>
		</nav>
	);
}
