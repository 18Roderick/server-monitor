import Signin from "@/components/signin";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/auth/signin")({
	component: () => (
		<div className="container">
			<div className="w-full h-full max-w-80 mx-auto first:mt-2 border p-2 rounded-sm ">
				<Signin />
			</div>
		</div>
	),
});
