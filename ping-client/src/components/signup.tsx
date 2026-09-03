import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import { Input } from "./ui/input";

import * as api from "@/api";
import { Loader2 } from "lucide-react";
import axios from "axios";
import useToken from "@/hooks/useToken";

const formSchema = z.object({
	name: z.string().min(5),
	email: z.string().email().min(2, {
		message: "must be an email address",
	}),
	password: z.string().min(5),
});

type SigninDto = z.infer<typeof formSchema>;

export default function SignUp() {
	const auth = useToken();
	const navigate = useNavigate({ from: "/auth/signin" });
	const form = useForm<SigninDto>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			password: "",
			email: "",
		},
	});

	const onSubmit = (data: SigninDto) => mutation.mutate(data);
	const mutation = useMutation({
		mutationFn: api.signUp,
		mutationKey: ["auth/signup"],
		onSuccess: (response) => {
			toast("user signed in successfully");
			auth.setToken({ token: response.token });
			navigate({ to: "/" });
		},
		onError: (response: unknown) => {
			if (axios.isAxiosError(response)) {
				form.setError("email", {
					type: "manual",
					message: response.response?.data.message,
				});
			}
		},
	});

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)}>
				<FormField
					control={form.control}
					name="name"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input type="text" placeholder="name" {...field} />
							</FormControl>
							<FormDescription>User Name</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="email"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Email</FormLabel>
							<FormControl>
								<Input type="email" placeholder="Email" {...field} />
							</FormControl>
							<FormDescription>User email</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormField
					control={form.control}
					name="password"
					render={({ field }) => (
						<FormItem>
							<FormLabel>Password</FormLabel>
							<FormControl>
								<Input type="password" placeholder="password" {...field} />
							</FormControl>
							<FormDescription>user password</FormDescription>
							<FormMessage />
						</FormItem>
					)}
				/>

				<Button type="submit" disabled={mutation.isPending}>
					Login
					{mutation.isPending ? (
						<Loader2 className="mr-2 h-4 w-4 animate-spin" />
					) : null}
				</Button>
			</form>
		</Form>
	);
}
