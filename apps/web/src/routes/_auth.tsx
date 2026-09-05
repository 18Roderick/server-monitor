import Layout from "@/components/layouts/MainLayout";
import { Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth")({
	component: () => (
		<Layout>
			<Outlet />
		</Layout>
	),
});
