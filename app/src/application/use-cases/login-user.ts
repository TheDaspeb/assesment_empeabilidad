import bcrypt from "bcrypt";

import { UserRepository } from "@/domain/repositories/user.repository";

interface LoginInput {
  email: string;
  password: string;
}

export class LoginUser {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(input: LoginInput) {
    const user = await this.userRepository.findByEmail(input.email);

    if (!user || !user.isActive) {
      throw new Error("INVALID_CREDENTIALS");
    }

    const passwordMatches = await bcrypt.compare(
      input.password,
      user.passwordHash,
    );

    if (!passwordMatches) {
      throw new Error("INVALID_CREDENTIALS");
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      jobTitle: user.jobTitle,
    };
  }
}