import { query } from "@/infrastructure/database/postgres";
import {
  AuthUser,
  UserRepository,
} from "@/domain/repositories/user.repository";

export class PostgresUserRepository implements UserRepository {
  async findByEmail(email: string): Promise<AuthUser | null> {
    const result = await query<{
      id: string;
      name: string;
      email: string;
      password_hash: string;
      job_title: string;
      is_active: boolean;
    }>(
      `
      SELECT
        id,
        name,
        email,
        password_hash,
        job_title,
        is_active
      FROM rw_users
      WHERE lower(email) = lower($1)
        AND deleted_at IS NULL
      LIMIT 1
      `,
      [email],
    );

    const user = result.rows[0];

    if (!user) {
      return null;
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.password_hash,
      jobTitle: user.job_title,
      isActive: user.is_active,
    };
  }
}