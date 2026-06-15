import { createHash } from "crypto";
import { prisma } from "@/lib/prisma";

export function hashPromImportFile(buffer: ArrayBuffer): string {
  return createHash("sha256").update(Buffer.from(buffer)).digest("hex");
}

export type PromImportSessionView = {
  id: string;
  fileHash: string;
  fileName: string | null;
  totalRows: number;
  nextOffset: number;
  status: string;
  hasMore: boolean;
  updatedAt: string;
};

export const PROM_REIMPORT_CONFIRMATION_CODE = "REIMPORT_CONFIRMATION_REQUIRED";

export class PromReimportConfirmationRequired extends Error {
  readonly code = PROM_REIMPORT_CONFIRMATION_CODE;

  constructor(public readonly session: PromImportSessionView) {
    super(PROM_REIMPORT_CONFIRMATION_CODE);
    this.name = "PromReimportConfirmationRequired";
  }
}

export function requiresPromReimportConfirmation(
  status: string,
  confirmReimport?: boolean
): boolean {
  return status === "COMPLETED" && !confirmReimport;
}

export function shouldRestartPromImportSession(
  status: string,
  options: { forceRestart?: boolean; confirmReimport?: boolean }
): boolean {
  if (options.forceRestart) return true;
  if (options.confirmReimport && status === "COMPLETED") return true;
  return false;
}

export function toPromImportSessionView(session: {
  id: string;
  fileHash: string;
  fileName: string | null;
  totalRows: number;
  nextOffset: number;
  status: string;
  updatedAt: Date;
}): PromImportSessionView {
  return {
    id: session.id,
    fileHash: session.fileHash,
    fileName: session.fileName,
    totalRows: session.totalRows,
    nextOffset: session.nextOffset,
    status: session.status,
    hasMore: session.nextOffset < session.totalRows,
    updatedAt: session.updatedAt.toISOString(),
  };
}

export async function getActivePromImportSession(
  sellerId: string
): Promise<PromImportSessionView | null> {
  const session = await prisma.promImportSession.findFirst({
    where: { sellerId, status: "IN_PROGRESS" },
    orderBy: { updatedAt: "desc" },
  });

  return session ? toPromImportSessionView(session) : null;
}

export async function resolvePromImportSession(params: {
  sellerId: string;
  fileHash: string;
  fileName: string | null;
  totalRows: number;
  forceRestart?: boolean;
  confirmReimport?: boolean;
}): Promise<{ sessionId: string; offset: number }> {
  const existing = await prisma.promImportSession.findUnique({
    where: {
      sellerId_fileHash: {
        sellerId: params.sellerId,
        fileHash: params.fileHash,
      },
    },
  });

  if (existing) {
    if (requiresPromReimportConfirmation(existing.status, params.confirmReimport)) {
      throw new PromReimportConfirmationRequired(toPromImportSessionView(existing));
    }

    const restart = shouldRestartPromImportSession(existing.status, {
      forceRestart: params.forceRestart,
      confirmReimport: params.confirmReimport,
    });

    const updated = await prisma.promImportSession.update({
      where: { id: existing.id },
      data: {
        totalRows: params.totalRows,
        fileName: params.fileName ?? existing.fileName,
        nextOffset: restart ? 0 : existing.nextOffset,
        status: "IN_PROGRESS",
      },
    });

    return { sessionId: updated.id, offset: updated.nextOffset };
  }

  const created = await prisma.promImportSession.create({
    data: {
      sellerId: params.sellerId,
      fileHash: params.fileHash,
      fileName: params.fileName,
      totalRows: params.totalRows,
      nextOffset: 0,
      status: "IN_PROGRESS",
    },
  });

  return { sessionId: created.id, offset: 0 };
}

export async function advancePromImportSession(
  sessionId: string,
  nextOffset: number,
  totalRows: number
): Promise<void> {
  await prisma.promImportSession.update({
    where: { id: sessionId },
    data: {
      nextOffset,
      status: nextOffset >= totalRows ? "COMPLETED" : "IN_PROGRESS",
    },
  });
}

export async function cancelPromImportSession(
  sellerId: string,
  sessionId: string
): Promise<boolean> {
  const session = await prisma.promImportSession.findFirst({
    where: { id: sessionId, sellerId },
  });

  if (!session) return false;

  await prisma.promImportSession.update({
    where: { id: sessionId },
    data: { status: "CANCELLED" },
  });

  return true;
}
