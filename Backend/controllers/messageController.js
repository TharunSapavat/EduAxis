import Message from '../models/Message.js';
import User from '../models/User.js';

// Send a message and notify recipient via socket.io
export const sendMessage = async (req, res) => {
  try {
    const senderId = req.userId;
    const { recipientId, text, attachments } = req.body;

    if (!recipientId || !text) {
      return res.status(400).json({ success: false, message: 'recipientId and text required' });
    }

    // Ensure recipient exists
    const recipient = await User.findById(recipientId).select('-password');
    if (!recipient) {
      return res.status(404).json({ success: false, message: 'Recipient not found' });
    }

    const message = await Message.create({
      sender: senderId,
      recipient: recipientId,
      text,
      attachments: attachments || [],
      status: 'sent'
    });

    // Emit via socket.io to recipient room if available
    try {
      const io = req.app.get('io');
      if (io) {
        const payload = await message.populate('sender', 'name email role');
        // Send to recipient's room
        io.to(`user:${recipientId}`).emit('message:received', payload);
        // Also send back to sender's room for real-time update
        io.to(`user:${senderId}`).emit('message:sent', payload);
        // Mark as delivered if recipient is online
        const recipientSockets = await io.in(`user:${recipientId}`).fetchSockets();
        if (recipientSockets.length > 0) {
          message.status = 'delivered';
          await message.save();
        }
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ success: true, data: message });
  } catch (error) {
    console.error('sendMessage error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get messages between current user and another user
export const getConversationWithUser = async (req, res) => {
  try {
    const userId = req.userId;
    const otherUserId = req.params.userId;

    // Validate other user exists
    const otherUser = await User.findById(otherUserId).select('-password');
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Find messages where sender==userId and recipient==otherUserId OR vice versa
    const messages = await Message.find({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    })
      .sort({ createdAt: 1 })
      .populate('sender', 'name role');

    return res.json({ success: true, data: messages });
  } catch (error) {
    console.error('getConversationWithUser error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Get all conversations (unique users who have messaged current user)
export const getConversations = async (req, res) => {
  try {
    const userId = req.userId;

    // Find all messages where user is sender or recipient
    const messages = await Message.find({
      $or: [{ sender: userId }, { recipient: userId }]
    })
      .populate('sender', 'name role')
      .populate('recipient', 'name role')
      .sort({ createdAt: -1 });

    // Group by conversation partner
    const conversationMap = new Map();
    
    messages.forEach(msg => {
      const partnerId = msg.sender._id.toString() === userId ? msg.recipient._id.toString() : msg.sender._id.toString();
      const partner = msg.sender._id.toString() === userId ? msg.recipient : msg.sender;
      
      if (!conversationMap.has(partnerId)) {
        conversationMap.set(partnerId, {
          userId: partnerId,
          userName: partner.name,
          userRole: partner.role,
          lastMessage: msg.text,
          lastMessageTime: msg.createdAt,
          unreadCount: 0
        });
      }
      
      // Count unread messages (messages where current user is recipient and status is not 'read')
      if (msg.recipient._id.toString() === userId && msg.status !== 'read') {
        conversationMap.get(partnerId).unreadCount++;
      }
    });

    const conversations = Array.from(conversationMap.values());
    return res.json({ success: true, data: conversations });
  } catch (error) {
    console.error('getConversations error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  try {
    const userId = req.userId;
    const { senderId } = req.body;

    if (!senderId) {
      return res.status(400).json({ success: false, message: 'senderId required' });
    }

    // Update all unread messages from this sender to current user
    const result = await Message.updateMany(
      {
        sender: senderId,
        recipient: userId,
        status: { $ne: 'read' }
      },
      {
        status: 'read',
        readAt: new Date()
      }
    );

    // Notify sender via socket that messages were read
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${senderId}`).emit('messages:read', {
          readBy: userId,
          count: result.modifiedCount
        });
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ success: true, data: { updated: result.modifiedCount } });
  } catch (error) {
    console.error('markAsRead error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete a message
export const deleteMessage = async (req, res) => {
  try {
    const userId = req.userId;
    const { messageId } = req.params;

    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Only sender can delete their own messages
    if (message.sender.toString() !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized to delete this message' });
    }

    await Message.findByIdAndDelete(messageId);

    // Notify recipient via socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${message.recipient}`).emit('message:deleted', { messageId });
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('deleteMessage error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};

// Delete entire conversation with a user
export const deleteConversation = async (req, res) => {
  try {
    const userId = req.userId;
    const { otherUserId } = req.params;

    // Validate other user exists
    const otherUser = await User.findById(otherUserId).select('-password');
    if (!otherUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Delete all messages between these two users
    const result = await Message.deleteMany({
      $or: [
        { sender: userId, recipient: otherUserId },
        { sender: otherUserId, recipient: userId }
      ]
    });

    // Notify other user via socket
    try {
      const io = req.app.get('io');
      if (io) {
        io.to(`user:${otherUserId}`).emit('conversation:deleted', { userId });
      }
    } catch (socketErr) {
      console.error('Socket emit failed', socketErr);
    }

    return res.json({ 
      success: true, 
      message: 'Conversation deleted',
      deletedCount: result.deletedCount
    });
  } catch (error) {
    console.error('deleteConversation error', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
};
