"use client"
import { useTheme } from "next-themes";
import { Button } from "./button";
import { Switch } from "./switch";

export default function DarkModeSheet(){
    const {theme, setTheme} = useTheme();
    return(
        <div>
        <Button variant={"ghost"} className="w-full rounded-none gap-4 border-muted py-6" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>Dark Mode <Switch checked={theme == "dark"}/></Button>
        </div>
    )
}