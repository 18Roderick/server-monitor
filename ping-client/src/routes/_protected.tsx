import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_protected")({
	beforeLoad: async ({ location, context }) => {
		const auth = context.auth;
		if (!auth.isAuthenticated) {
			throw redirect({
				to: "/auth/signin",
				search: {
					redirect: location.href,
				},
			});
		}
	},
	component: () => {
		return (
			<>
				<Outlet />
			</>
		);
	},
});
