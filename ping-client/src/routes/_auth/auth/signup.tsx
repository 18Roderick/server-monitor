import SignUp from "@/components/signup";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_auth/auth/signup")({
	component: SignUpPage,
});

function SignUpPage() {
	return (
		<div className="container">
			<div className="w-full h-full max-w-80 mx-auto first:mt-2 border p-2 rounded-sm ">
				<SignUp />
			</div>
		</div>
	);
}
