export type UserRole = "ADMIN" | "USER";

export interface UserDTO {
  id: string;
  username: string;
  role: UserRole;
  createdAt: string;
}

export interface SessionUserDTO {
  id: string;
  username: string;
  role: UserRole;
}
