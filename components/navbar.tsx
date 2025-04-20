import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuIndicator,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
    NavigationMenuViewport,
  } from "@/components/ui/navigation-menu"
import Link from "next/link"
import { Button } from "./ui/button"
import HeaderAuth from "./header-auth"
import { ThemeSwitcher } from "./theme-switcher"
import NavLink from "./ui/navlink"
import Image from "next/image"
import { Sheet, SheetClose, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from "./ui/sheet"
import { Label } from "./ui/label"
import { Input } from "./ui/input"
import { Menu } from "lucide-react"
import CustomSheet from "./custom-sheet"
  

  export default function Navbar() {
    return(
        <nav className="w-full border-b border-b-foreground/10 h-16">
        < div className="container mx-auto flex justify-between items-center h-full px-3 md:px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
          <Image className="self-center mb-2"
            src="/logo2.png" alt="logo" width={"50"} height={"50"} />
          <Link href="/" className="text-md font-semibold flex flex-row items-center gap-2 text-primary">
            Inventory Tkj
          </Link>
          </div>
          </div>
          <div className="self-center flex gap-32">
          <NavLink></NavLink>
          </div>
          <div className=" hidden sm:flex items-center md:space-x-2 lg:space-x-2">
            
          <HeaderAuth />
          <ThemeSwitcher />
          </div>
          <div className="flex sm:hidden items-center">
          <CustomSheet/>

          </div>
          </div>
        </nav>
    )
  }