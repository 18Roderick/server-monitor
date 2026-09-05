import Navbar from "@/components/navbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import type { AuthContext } from "@/hooks/useAuth";
import type { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

interface RouterContext {
	queryClient: QueryClient;
	auth: AuthContext;
}

export const Route = createRootRouteWithContext<RouterContext>()({
	component: () => {
		return (
			<>
				<TooltipProvider>
					<div className="flex min-h-screen flex-col">
						<Navbar />
						<div className="flex flex-1 flex-col">
							<Outlet />
						</div>
					</div>
				</TooltipProvider>

				{/* <Toaster /> */}
				<TanStackRouterDevtools />
			</>
		);
	},
	notFoundComponent: () => <h1>No Encontrada</h1>,
});
