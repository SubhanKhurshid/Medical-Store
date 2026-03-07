import React from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Menu, Transition } from "@headlessui/react";
import { UserCircleIcon, ChevronDownIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const role = user?.role;

  const handleLogout = (event: React.MouseEvent) => {
    event.preventDefault();
    logout();
    router.push("/signin");
  };

  if (!role) return null;

  return (
    <nav className="bg-white border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-14 sm:h-16">
          <Menu as="div" className="relative z-50">
            <Menu.Button className="group flex items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2">
              <div className="relative flex-shrink-0 flex items-center justify-center overflow-hidden rounded-full bg-gray-100 ring-2 ring-white shadow-sm">
                {user?.image ? (
                  <Image
                    className="h-9 w-9 sm:h-10 sm:w-10 rounded-full object-cover"
                    src={user.image}
                    alt=""
                    width={40}
                    height={40}
                  />
                ) : (
                  <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-full bg-red-100 flex items-center justify-center">
                    <UserCircleIcon className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                  </div>
                )}
              </div>
              <div className="hidden sm:flex flex-col items-start min-w-0">
                <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px] capitalize">
                  {user?.name || "User"}
                </span>
                <span className="text-xs text-red-600 capitalize">{role}</span>
              </div>
              <ChevronDownIcon
                className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 flex-shrink-0 group-hover:text-red-600 transition-colors"
                aria-hidden="true"
              />
            </Menu.Button>

            <Transition
              as={React.Fragment}
              enter="transition ease-out duration-150"
              enterFrom="opacity-0 translate-y-1"
              enterTo="opacity-100 translate-y-0"
              leave="transition ease-in duration-100"
              leaveFrom="opacity-100 translate-y-0"
              leaveTo="opacity-0 translate-y-1"
            >
              <Menu.Items className="absolute right-0 mt-2 w-64 origin-top-right rounded-xl bg-white py-1.5 shadow-lg ring-1 ring-gray-200/80 focus:outline-none">
                <div className="px-3 py-3 pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="relative flex-shrink-0 overflow-hidden rounded-full bg-gray-100">
                      {user?.image ? (
                        <Image
                          className="h-10 w-10 rounded-full object-cover"
                          src={user.image}
                          alt=""
                          width={40}
                          height={40}
                        />
                      ) : (
                        <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                          <UserCircleIcon className="h-6 w-6 text-red-600" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 truncate capitalize">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-red-600 capitalize">{role}</p>
                    </div>
                  </div>
                </div>
                <div className="px-1.5 pt-1.5">
                  <Menu.Item>
                    {({ active }) => (
                      <Link
                        href="/profile"
                        className={`flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          active ? "bg-red-50 text-red-700" : "text-gray-700"
                        }`}
                      >
                        <UserCircleIcon className="h-5 w-5 text-red-500 flex-shrink-0" />
                        Profile
                      </Link>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        type="button"
                        onClick={handleLogout}
                        className={`flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                          active ? "bg-red-50 text-red-700" : "text-gray-700"
                        }`}
                      >
                        <ArrowLeftOnRectangleIcon className="h-5 w-5 text-gray-500 flex-shrink-0" />
                        Logout
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
