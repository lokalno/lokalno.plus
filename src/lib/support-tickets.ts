import { prisma } from "./prisma";

export async function countOpenSupportTickets(): Promise<number> {
  try {
    return await prisma.supportTicket.count({ where: { status: "OPEN" } });
  } catch {
    return 0;
  }
}
