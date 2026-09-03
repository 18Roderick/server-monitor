export type SessionPayload = {
  token: string;
};

export const getToken = () => {
  const tokenString = sessionStorage.getItem("token") as string;
  const userToken: SessionPayload = JSON.parse(tokenString);
  return userToken?.token;
};
export const saveToken = (userToken: SessionPayload) => {
  sessionStorage.setItem("token", JSON.stringify(userToken));
};
