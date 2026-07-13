-- Tabelas do gerenciador de tokens e da auditoria de mensagens.
-- Rode isto no banco `microsoft` do RDS caso prefira criar manualmente
-- (alternativa ao `npx prisma db push`, que precisa de credenciais validas no DATABASE_URL).

CREATE TABLE `ApiToken` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `token` VARCHAR(191) NOT NULL,
    `nome` VARCHAR(191) NOT NULL,
    `ativo` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `ApiToken_token_key`(`token`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE `MessageLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `chat` VARCHAR(191) NOT NULL,
    `mensagem` TEXT NOT NULL,
    `status` VARCHAR(191) NOT NULL,
    `messageId` VARCHAR(191) NULL,
    `erro` TEXT NULL,
    `token` VARCHAR(191) NOT NULL,
    `tokenNome` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `MessageLog_token_idx`(`token`),
    INDEX `MessageLog_createdAt_idx`(`createdAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `MessageLog` ADD CONSTRAINT `MessageLog_token_fkey`
    FOREIGN KEY (`token`) REFERENCES `ApiToken`(`token`)
    ON DELETE RESTRICT ON UPDATE CASCADE;
