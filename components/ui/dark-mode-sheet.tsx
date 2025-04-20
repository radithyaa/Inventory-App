"use client"
import { useTheme } from "next-themes";
import { Button } from "./button";

export default function DarkModeSheet(){
    const {theme, setTheme} = useTheme();
    return(
        <Button variant={"ghost"} className="w-full rounded-none   border-muted py-6" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Change Theme</Button>
    )
}