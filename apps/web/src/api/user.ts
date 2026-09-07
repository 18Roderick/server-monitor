import { httpClient } from "./";

// PATCH /user/:id response shape.
export interface UserSummary {
  email: string;
  name: string;
  lastName: string;
  updatedAt: string;
}

export type UpdateUserInput = {
  name?: string;
};

export const updateUser = async (
  idUser: string | number,
  dto: UpdateUserInput,
) => {
  const response = await httpClient.patch<UserSummary[]>(
    `/user/${idUser}`,
    dto,
  );
  return response.data;
};
