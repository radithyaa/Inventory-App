"use client";

import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

const ThemeSwitcher = () => {
	const [mounted, setMounted] = useState(false);
	const { theme, setTheme } = useTheme();

	// useEffect only runs on the client, so now we can safely show the UI
	useEffect(() => {
		setMounted(true);
	}, []);

	if (!mounted) {
		return null;
	}

	const ICON_SIZE = 16;

	return (
		<Button
			onClick={() => {
				if (theme === "light") {
					setTheme("dark");
				} else if (theme === "dark") {
					setTheme("system");
				} else {
					setTheme("light");
				}
			}}
			size="sm"
			variant="ghost"
		>
			{theme === "light" ? (
				<Sun className="text-primary" key="light" size={ICON_SIZE} />
			) : theme === "dark" ? (
				<Moon className="text-primary" key="dark" size={ICON_SIZE} />
			) : (
				<Laptop className="text-primary" key="system" size={ICON_SIZE} />
			)}
		</Button>
	);
};

export { ThemeSwitcher };
