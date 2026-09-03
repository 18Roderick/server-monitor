import { cn } from '@/lib/utils';
import { Link, type LinkProps } from '@tanstack/react-router';
import { Server, User2Icon, XIcon } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps extends LinkProps {
  className?: string;
}

const NavLink = ({ children, ...props }: NavbarProps) => (
  <Link
    {...props}
    activeProps={{
      className: 'text-lime-500 underline',
    }}
    className={cn(
      'transition-colors duration-150 ease-in-ou block py-2 px-3 text-white hover:text-lime-500 hover:underline ',
      props.className
    )}
  >
    {children}
  </Link>
);

const menus: {
  name: string;
  href: LinkProps['to'];
}[] = [
  {
    name: 'About',
    href: '/about',
  },
  {
    name: 'Services',
    href: '/servers',
  },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const toggleMenu = () => {
    setOpen(!open);
  };

  return (
    <nav className="bg-stone-900 border-gray-200 dark:bg-gray-900">
      <div className="max-w-screen-xl flex flex-wrap items-center justify-between mx-auto p-4">
        <NavLink to="/" className="flex items-center space-x-3 rtl:space-x-reverse">
          <span className="self-center text-2xl font-semibold whitespace-nowrap dark:text-white">
            <Server />
          </span>
        </NavLink>
        <button
          onClick={toggleMenu}
          data-collapse-toggle="navbar-default"
          type="button"
          className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-gray-500 rounded-lg md:hidden hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 dark:focus:ring-gray-600"
          aria-controls="navbar-default"
          aria-expanded="false"
        >
          <span className="sr-only">Open main menu</span>
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 17 14"
          >
            <path
              stroke="currentColor"
              stroke-linecap="round"
              stroke-linejoin="round"
              stroke-width="2"
              d="M1 1h15M1 7h15M1 13h15"
            />
          </svg>
        </button>
        <div
          className={cn('hidden w-full md:block md:w-auto', open ? 'block' : '')}
          id="navbar-default"
        >
          <ul className="font-medium flex flex-col p-4 md:p-0 mt-4 border  rounded-lg md:flex-row md:space-x-8 rtl:space-x-reverse md:mt-0 md:border-0 md:bg-stone-900 dark:bg-gray-800 md:dark:bg-gray-900 dark:border-gray-700">
            {menus.map(menu => (
              <li key={menu.name + menu.href}>
                <NavLink to={menu.href}>{menu.name}</NavLink>
              </li>
            ))}
            <li>
              <NavLink to="/auth/signin">
                <User2Icon />
              </NavLink>
            </li>
          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
