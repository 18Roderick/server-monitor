import { Link } from "@tanstack/react-router";
// biome-ignore lint/style/useImportType: <explanation>
import * as React from "react";

export default function Layout({
	children,
	isAuth,
}: { children: React.ReactNode; isAuth: boolean }) {
	return (
		<>
			<div className="p-2 flex gap-2">
				<Link to="/" className="[&.active]:font-bold">
					Home
				</Link>
				<Link to="/servers" className="[&.active]:font-bold">
					My Servers
				</Link>
				{!isAuth && (
					<>
						<Link to="/auth/signup" className="[&.active]:font-bold">
							signup
						</Link>
						<Link to="/auth/signin" className="[&.active]:font-bold">
							signin
						</Link>
					</>
				)}
			</div>
			{children}
			<footer>Footer</footer>
		</>
	);
}
