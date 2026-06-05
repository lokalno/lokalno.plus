import { prisma } from "./prisma";

export type SupportTicketPayload = {
  id: string;
  subject: string;
  message: string;
  phone: string | null;
  status: string;
  adminNote: string | null;
  adminUnread: boolean;
  userUnread: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string;
    email: string;
    phone: string | null;
    city: string;
  };
  replies: {
    id: string;
    authorId: string;
    isAdmin: boolean;
    content: string;
    createdAt: string;
    author: { id: string; name: string };
  }[];
};

export async function getSupportTicketForViewer(
  ticketId: string,
  viewerId: string,
  isAdmin: boolean
): Promise<SupportTicketPayload | null> {
  const ticket = await prisma.supportTicket.findUnique({
    where: { id: ticketId },
    include: {
      user: { select: { id: true, name: true, email: true, phone: true, city: true } },
      replies: {
        include: { author: { select: { id: true, name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!ticket) return null;
  if (!isAdmin && ticket.userId !== viewerId) return null;

  if (isAdmin && ticket.adminUnread) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { adminUnread: false },
    });
    ticket.adminUnread = false;
  } else if (!isAdmin && ticket.userUnread) {
    await prisma.supportTicket.update({
      where: { id: ticketId },
      data: { userUnread: false },
    });
    ticket.userUnread = false;
  }

  return {
    id: ticket.id,
    subject: ticket.subject,
    message: ticket.message,
    phone: ticket.phone,
    status: ticket.status,
    adminNote: ticket.adminNote,
    adminUnread: ticket.adminUnread,
    userUnread: ticket.userUnread,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    user: ticket.user,
    replies: ticket.replies.map((r) => ({
      id: r.id,
      authorId: r.authorId,
      isAdmin: r.isAdmin,
      content: r.content,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
    })),
  };
}

export async function addSupportReply(
  ticketId: string,
  authorId: string,
  isAdmin: boolean,
  content: string
) {
  const ticket = await prisma.supportTicket.findUnique({ where: { id: ticketId } });
  if (!ticket) return null;
  if (!isAdmin && ticket.userId !== authorId) return null;

  const reply = await prisma.$transaction(async (tx) => {
    const created = await tx.supportReply.create({
      data: {
        ticketId,
        authorId,
        isAdmin,
        content,
      },
      include: { author: { select: { id: true, name: true } } },
    });

    await tx.supportTicket.update({
      where: { id: ticketId },
      data: {
        status: isAdmin ? ticket.status : "OPEN",
        adminUnread: isAdmin ? false : true,
        userUnread: isAdmin ? true : false,
        updatedAt: new Date(),
      },
    });

    return created;
  });

  return {
    id: reply.id,
    authorId: reply.authorId,
    isAdmin: reply.isAdmin,
    content: reply.content,
    createdAt: reply.createdAt.toISOString(),
    author: reply.author,
  };
}
