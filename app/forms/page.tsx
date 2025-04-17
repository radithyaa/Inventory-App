// import ProductForm from "@/components/product-form";

// export default function Forms() {
//     return (
//         <div className="flex justify-center items-center w-full h-screen">
//             <ProductForm className="w-full max-w-lg" />
//         </div>
//     );
// }

import DeployButton from "@/components/deploy-button";
import Link from "next/link";
import HeaderAuth from "@/components/header-auth";
import { ThemeSwitcher } from "@/components/theme-switcher";

import ProductForm from "@/components/product-form";

export default function Forms(){
    return(<div className="w-full flex justify-center flex-col items-center ">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
                <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
                  <div className="flex gap-5 items-center text-lg font-semibold">
                    <Link href={"/"}>Inventory Tkj</Link>
                    <div className="flex items-center gap-2">
                      {/* <DeployButton /> */}
                    </div>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <HeaderAuth />
                    <ThemeSwitcher />
                  </div>
                </div>
              </nav>
    <ProductForm></ProductForm>
    </div>)
}