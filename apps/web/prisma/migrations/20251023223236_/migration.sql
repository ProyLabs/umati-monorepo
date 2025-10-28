/*
  Warnings:

  - Added the required column `maxPlayers` to the `Lobby` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Lobby` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Lobby" ADD COLUMN     "maxPlayers" INTEGER NOT NULL,
ADD COLUMN     "name" TEXT NOT NULL;
