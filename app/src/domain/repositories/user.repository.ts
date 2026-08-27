export interface AuthUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  jobTitle: string;
  isActive: boolean;
}

export interface UserRepository {
  findByEmail(email: string): Promise<AuthUser | null>;
}