import React from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Menu, Transition } from "@headlessui/react";
import { UserCircleIcon, ChevronDownIcon, Cog6ToothIcon, ArrowLeftOnRectangleIcon } from "@heroicons/react/24/outline";
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
    <nav className="bg-white border-b border-red-500">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end items-center h-16">
          <div className="relative z-50">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="flex items-center space-x-3 rounded-full px-4 py-2 bg-white group transition-all duration-200 ease-in-out transform">
                <div className="relative flex-shrink-0">
                  {user?.image ? (
                    <Image
                      className="h-12 w-12 rounded-full object-cover shadow-md group-hover:ring-2 group-hover:ring-red-500 transition-all duration-200 ease-in-out"
                      src={user.image}
                      alt="User profile"
                      width={48}
                      height={48}
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center shadow-md">
                      <UserCircleIcon className="h-8 w-8 text-red-600" />
                    </div>
                  )}
                </div>
                <div className="hidden md:flex flex-col items-start">
                  <p className="text-sm font-semibold text-gray-800 capitalize">{user?.name || "User"}</p>
                  <p className="text-xs font-normal text-red-600 capitalize">{role}</p>
                </div>
                <ChevronDownIcon
                  className="h-5 w-5 text-gray-500 group-hover:text-red-600 transition-colors"
                  aria-hidden="true"
                />
              </Menu.Button>

              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-100"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-75"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-lg shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none divide-y divide-gray-100">
                  <div className="px-1 py-2">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`${
                            active ? "bg-red-50 text-red-700" : "text-gray-700"
                          } group flex items-center px-4 py-2.5 text-sm rounded-md transition-colors`}
                        >
                          <UserCircleIcon className="mr-3 h-5 w-5 text-red-600" />
                          Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/settings"
                          className={`${
                            active ? "bg-red-50 text-red-700" : "text-gray-700"
                          } group flex items-center px-4 py-2.5 text-sm rounded-md transition-colors`}
                        >
                          <Cog6ToothIcon className="mr-3 h-5 w-5 text-gray-500" />
                          Settings
                        </Link>
                      )}
                    </Menu.Item>
                  </div>
                  <div className="px-1 py-2">
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? "bg-red-50 text-red-700" : "text-gray-700"
                          } w-full group flex items-center px-4 py-2.5 text-sm rounded-md transition-colors`}
                        >
                          <ArrowLeftOnRectangleIcon className="mr-3 h-5 w-5 text-gray-500" />
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
      </div>
    </nav>
  );
};

export default Navbar;
