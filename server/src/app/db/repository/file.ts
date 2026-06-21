import { and, desc, eq } from "drizzle-orm";
import { generateBase64String } from "../../lib/utils.js";
import { db } from "../connection.js";
import { file } from "../schema.js";

type FileType = typeof file.$inferSelect;
class Repository {
  async createNewFile(args: Omit<FileType, "id">) {
    const [newFile] = await db
      .insert(file)
      .values({
        id: generateBase64String(32),
        ...args,
      })
      .returning();

    return newFile;
  }

  async getFileById(args: { id: string }) {
    const result = await db.query.file.findFirst({
      where: (fields, { eq }) => eq(fields.id, args.id),
    });

    return result;
  }

  async getFilesByMessageId(args: { messageId: string }) {
    const result = await db.query.file.findFirst({
      where: (fields, { eq }) => eq(fields.messageId, args.messageId),
    });

    return result;
  }

  async updateFile(args: { id: string; args: Partial<FileType> }) {
    const [updatedFile] = await db
      .update(file)
      .set({ ...args })
      .where(eq(file.id, args.id))
      .returning();

    return updatedFile;
  }

  async deleteFile(args: { id: string }) {
    await db.delete(file).where(eq(file.id, args.id));
    return true;
  }

  async deleteFileByMessageId(args: { messageId: string }) {
    await db.delete(file).where(eq(file.messageId, args.messageId));
    return true;
  }
}

export const fileRepository = new Repository();
