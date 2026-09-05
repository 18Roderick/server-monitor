import { httpClient } from "./";

export type SignIn = {
  email: string;
  password: string;
};

export type SignUp = {
  name: string;
  email: string;
  password: string;
};

export async function signIn(dto: SignIn) {
  const response = await httpClient.post<{ token: string }>("/auth/signin", dto);
  return response.data;
}

export async function signUp(dto: SignUp) {
  const response = await httpClient.post<{ token: string }>("/auth/signup", dto);
  return response.data;
}
