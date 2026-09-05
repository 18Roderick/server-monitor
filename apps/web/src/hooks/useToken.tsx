import { type SessionPayload, getToken, saveToken } from "@/utils/storageToken";
import { useState } from "react";

const useToken = () => {
  const [token, setToken] = useState(getToken());

  return {
    setToken: (userToken: SessionPayload) => {
      saveToken(userToken);
      setToken(userToken.token);
    },
    token,
  };
};

export default useToken;
