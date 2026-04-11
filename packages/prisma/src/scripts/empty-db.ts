#!/usr/bin/env node

/**
 * Script to empty the database - deletes all records from all tables
 * Usage: pnpm prisma:empty-db
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function emptyDatabase() {
  try {
    console.log("🗑️  Emptying database...");

    // Delete in reverse order of foreign key dependencies
    // Lobby has foreign keys to User and Guest, so delete Lobby first
    const lobbyDeleted = await prisma.lobby.deleteMany({});
    console.log(`✅ Deleted ${lobbyDeleted.count} lobbies`);

    // Then delete User and Guest
    const userDeleted = await prisma.user.deleteMany({});
    console.log(`✅ Deleted ${userDeleted.count} users`);

    const guestDeleted = await prisma.guest.deleteMany({});
    console.log(`✅ Deleted ${guestDeleted.count} guests`);

    console.log("\n✨ Database emptied successfully!");
  } catch (error) {
    console.error("❌ Error emptying database:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

emptyDatabase();
