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
import Image from "next/image";

import ProductForm from "@/components/product-form";

export default function Forms(){
    return(<div className="w-full flex justify-center flex-col items-center ">
    <ProductForm></ProductForm>
    <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-8 py-8 max-h-10">
                <p>
                  &copy; {new Date().getFullYear()} PTech Tkj. All rights reserved.
                </p>
              </footer>
    </div>)
}