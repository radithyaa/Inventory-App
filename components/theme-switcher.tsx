"use client";

import { Button } from "@/components/ui/button";
import { Laptop, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

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
      variant="ghost"
      size="sm"
      onClick={() => {
        if (theme === "light") {
          setTheme("dark");
        } else if (theme === "dark") {
          setTheme("system");
        } else {
          setTheme("light");
        }
      }}
    >
      {theme === "light" ? (
        <Sun
          key="light"
          size={ICON_SIZE}
          className="text-primary"
          
        />
      ) : theme === "dark" ? (
        <Moon
          key="dark"
          size={ICON_SIZE}
          className="text-primary"
        />
      ) : (
        <Laptop
          key="system"
          size={ICON_SIZE}
          className="text-primary"
        />
      )}
    </Button>
  );
};

export { ThemeSwitcher };
