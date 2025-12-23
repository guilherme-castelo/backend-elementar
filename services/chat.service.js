const prisma = require('../utils/prisma');
const { getIO } = require('../utils/socket');

class ChatService {
  async getConversations(userId) {
    // Find conversations where user is a participant
    // Implicit M:N in Prisma: 'participants'
    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: {
            id: userId
          }
        }
      },
      include: {
        participants: {
          select: { id: true, name: true, email: true, roles: true }
        },
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' }
        }
      },
      orderBy: {
        lastMessageAt: 'desc'
      }
    });

    return conversations.map(c => ({
      ...c,
      participantIds: c.participants.map(p => p.id),
      lastMessageSenderId: c.messages[0]?.senderId,
      lastMessageStatus: c.messages[0]?.status
    }));
  }

  async getMessages(conversationId) {
    // Basic permissions check? typically yes, but for MVP assumes ID knowledge = access or middleware handles it.
    // Ideally check if user in conversation.
    return prisma.message.findMany({
      where: { conversationId },
      include: {
        sender: { select: { id: true, name: true } }
      },
      orderBy: { createdAt: 'asc' }
    });
  }

  async sendMessage(userId, data) {
    const { conversationId, recipientId, content } = data;
    let targetConvId = conversationId;

    if (!targetConvId && recipientId) {
      // Check for existing conversation
      // This is tricky in Prisma M:N.
      // Find conversation with exactly these 2 participants.
      // Hack: Search conversations of Sender, filter in JS for Recipient (simplest for MVP SQLite)
      // Or Raw Query.
      const existingConvs = await prisma.conversation.findMany({
        where: {
          participants: { every: { id: { in: [userId, recipientId] } } }
          // Warning: 'every' means ALL participants must be in list.
          // If there is a group chat with 3 people, this might match if all 3 are in list.
          // But for 1:1, we want size=2.
        },
        include: { participants: true }
      });

      const strictMatch = existingConvs.find(c => c.participants.length === 2 && c.participants.some(p => p.id === recipientId));

      if (strictMatch) {
        targetConvId = strictMatch.id;
      } else {
        // Create new
        const newConv = await prisma.conversation.create({
          data: {
            participants: {
              connect: [{ id: userId }, { id: recipientId }]
            },
            lastMessageAt: new Date()
          }
        });
        targetConvId = newConv.id;
      }
    }

    if (!targetConvId) throw new Error('Recipient or Conversation ID required');

    // Create Message
    const message = await prisma.message.create({
      data: {
        content,
        conversationId: targetConvId,
        senderId: userId,
        status: 'sent'
      },
      include: { sender: { select: { id: true, name: true } } }
    });

    // Update Conversation
    await prisma.conversation.update({
      where: { id: targetConvId },
      data: { lastMessageAt: new Date() }
    });

    // Real-time Emission
    try {
      // Fetch conversation participants for notification
      const conversation = await prisma.conversation.findUnique({
        where: { id: targetConvId },
        include: { participants: { select: { id: true } } }
      });

      const io = getIO();

      if (conversation && conversation.participants) {
        conversation.participants.forEach(p => {
          // Emit ONLY to recipients, NOT the sender
          if (p.id !== userId) {
            // Emit to user's room
            io.to(p.id.toString()).emit('new_message', message);

            io.to(p.id.toString()).emit('conversation_updated', {
              id: targetConvId,
              lastMessageAt: message.createdAt,
              lastMessagePreview: message.content
            });
          }
        });
      }
    } catch (error) {
      console.error('Socket Emission Failed:', error.message);
    }

    return message;
  }

  async createConversation(userId, recipientId) {
    // Check existence first
    const existingConvs = await prisma.conversation.findMany({
      where: {
        participants: { every: { id: { in: [userId, recipientId] } } }
      },
      include: { participants: true }
    });
    const strictMatch = existingConvs.find(c => c.participants.length === 2 && c.participants.some(p => p.id === recipientId));
    if (strictMatch) {
      return {
        ...strictMatch,
        participantIds: strictMatch.participants.map(p => p.id)
      };
    }

    const newConv = await prisma.conversation.create({
      data: {
        participants: { connect: [{ id: userId }, { id: recipientId }] },
        lastMessageAt: new Date()
      },
      include: { participants: true }
    });

    const result = {
      ...newConv,
      participantIds: newConv.participants.map(p => p.id)
    };

    try {
      const io = getIO();
      io.to(recipientId.toString()).emit('conversation_created', result);
    } catch (e) { console.error(e); }

    return result;
  }

  async markMessagesAsRead(conversationId, userId) {
    // userId is the READER
    // We update messages where sender is NOT userId, and status is NOT 'read'
    const result = await prisma.message.updateMany({
      where: {
        conversationId: conversationId,
        senderId: { not: userId },
        status: { not: 'read' }
      },
      data: {
        readAt: new Date(),
        status: 'read'
      }
    });

    if (result.count > 0) {
      this._emitStatusUpdate(conversationId, 'read', userId); // userId = who read it
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
        status: 'sent'
      },
      data: {
        deliveredAt: new Date(),
        status: 'delivered'
      }
    });

    if (result.count > 0) {
      this._emitStatusUpdate(conversationId, 'delivered', userId);
    }
    return result;
  }

  async _emitStatusUpdate(conversationId, newStatus, actorId) {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
        include: { participants: { select: { id: true } } }
      });
      const io = getIO();
      conversation.participants.forEach(p => {
        // Notify everyone (Sender needs to know it was read/delivered)
        // Recipient needs to know? Maybe for syncing devices.
        io.to(p.id.toString()).emit('message_status_update', {
          conversationId,
          status: newStatus,
          actorId // who performed the action (reader/receiver)
        });
      });
    } catch (e) { console.error('Socket Error statusUpdate', e); }
  }

  async getUnreadCount(userId) {
    return prisma.message.count({
      where: {
        conversation: {
          participants: { some: { id: userId } }
        },
        senderId: { not: userId },
        readAt: null
      }
    });
  }
}

module.exports = new ChatService();
