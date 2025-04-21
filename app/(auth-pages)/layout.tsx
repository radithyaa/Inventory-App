import Footer from "@/components/ui/footer";
import Image from "next/image";

export default async function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl flex flex-col gap-12 items-center justify-center">
      {children}
      <Footer />
      </div>
  );
}
