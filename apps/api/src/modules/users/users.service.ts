import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.client.user.findUnique({ where: { id } });
  }

  findByEmail(email: string) {
    return this.prisma.client.user.findUnique({ where: { email } });
  }
}
