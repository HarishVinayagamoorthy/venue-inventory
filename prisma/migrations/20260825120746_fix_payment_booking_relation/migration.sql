-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_paymentAttemptId_fkey` FOREIGN KEY (`paymentAttemptId`) REFERENCES `PaymentAttempt`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
