import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Link, type LinkProps } from "@tanstack/react-router";
import { LogOut, Server, User2Icon } from "lucide-react";
import { useState } from "react";

interface NavbarProps extends LinkProps {
	className?: string;
	onClick?: () => void;
}

const NavLink = ({ children, ...props }: NavbarProps) => (
	<Link
		{...props}
		activeProps={{
			className: "border-accent text-foreground",
		}}
		className={cn(
			"block border-b-2 border-transparent px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground",
			props.className,
		)}
	>
		{children}
	</Link>
);

const menus: {
	name: string;
	href: LinkProps["to"];
}[] = [
	{
		name: "Servers",
		href: "/servers",
	},
	{
		name: "About",
		href: "/about",
	},
];

const Navbar = () => {
	const [open, setOpen] = useState(false);
	const auth = useAuth();

	const toggleMenu = () => setOpen((prev) => !prev);
	const closeMenu = () => setOpen(false);

	return (
		<nav className="border-b-2 border-border bg-background">
			<div className="mx-auto flex max-w-screen-xl flex-wrap items-center justify-between p-4">
				<NavLink
					to="/"
					className="flex items-center space-x-3 !border-0 !p-0 rtl:space-x-reverse"
				>
					<span className="flex h-8 w-8 items-center justify-center bg-primary text-primary-foreground">
						<Server size={18} />
					</span>
					<span className="font-display text-sm">GRID</span>
				</NavLink>
				<button
					onClick={toggleMenu}
					data-collapse-toggle="navbar-default"
					type="button"
					className="inline-flex h-10 w-10 items-center justify-center border-2 border-border p-2 text-sm md:hidden"
					aria-controls="navbar-default"
					aria-expanded={open}
				>
					<span className="sr-only">Open main menu</span>
					<svg
						className="h-5 w-5"
						aria-hidden="true"
						xmlns="http://www.w3.org/2000/svg"
						fill="none"
						viewBox="0 0 17 14"
					>
						<path
							stroke="currentColor"
							strokeLinecap="round"
							strokeLinejoin="round"
							strokeWidth="2"
							d="M1 1h15M1 7h15M1 13h15"
						/>
					</svg>
				</button>
				<div
					className={cn("w-full md:block md:w-auto", open ? "block" : "hidden")}
					id="navbar-default"
				>
					<ul className="mt-4 flex flex-col p-4 md:mt-0 md:flex-row md:items-center md:gap-2 md:p-0">
						{menus.map((menu) => (
							<li key={menu.name + menu.href}>
								<NavLink to={menu.href} onClick={closeMenu}>
									{menu.name}
								</NavLink>
							</li>
						))}
						{auth.isAuthenticated && (
							<li>
								<NavLink to="/settings" onClick={closeMenu}>
									Settings
								</NavLink>
							</li>
						)}
						{auth.isAuthenticated ? (
							<li>
								<button
									type="button"
									onClick={() => {
										auth.logOut();
										closeMenu();
									}}
									className="flex items-center gap-2 border-b-2 border-transparent px-3 py-2 text-xs font-bold uppercase tracking-wide text-muted-foreground transition-colors hover:text-foreground"
								>
									<LogOut size={16} />
									Log out
								</button>
							</li>
						) : (
							<>
								<li>
									<NavLink to="/auth/signup" onClick={closeMenu}>
										Sign up
									</NavLink>
								</li>
								<li>
									<NavLink
										to="/auth/signin"
										className="!p-2"
										onClick={closeMenu}
									>
										<User2Icon size={18} />
										<span className="sr-only">Sign in</span>
									</NavLink>
								</li>
							</>
						)}
					</ul>
				</div>
			</div>
		</nav>
	);
};

export default Navbar;
