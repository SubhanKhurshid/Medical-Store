"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import Image from "next/image";
import { Sheet, SheetContent, SheetTrigger } from "../ui/sheet";
import { Separator } from "../ui/separator";
import menu from "@/public/icons8-menu-50.png";
import logo from "@/public/WhatsApp Image 2024-08-02 at 23.45.33_0ac66f5d.jpg";

const Navbar = () => {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.push("/signin");
    }
  }, [session, status, router]);

  if (
    status === "loading" ||
    pathname === "/signin" ||
    pathname === "/signup"
  ) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto w-full px-10 p-5 bg-blue-950">
      {session?.user.role === "nurse" && (
        <>
          <div className="hidden md:block">
            <div className="flex items-center justify-between gap-3">
              <div>
                <Link
                  href={"/nurse"}
                  className="tracking-tight font-bold text-lg"
                >
                  {/* <Image
                    src={logo}
                    alt="logo"
                    className="w-[170px] h-[100px]"
                  /> */}
                  <h1>Ibrahim Medical</h1>
                </Link>
              </div>
              <div className="flex items-center justify-center gap-5">
                <Link
                  className="hover:underline hover:underline-offset-4"
                  href={"/nurse"}
                >
                  Dashboard
                </Link>
                <Link
                  className="hover:underline hover:underline-offset-4"
                  href={"/nurse/add-patient"}
                >
                  Add Patient
                </Link>
                <Link
                  className="hover:underline hover:underline-offset-4"
                  href={"/nurse/search-patient"}
                >
                  Search Patient
                </Link>

                <Link
                  className="hover:underline hover:underline-offset-4"
                  href={"/nurse/view-visit"}
                >
                  View Visits
                </Link>
              </div>
            </div>
          </div>
          <div className="block md:hidden">
            <div className="flex items-center justify-between">
              <div>
                <Link
                  href={"/nurse"}
                  className="tracking-tight font-bold text-lg"
                >
                  <Image src={logo} alt="logo" className="w-[120px] h-[80px]" />
                </Link>
              </div>
              <Sheet open={isOpen} onOpenChange={setIsOpen}>
                <SheetTrigger className="align-middle">
                  {/* <Image
                    src={menu}
                    alt="menu"
                    width={24}
                    height={24}
                    className="cursor-pointer "
                  /> */}
                  <h1>Ibrahim Medical</h1>
                </SheetTrigger>
                <SheetContent className="flex flex-col gap-6 bg-black md:hidden">
                  <Link
                    href={"/nurse"}
                    className="tracking-tight font-bold text-lg"
                  >
                    {/* <Image
                      src={logo}
                      alt="logo"
                      className="w-[120px] h-[80px]"
                    /> */}
                    <h1>Ibrahim Medical</h1>
                  </Link>
                  <Separator className="border border-gray-50" />
                  <div className="flex flex-col gap-5">
                    <Link
                      className="hover:underline hover:underline-offset-4"
                      href={"/nurse"}
                    >
                      Dashboard
                    </Link>
                    <Link
                      className="hover:underline hover:underline-offset-4"
                      href={"/nurse/add-patient"}
                    >
                      Add Patient
                    </Link>
                    <Link
                      className="hover:underline hover:underline-offset-4"
                      href={"/nurse/search-patient"}
                    >
                      Search Patient
                    </Link>

                    <Link
                      className="hover:underline hover:underline-offset-4"
                      href={"/nurse/view-visit"}
                    >
                      View Visits
                    </Link>
                  </div>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </>
      )}
      {session?.user.role === "admin" &&
        pathname !== "/signin" &&
        pathname !== "/signup" && (
          <>
            <div className="hidden md:block">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <Link
                    href={"/admin"}
                    className="tracking-tight font-bold text-lg"
                  >
                    {/* <Image src={logo} alt="logo" /> */}
                    <h1>Ibrahim Medical</h1>
                  </Link>
                </div>
                <div className="flex items-center justify-center gap-5">
                  {/* <Link
                    className="hover:underline hover:underline-offset-4"
                    href={"/admin-dashboard"}
                  >
                    Dashboard
                  </Link> */}
                  <Link
                    className="hover:underline hover:underline-offset-4"
                    href={"/signup"}
                  >
                    Add Doctor
                  </Link>
                  <Link
                    className="hover:underline hover:underline-offset-4"
                    href={"/signup"}
                  >
                    Add Nurse
                  </Link>
                  <Link
                    className="hover:underline hover:underline-offset-4"
                    href={"/signup"}
                  >
                    Add Pharmacist
                  </Link>
                  <Link
                    className="hover:underline hover:underline-offset-4"
                    href={"/signup"}
                  >
                    Front Desk
                  </Link>
                </div>
              </div>
            </div>
            <div className="block md:hidden">
              <div className="flex items-center justify-between">
                <div>
                  <Link
                    href={"/admin"}
                    className="tracking-tight font-bold text-lg"
                  >
                    <h1>Ibrahim Medical</h1>
                  </Link>
                </div>
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger className="align-middle">
                    <Image
                      src={menu}
                      alt="menu"
                      width={24}
                      height={24}
                      className="cursor-pointer "
                    />
                  </SheetTrigger>
                  <SheetContent className="flex flex-col gap-6 bg-blue-800 md:hidden">
                    <Link
                      href={"/admin"}
                      className="tracking-tight font-bold text-lg"
                    >
                      {/* <Image src={logo} alt="logo" /> */}
                      <h1>Ibrahim Medical</h1>
                    </Link>
                    <Separator className="border border-gray-50" />
                    <div className="flex flex-col gap-5">
                      {/* <Link
                        className="hover:underline hover:underline-offset-4"
                        href={"/admin-dashboard"}
                      >
                        Dashboard
                      </Link> */}
                      <Link
                        className="hover:underline hover:underline-offset-4"
                        href={"/signup"}
                      >
                        Add Doctor
                      </Link>
                      <Link
                        className="hover:underline hover:underline-offset-4"
                        href={"/signup"}
                      >
                        Add Nurse
                      </Link>
                      <Link
                        className="hover:underline hover:underline-offset-4"
                        href={"/signup"}
                      >
                        Add Pharmacist
                      </Link>
                      <Link
                        className="hover:underline hover:underline-offset-4"
                        href={"/signup"}
                      >
                        Front Desk
                      </Link>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </>
        )}
      {/* {session?.user.role === 'doctor' && (


      )} */}
      {/* {session?.user.role === "pharmacist" && ()}  */}
    </div>
  );
};

export default Navbar;
