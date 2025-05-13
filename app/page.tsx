import { Button } from "@/components/ui/button";
import Footer from "@/components/ui/footer";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <div className="flex flex-col w-full wrap">
        {/* Hero Section */}
        <section className="relative top-0 flex flex-col items-center justify-center h-screen gap-12 p-8 md:top-8">
          {/* Background Images */}
          

          {/* Title */}
          <h1 className="max-w-5xl text-4xl font-medium text-center md:text-6xl lg:text-6xl text-foreground">
            Inventory Web{" "}
            <span className="text-primary font-poppins">
              Teknologi Jaringan Komputer
            </span>
          </h1>

          {/* Description */}
          <p className="max-w-xl text-lg text-center font-poppins text-foreground">
            Web yang mengintegrasikan beberapa teknologi untuk keperluan
            pengelolaan inventaris Jurusan TKJ, membuat pengelolaan semakin
            mudah dan semakin cepat
          </p>

          {/* Buttons */}
          <div className="relative flex flex-col items-center justify-center w-full gap-6 mx-auto -mt-4 md:gap-20 md:max-w-sm sm:flex-row">
            <Button asChild variant={"default"}>
            <Link
              href="/forms"
              className="w-full px-4 py-2 font-semibold text-center  transition-colors duration-200 border rounded-sm md:w-40  hover:bg-transparent hover:text-primary hover:border-primary"
            >
              <span>Form</span>
            
            </Link>
            </Button>
            <Button asChild variant={"outline"}>
            <Link
              href="/sign-in"
              className="w-full px-4 py-2 font-semibold border-primary text-primary text-center transition-colors duration-200 border rounded-sm md:w-40 hover:bg-primary hover:text-white"
            >
              <span>Sign In</span>
            </Link>
            </Button>
          </div>
        </section>
      <Footer />
      </div>

    </>
  );
}
