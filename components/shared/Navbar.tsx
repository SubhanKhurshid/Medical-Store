import React from "react";
import { useAuth } from "@/app/providers/AuthProvider";
import { Menu, Transition } from "@headlessui/react";
import { UserCircleIcon } from '@heroicons/react/24/solid';
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";

const Navbar = () => {
  const { user, logout } = useAuth();
  const router = useRouter();
  const role = user?.role;

  const handleLogout = (event: any) => {
    event.preventDefault();
    logout();
    router.push("/signin");
  };

  if (!role) return null;

  return (
    <nav className="bg-gradient-to-r from-white to-gray-100 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-end h-16 items-center"> {/* Updated class to justify-end */}
          <div className="ml-3 relative z-50">
            <Menu as="div" className="relative inline-block text-left">
              <Menu.Button className="flex items-center justify-center w-12 h-12 rounded-full bg-white border-2 border-red-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-all duration-300 hover:bg-red-50">
                <span className="sr-only">Open user menu</span>
                {user?.image ? (
                  <Image
                    className="h-10 w-10 rounded-full object-cover"
                    src={user.image}
                    alt="User profile"
                    width={40}
                    height={40}
                  />
                ) : (
                  <UserCircleIcon className="h-10 w-10 text-red-600" aria-hidden="true" />
                )}
              </Menu.Button>
              <Transition
                as={React.Fragment}
                enter="transition ease-out duration-200"
                enterFrom="transform opacity-0 scale-95"
                enterTo="transform opacity-100 scale-100"
                leave="transition ease-in duration-150"
                leaveFrom="transform opacity-100 scale-100"
                leaveTo="transform opacity-0 scale-95"
              >
                <Menu.Items className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none">
                  <div className="py-1">
                    <Menu.Item>
                      {({ active }) => (
                        <Link
                          href="/profile"
                          className={`${
                            active ? 'bg-red-50 text-red-700' : 'text-gray-700'
                          } flex items-center px-4 py-2 text-sm`}
                        >
                          <UserCircleIcon className="mr-3 h-5 w-5 text-red-400" aria-hidden="true" />
                          Profile
                        </Link>
                      )}
                    </Menu.Item>
                    <Menu.Item>
                      {({ active }) => (
                        <button
                          onClick={handleLogout}
                          className={`${
                            active ? 'bg-red-50 text-red-700' : 'text-gray-700'
                          } flex items-center w-full text-left px-4 py-2 text-sm`}
                        >
                          <svg className="mr-3 h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                            <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                          </svg>
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
