import { createRootRouteWithContext, Outlet } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import type { QueryClient } from "@tanstack/react-query";
import type { AuthContext } from "@/hooks/useAuth";
import { TooltipProvider } from "@/components/ui/tooltip";

interface RouterContext {
	queryClient: QueryClient;
	auth: AuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => {
		return (
			<>
				<TooltipProvider>
					<Outlet />
				</TooltipProvider>

				{/* <Toaster /> */}
				<TanStackRouterDevtools />
			</>
		);
	},
	notFoundComponent: () => <h1>No Encontrada</h1>,
});
