import Link from "next/link";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTrigger } from "./ui/sheet";
import { Menu } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { createClient } from "@/utils/supabase/server";
import DarkModeSheet from "./ui/dark-mode-sheet";

export default async function CustomSheet(){
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
    
    return (
        <Sheet>
            <SheetTrigger><Button variant={"outline"}><Menu/></Button></SheetTrigger>
            <SheetContent side={"bottom"} className="px-0" >
            <SheetHeader className="hidden">Menu</SheetHeader>
                {/* <div className="flex flex-col py-4 w-screen justify-center"> */}
                <Button variant={"ghost"} className="w-full rounded-none   border-muted mt-4 py-5"><Link href="/forms" className="py-4">Form</Link></Button>
                <Button variant={"ghost"} className="w-full rounded-none   border-muted py-6"><Link href="/dashboard">Dashboard</Link></Button>
                <Button variant={"ghost"} className="w-full rounded-none   border-muted py-6"><Link href="/products">Products</Link></Button>
                {user ? (
                <div></div>) : (
                    <Button variant={"ghost"} className="w-full rounded-none   border-muted py-6"><Link href="/sign-in">Sign In</Link></Button> )}
                <DarkModeSheet/>
                {user ? (
                <Button variant={"ghost"} className="w-full rounded-none   border-muted py-6" onClick={signOutAction}>Sign Out</Button>) : (
                    <div></div>)}
            </SheetContent>
          </Sheet>
    )
}