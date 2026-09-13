-- CreateTable
CREATE TABLE `users` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `phone` VARCHAR(20) NOT NULL,
    `email` VARCHAR(255) NULL,
    `password` VARCHAR(255) NOT NULL,
    `role` ENUM('CITIZEN', 'COORDINATOR', 'TEAM_MEMBER', 'ADMIN') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_requests` (
    `id` VARCHAR(36) NOT NULL,
    `requester_id` VARCHAR(36) NOT NULL,
    `location_address` VARCHAR(500) NOT NULL,
    `latitude` DECIMAL(10, 7) NULL,
    `longitude` DECIMAL(10, 7) NULL,
    `people_count` INTEGER NOT NULL,
    `description` TEXT NULL,
    `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NULL,
    `status` ENUM('CREATED', 'VERIFYING', 'INVALID', 'VERIFIED', 'PRIORITIZED', 'WAITING_FOR_TEAM', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'RESCUE_FAILED', 'CANCELLED') NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_rescuerequest_requester_id`(`requester_id`),
    INDEX `idx_rescuerequest_status`(`status`),
    INDEX `idx_rescuerequest_priority`(`priority`),
    INDEX `idx_rescuerequest_coords`(`latitude`, `longitude`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `rescue_teams` (
    `id` VARCHAR(36) NOT NULL,
    `name` VARCHAR(255) NOT NULL,
    `status` ENUM('AVAILABLE', 'ON_MISSION', 'OFFLINE') NOT NULL,
    `capacity` INTEGER NOT NULL,
    `capability` VARCHAR(255) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `assignments` (
    `id` VARCHAR(36) NOT NULL,
    `rescue_request_id` VARCHAR(36) NOT NULL,
    `rescue_team_id` VARCHAR(36) NOT NULL,
    `status` ENUM('ASSIGNED', 'ACCEPTED', 'REJECTED', 'FAILED', 'COMPLETED', 'CANCELLED') NOT NULL,
    `assigned_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `accepted_at` DATETIME(3) NULL,
    `rejected_at` DATETIME(3) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `idx_assignment_rescue_request_id`(`rescue_request_id`),
    INDEX `idx_assignment_rescue_team_id`(`rescue_team_id`),
    INDEX `idx_assignment_status`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `rescue_requests` ADD CONSTRAINT `rescue_requests_requester_id_fkey` FOREIGN KEY (`requester_id`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_rescue_request_id_fkey` FOREIGN KEY (`rescue_request_id`) REFERENCES `rescue_requests`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `assignments` ADD CONSTRAINT `assignments_rescue_team_id_fkey` FOREIGN KEY (`rescue_team_id`) REFERENCES `rescue_teams`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
