"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { MenuIcon } from "lucide-react";
import { useState } from "react";

import { Button} from "@/components/ui/button";
import LogoSvg from "@/assets/svg/logo";
import { Me } from "@/lib/types";

interface NavbarProps {
  user: Me;
  onLogout: () => void;
}

export default function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const [openNavMenu, setOpenNavMenu] = useState(false);
  return (
    <header className="bg-background sticky shadow-sm top-0 z-10">
      <div
        data-mobile-nav={openNavMenu ? "open" : "closed"}
        data-state={openNavMenu ? "open" : "closed"}
        className={`group flex px-6 fixed inset-0 z-5 gap-3 bg-background/90 backdrop-blur-sm min-h-screen flex-col p-5 items-start data-[state=closed]:pointer-events-none data-[state=closed]:invisible data-[state=open]:animate-in data-[state=open]:fade-in duration-300 data-[state=closed]:animate-out data-[state=closed]:fade-out`}
      >
        <Link href="/tickets" onClick={() => setOpenNavMenu(false)}>
          <div className="flex items-center gap-1">
            <LogoSvg className="size-8" />
            <span className="text-3xl font-bold">SVO</span>
          </div>
        </Link>
        <div className="mt-5 flex w-full  flex-col gap-3 font-medium text-2xl">
          <Link
            href="/tickets"
            onClick={() => setOpenNavMenu(false)}
            className="border-b group-data-[state=open]:animate-in group-data-[state=open]:fade-in group-data-[state=open]:slide-in-from-top-2 group-data-[state=open]:delay-75"
          >
            <span className="inline-block transition-transform hover:translate-x-1">
              Ticket
            </span>
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin/users"
              className="border-b group-data-[state=open]:animate-in group-data-[state=open]:fade-in group-data-[state=open]:slide-in-from-top-2 group-data-[state=open]:delay-150"
              onClick={() => setOpenNavMenu(false)}
            >
              <span className="inline-block transition-transform hover:translate-x-1">
                Users
              </span>
            </Link>
          )}
          <div className="w-fit group-data-[state=open]:animate-in group-data-[state=open]:fade-in group-data-[state=open]:slide-in-from-top-2 group-data-[state=open]:delay-200">
            <Button
              type="button"
              onClick={onLogout}
              className="flex w-fit cursor-pointer items-center gap-2 rounded-md bg-destructive px-2 py-1 text-xl transition-transform hover:bg-destructive/90 duration-200 hover:translate-x-0.5"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-6 w-6"
              >
                <path d="m16 17 5-5-5-5" />
                <path d="M21 12H9" />
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              </svg>
              Logout
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex max-w-6xl px-6 gap-8 py-5">
        <div className="text-muted-foreground flex flex-1 items-center gap-5 font-medium">
          <Link href="/tickets">
            <div className="flex items-center gap-1">
              <LogoSvg className="size-8" />
              <span className="text-3xl font-bold">SVO</span>
            </div>
          </Link>
          <Link
            href="/tickets"
            className={`max-md:hidden hover:bg-foreground/5 text-md py-1.5 px-2.5 rounded-md ${
              pathname === "/tickets" ? "bg-foreground/5" : ""
            }`}
          >
            Tickets
          </Link>
          {user.role === "admin" && (
            <Link
              href="/admin/users"
              className={`max-md:hidden hover:bg-foreground/5 text-md py-1.5 px-2.5 rounded-md ${
                pathname === "/admin/users" ? "bg-foreground/5" : ""
              }`}
            >
              Users
            </Link>
          )}
        </div>

        <div className="ml-auto flex items-center gap-6">
          <span className="capitalize text-gray-500 max-md:hidden">
            Welcome, {user.role} {user.name}! | {user.business.name}
          </span>
          <Button
            onClick={onLogout}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/85 max-md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="w-6 h-6"
            >
              <path d="m16 17 5-5-5-5" />
              <path d="M21 12H9" />
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            </svg>
            Logout
          </Button>

          <Button
            className="flex md:hidden z-10"
            variant="outline"
            size="icon"
            onClick={() => setOpenNavMenu(!openNavMenu)}
          >
            <MenuIcon />
          </Button>
        </div>
      </div>
    </header>
  );
}
