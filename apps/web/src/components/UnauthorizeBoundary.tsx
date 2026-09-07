import axios from "axios";
import { Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export default function UnauthorizeBoundary({ error }: { error: unknown }) {
	const isUnauthorized =
		axios.isAxiosError(error) && error.response?.status === 401;

	if (isUnauthorized) {
		return (
			<div className="flex flex-col items-center gap-4 p-12 text-center">
				<h1 className="font-display text-2xl">Not authorized</h1>
				<p className="text-sm text-muted-foreground">
					You need to sign in to view this page.
				</p>
				<Button asChild>
					<Link to="/auth/signin">Sign in</Link>
				</Button>
			</div>
		);
	}

	return (
		<div className="flex flex-col items-center gap-4 p-12 text-center">
			<h1 className="font-display text-2xl">Something went wrong</h1>
			<p className="text-sm text-muted-foreground">
				We couldn't load this page. Please try again.
			</p>
			<Button onClick={() => window.location.reload()}>Reload</Button>
		</div>
	);
}
