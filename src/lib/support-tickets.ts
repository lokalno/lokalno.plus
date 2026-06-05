import { prisma } from "./prisma";

export async function countOpenSupportTickets(): Promise<number> {
  try {
    return await prisma.supportTicket.count({ where: { adminUnread: true } });
  } catch {
    return 0;
  }
}
