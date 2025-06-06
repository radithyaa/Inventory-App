"use client"

import Link from "next/link";
import { Button } from "./button"
import { usePathname } from "next/navigation";

export default function NavLink() {
    const pathname = usePathname();

    const isActive = (path: string) => pathname === path;
    return(<>
      <Button
        variant={"link"}
        className={`hidden md:inline-flex hover:bg-none text-md transition-all duration-150 ${
          isActive("/forms") ? "text-primary" : "text-muted-foreground"
        }`}
        asChild
      >
        <Link href="/forms">Form</Link>
      </Button>
    
      <Button
        variant={"link"} 
        className={`hidden md:inline-flex hover:bg-none text-md duration-150 ${
          isActive("/dashboard") ? "text-primary" : "text-muted-foreground"
        }`}
        asChild
      >
        <Link href="/dashboard">Dashboard</Link>
      </Button>

      <Button
        variant={"link"}
        className={`hidden md:inline-flex hover:bg-none text-md duration-150 ${
          isActive("/products") ? "text-primary" : "text-muted-foreground"
        }`}
        asChild
      >
        <Link href="/products">Products</Link>
      </Button>
      </>)
}