import Link from "next/link"
import HeaderAuth from "./header-auth"
import { ThemeSwitcher } from "./theme-switcher"
import NavLink from "./ui/navlink"
import Image from "next/image"
import CustomSheet from "./custom-sheet"
  

  export default function Navbar() {
    return(
        <nav className="w-full border-b border-b-foreground/10 h-16">
        < div className="container mx-auto flex justify-between items-center h-full px-3 md:px-4 lg:px-6">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
          <Image className="self-center "
            src="/logo.png" alt="logo" width={"40"} height={"40"} />
          <Link href="/" className="text-md font-semibold flex flex-row items-center gap-2 text-primary">
            Inventory Tkj
          </Link>
          </div>
          </div>
          <div className="self-center flex lg:gap-56 md:gap-20 sm:gap-20">
          <NavLink></NavLink>
          </div>
          <div className=" hidden sm:flex items-center md:space-x-2 lg:space-x-2 space-x-1">
            
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