-- CreateTable
CREATE TABLE "Lobby" (
    "id" TEXT NOT NULL,
    "lobbyIdentifier" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "private" BOOLEAN NOT NULL DEFAULT false,
    "pin" TEXT,
    "hostUserId" TEXT,
    "hostGuestId" TEXT,
    "leaderboardId" TEXT,
    "activeGameId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lobby_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LobbyPlayer" (
    "id" TEXT NOT NULL,
    "lobbyId" TEXT NOT NULL,
    "userId" TEXT,
    "guestId" TEXT,
    "displayName" TEXT NOT NULL,
    "avatar" TEXT,
    "score" INTEGER NOT NULL DEFAULT 0,
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),

    CONSTRAINT "LobbyPlayer_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_lobbyIdentifier_key" ON "Lobby"("lobbyIdentifier");

-- CreateIndex
CREATE UNIQUE INDEX "Lobby_code_key" ON "Lobby"("code");

-- CreateIndex
CREATE INDEX "Lobby_hostUserId_idx" ON "Lobby"("hostUserId");

-- CreateIndex
CREATE INDEX "Lobby_hostGuestId_idx" ON "Lobby"("hostGuestId");

-- CreateIndex
CREATE INDEX "LobbyPlayer_userId_idx" ON "LobbyPlayer"("userId");

-- CreateIndex
CREATE INDEX "LobbyPlayer_guestId_idx" ON "LobbyPlayer"("guestId");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyPlayer_lobbyId_userId_key" ON "LobbyPlayer"("lobbyId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "LobbyPlayer_lobbyId_guestId_key" ON "LobbyPlayer"("lobbyId", "guestId");

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_hostUserId_fkey" FOREIGN KEY ("hostUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lobby" ADD CONSTRAINT "Lobby_hostGuestId_fkey" FOREIGN KEY ("hostGuestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_lobbyId_fkey" FOREIGN KEY ("lobbyId") REFERENCES "Lobby"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LobbyPlayer" ADD CONSTRAINT "LobbyPlayer_guestId_fkey" FOREIGN KEY ("guestId") REFERENCES "Guest"("id") ON DELETE SET NULL ON UPDATE CASCADE;
