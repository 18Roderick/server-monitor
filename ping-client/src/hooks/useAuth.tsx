import * as React from "react";
import useToken from "./useToken";

export interface AuthContext {
	isAuthenticated: boolean;
	setUser: (username: string | null) => void;
	user: string | null;
	token: string ;
	login: (tk: string) => void;
	logOut: () => void;
}

const AuthContext = React.createContext<AuthContext | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
	const [user, setUser] = React.useState<string | null>(null);

	const { setToken, token } = useToken();

	function login(tk: string) {
		setToken({ token: tk });
	}

	function logOut() {
		setToken({ token: "" });
		setUser("");
	}

	const authValue = { isAuthenticated: !!token, user, setUser, token , login, logOut};
	return (
		<AuthContext.Provider value={authValue}>{children}</AuthContext.Provider>
	);
}

export function useAuth() {
	const context = React.useContext(AuthContext);
	if (!context) {
		throw new Error("useAuth must be used within an AuthProvider");
	}
	return context;
}


