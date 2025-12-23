const prisma = require('../utils/prisma');

class NotificationService {
  async getAll(userId) {
    return prisma.notification.findMany({
      where: { userId: parseInt(userId) },
      orderBy: { createdAt: 'desc' }
    });
  }

  async create(data) {
    return prisma.notification.create({ data });
  }

  async markAsRead(id) {
    return prisma.notification.update({
      where: { id },
      data: { read: true }
    });
  }

  async archive(id) {
    return prisma.notification.update({
      where: { id },
      data: { archived: true }
    });
  }
}

module.exports = new NotificationService();
