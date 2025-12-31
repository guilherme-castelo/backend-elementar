const prisma = require("../utils/prisma");
const { getIO } = require("../utils/socket");

const {
  ForbiddenError,
  NotFoundError,
  ValidationError,
} = require("../errors/AppError");

class ChatService {
  async getConversations(userId) {
    // Find conversations where user is a participant
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId,
          },
        },
      },
      include: {
        participants: {
          select: {
            id: true,
            name: true,
            email: true,
            role: { select: { name: true } },
          },
        },
        messages: {
          take: 1,
          orderBy: { createdAt: "desc" },
        },
      },
      orderBy: {
        lastMessageAt: "desc",
      },
    });

    return conversations.map((c) => ({
      ...c,
      participantIds: c.participants.map((p) => p.id),
      lastMessageSenderId: c.messages[0]?.senderId,
      lastMessageStatus: c.messages[0]?.status,
    }));
  }

  async getMessages(conversationId, userId) {
    // Verify participation
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } },
      },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found or access denied.");
    }

    return prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });
  }

  async _validateSharedContext(userId, recipientId) {
    // Check if users share at least one company
    const userMemberships = await prisma.userMembership.findMany({
      where: { userId, isActive: true },
      select: { companyId: true },
    });

    const recipientMemberships = await prisma.userMembership.findMany({
      where: { userId: recipientId, isActive: true },
      select: { companyId: true },
    });

    const userCompanies = userMemberships.map((m) => m.companyId);
    const recipientCompanies = recipientMemberships.map((m) => m.companyId);

    const hasSharedCompany = userCompanies.some((id) =>
      recipientCompanies.includes(id)
    );

    if (!hasSharedCompany) {
      throw new ForbiddenError(
        "You cannot chat with this user (Different Company)."
      );
    }
  }

  async sendMessage(userId, data) {
    const { conversationId, recipientId, content } = data;
    let targetConvId = conversationId;

    if (!content) throw new ValidationError("Content is required");

    if (conversationId) {
      // Validate access to existing conversation
      const conv = await prisma.conversation.findFirst({
        where: { id: conversationId, participants: { some: { id: userId } } },
        include: { participants: true },
      });
      if (!conv) throw new NotFoundError("Conversation not found");
      targetConvId = conv.id;
    } else if (recipientId) {
      // Validate Shared Context for NEW conversations
      await this._validateSharedContext(userId, recipientId);

      // Check for existing conversation with this recipient
      // Hack: Search conversations of Sender, filter in JS
      const existingConvs = await prisma.conversation.findMany({
        where: {
          participants: { every: { id: { in: [userId, recipientId] } } },
        },
        include: { participants: true },
      });

      const strictMatch = existingConvs.find(
        (c) =>
          c.participants.length === 2 &&
          c.participants.some((p) => p.id === recipientId)
      );

      if (strictMatch) {
        targetConvId = strictMatch.id;
      } else {
        // Create new
        const newConv = await prisma.conversation.create({
          data: {
            participants: {
              connect: [{ id: userId }, { id: recipientId }],
            },
            lastMessageAt: new Date(),
          },
        });
        targetConvId = newConv.id;
      }
    } else {
      throw new ValidationError("Recipient or Conversation ID required");
    }

    // Create Message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId: targetConvId,
        senderId: userId,
        status: "sent",
      },
      include: { sender: { select: { id: true, name: true } } },
    });

    // Update Conversation
    await prisma.conversation.update({
      where: { id: targetConvId },
      data: { lastMessageAt: new Date() },
    });

    // Real-time Emission
    try {
      // Fetch conversation participants for notification
      const conversation = await prisma.conversation.findUnique({
        where: { id: targetConvId },
        include: { participants: { select: { id: true } } },
      });

      const io = getIO();

      if (conversation && conversation.participants) {
        conversation.participants.forEach((p) => {
          // Emit ONLY to recipients, NOT the sender
          if (p.id !== userId) {
            // Emit to user's room
            io.to(p.id.toString()).emit("new_message", message);

            io.to(p.id.toString()).emit("conversation_updated", {
              id: targetConvId,
              lastMessageAt: message.createdAt,
              lastMessagePreview: message.content,
            });
          }
        });
      }
    } catch (error) {
      console.error("Socket Emission Failed:", error.message);
    }

    return message;
  }

  async createConversation(userId, recipientId) {
    if (!recipientId) throw new ValidationError("Recipient ID required");

    await this._validateSharedContext(userId, recipientId);

    // Check existence first
    const existingConvs = await prisma.conversation.findMany({
      where: {
        participants: { every: { id: { in: [userId, recipientId] } } },
      },
      include: { participants: true },
    });
    const strictMatch = existingConvs.find(
      (c) =>
        c.participants.length === 2 &&
        c.participants.some((p) => p.id === recipientId)
    );
    if (strictMatch) {
      return {
        ...strictMatch,
        participantIds: strictMatch.participants.map((p) => p.id),
      };
    }

    const newConv = await prisma.conversation.create({
      data: {
        participants: { connect: [{ id: userId }, { id: recipientId }] },
        lastMessageAt: new Date(),
      },
      include: { participants: true },
    });

    const result = {
      ...newConv,
      participantIds: newConv.participants.map((p) => p.id),
    };

    try {
      const io = getIO();
      io.to(recipientId.toString()).emit("conversation_created", result);
    } catch (e) {
      console.error(e);
    }

    return result;
  }

  async markMessagesAsRead(conversationId, userId) {
    // userId is the READER
    // We update messages where sender is NOT userId, and status is NOT 'read'
    const result = await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: userId },
        status: { not: "read" },
      },
      data: {
        readAt: new Date(),
        status: "read",
      },
    });

    if (result.count > 0) {
      this._emitStatusUpdate(conversationId, "read", userId); // userId = who read it
    }
    return result;
  }

  async markAsDelivered(conversationId, userId) {
    // userId is the RECEIVER who got the message
    // Update messages where sender is NOT userId AND status is 'sent' (not yet delivered/read)
    const result = await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: userId },
        status: "sent",
      },
      data: {
        deliveredAt: new Date(),
        status: "delivered",
      },
    });

    if (result.count > 0) {
      this._emitStatusUpdate(conversationId, "delivered", userId);
    }
    return result;
  }

  async _emitStatusUpdate(conversationId, newStatus, actorId) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: { select: { id: true } } },
      });
      const io = getIO();
      conversation.participants.forEach((p) => {
        // Notify everyone (Sender needs to know it was read/delivered)
        // Recipient needs to know? Maybe for syncing devices.
        io.to(p.id.toString()).emit("message_status_update", {
          conversationId,
          status: newStatus,
          actorId, // who performed the action (reader/receiver)
        });
      });
    } catch (e) {
      console.error("Socket Error statusUpdate", e);
    }
  }

  async deleteMessage(messageId, userId) {
    const message = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!message) {
      throw new NotFoundError("Message not found");
    }

    if (message.senderId !== userId) {
      throw new ForbiddenError("You can only delete your own messages");
    }

    // Hard delete or soft delete? User said "deletar". Hard delete for now or clear content.
    // Given privacy request (undo send), hard delete is better or "Deleted message" placeholder.
    // Let's go with hard delete for MVP simplicity.
    await prisma.message.delete({
      where: { id: messageId },
    });

    // Notify participants via socket
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: message.conversationId },
        include: { participants: { select: { id: true } } },
      });

      const io = getIO();
      if (conversation && conversation.participants) {
        conversation.participants.forEach((p) => {
          io.to(p.id.toString()).emit("message_deleted", {
            messageId: messageId,
            conversationId: message.conversationId,
          });
        });
      }
    } catch (e) {
      console.error("Socket Emission Failed on Delete:", e.message);
    }
  }

  async getUnreadCount(userId) {
    return prisma.message.count({
      where: {
        conversation: {
          participants: { some: { id: userId } },
        },
        senderId: { not: userId },
        readAt: null,
      },
    });
  }
  async deleteConversation(conversationId, userId) {
    const conversation = await prisma.conversation.findFirst({
      where: {
        id: conversationId,
        participants: { some: { id: userId } },
      },
      include: { participants: true },
    });

    if (!conversation) {
      throw new NotFoundError("Conversation not found");
    }

    // For now, allow any participant to delete the conversation (Hard Delete)
    // Or maybe restrict to creator? We don't track creator explicitly other than participants.
    // Let's allow participant to delete (nuke) for now as requested.

    await prisma.conversation.delete({
      where: { id: conversationId },
    });

    // Notify other participants
    try {
      const io = getIO();
      conversation.participants.forEach((p) => {
        if (p.id !== userId) {
          io.to(p.id.toString()).emit("conversation_deleted", {
            id: conversationId,
          });
        }
      });
    } catch (e) {
      console.error(
        "Socket Emission Failed on Conversation Delete:",
        e.message
      );
    }
  }
}

module.exports = new ChatService();
