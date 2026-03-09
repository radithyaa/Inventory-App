"use client";
import { useTheme } from "next-themes";
import { Button } from "./button";
import { Switch } from "./switch";

export default function DarkModeSheet() {
	const { theme, setTheme } = useTheme();
	return (
		<div>
			<Button
				className="w-full gap-4 rounded-none border-muted py-6"
				onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
				variant={"ghost"}
			>
				Switch Theme <Switch checked={theme === "dark"} />
			</Button>
		</div>
	);
}
