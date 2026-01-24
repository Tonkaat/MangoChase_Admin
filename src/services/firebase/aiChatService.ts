// src/services/firebase/ai-chat-service.ts
import { DocumentReference, DocumentData } from 'firebase/firestore';
import { 
  db, 
  auth,
  serverTimestamp,
  collection,
  doc,
  addDoc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  onSnapshot,
  writeBatch,
  QuerySnapshot,
  Unsubscribe,
  FieldValue
} from './firebaseConfig';

export interface ChatSession {
  id?: string;
  userId: string;
  farmId: string;
  createdAt?: any;
  updatedAt?: any;
  [key: string]: any;
}

export interface ChatMessage {
  id?: string;
  sender: string;
  text: string;
  timestamp?: any;
  [key: string]: any;
}

export class AIChatService {
  
  async createChatSession(farmId: string): Promise<string> {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    const chatData: ChatSession = {
      userId,
      farmId,
      createdAt: serverTimestamp(),
    };

    const chatRef = await addDoc(collection(db, 'ai_chats'), chatData);
    console.log('💬 Chat session created:', chatRef.id, 'for farm:', farmId);
    return chatRef.id;
  }

  async addChatMessage(options: {
    chatId: string;
    sender: string;
    text: string;
  }): Promise<string> {
    const { chatId, sender, text } = options;
    
    const messageData: ChatMessage = {
      sender,
      text,
      timestamp: serverTimestamp(),
    };

    const messageRef = await addDoc(
      collection(db, 'ai_chats', chatId, 'messages'),
      messageData
    );

    // Update chat session's updatedAt timestamp
    await this.updateChatSession(chatId, {
      updatedAt: serverTimestamp(),
    });

    console.log('💭 Chat message added:', messageRef.id, 'from:', sender);
    return messageRef.id;
  }

  getChatMessages(chatId: string, callback: (snapshot: QuerySnapshot) => void): Unsubscribe {
    const q = query(
      collection(db, 'ai_chats', chatId, 'messages'),
      orderBy('timestamp')
    );
    
    return onSnapshot(q, callback);
  }

  async getUserChatSessions(): Promise<ChatSession[]> {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    try {
      const q = query(
        collection(db, 'ai_chats'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as ChatSession));
    } catch (error) {
      console.error('Error getting user chat sessions:', error);
      return [];
    }
  }

  async deleteChatSession(chatId: string): Promise<void> {
    try {
      // Delete all messages first
      const messagesQuery = query(
        collection(db, 'ai_chats', chatId, 'messages')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);

      messagesSnapshot.docs.forEach(document => {
        batch.delete(document.ref);
      });

      // Delete chat session
      batch.delete(doc(db, 'ai_chats', chatId));

      await batch.commit();
      console.log('🗑️ Chat session deleted:', chatId);
    } catch (error) {
      console.error('Error deleting chat session:', error);
      throw error;
    }
  }

  // Enhanced AI chat methods
  async getChatSession(chatId: string): Promise<ChatSession | null> {
    try {
      const chatDoc = await getDoc(doc(db, 'ai_chats', chatId));
      
      if (!chatDoc.exists()) {
        return null;
      }

      return {
        id: chatDoc.id,
        ...chatDoc.data()
      } as ChatSession;
    } catch (error) {
      console.error('Error getting chat session:', error);
      return null;
    }
  }

  async getChatSessionWithMessages(chatId: string, limitCount: number = 50): Promise<{
    session: ChatSession;
    messages: ChatMessage[];
  } | null> {
    try {
      const session = await this.getChatSession(chatId);
      if (!session) return null;

      const messagesQuery = query(
        collection(db, 'ai_chats', chatId, 'messages'),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as ChatMessage)).reverse(); // Reverse to get chronological order

      return { session, messages };
    } catch (error) {
      console.error('Error getting chat session with messages:', error);
      return null;
    }
  }

  async updateChatSession(chatId: string, updates: Partial<ChatSession>): Promise<void> {
    await updateDoc(
      doc(db, 'ai_chats', chatId),
      {
        ...updates,
        updatedAt: serverTimestamp(),
      }
    );
    
    console.log('💬 Chat session updated:', chatId);
  }

  async addSystemMessage(chatId: string, text: string): Promise<string> {
    return this.addChatMessage({
      chatId,
      sender: 'system',
      text,
    });
  }

  async addAIMessage(chatId: string, text: string): Promise<string> {
    return this.addChatMessage({
      chatId,
      sender: 'ai',
      text,
    });
  }

  async getUserFarmChats(farmId: string): Promise<ChatSession[]> {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    try {
      const q = query(
        collection(db, 'ai_chats'),
        where('userId', '==', userId),
        where('farmId', '==', farmId),
        orderBy('createdAt', 'desc')
      );
      
      const snapshot = await getDocs(q);
      return snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as ChatSession));
    } catch (error) {
      console.error('Error getting user farm chats:', error);
      return [];
    }
  }

  async getOrCreateFarmChat(farmId: string): Promise<string> {
    try {
      // Try to get existing chat for this farm
      const existingChats = await this.getUserFarmChats(farmId);
      
      if (existingChats.length > 0) {
        // Return the most recent chat
        return existingChats[0].id!;
      }
      
      // Create a new chat
      return await this.createChatSession(farmId);
    } catch (error) {
      console.error('Error getting or creating farm chat:', error);
      throw error;
    }
  }

  async clearChatMessages(chatId: string): Promise<void> {
    try {
      const messagesQuery = query(
        collection(db, 'ai_chats', chatId, 'messages')
      );
      
      const messagesSnapshot = await getDocs(messagesQuery);
      const batch = writeBatch(db);

      messagesSnapshot.docs.forEach(document => {
        batch.delete(document.ref);
      });

      await batch.commit();
      console.log('🗑️ Chat messages cleared for session:', chatId);
    } catch (error) {
      console.error('Error clearing chat messages:', error);
      throw error;
    }
  }

  async getChatSummary(chatId: string): Promise<{
    messageCount: number;
    lastMessageTime: Date | null;
    participantCount: number;
    aiMessageCount: number;
    userMessageCount: number;
  }> {
    try {
      const messagesQuery = query(
        collection(db, 'ai_chats', chatId, 'messages'),
        orderBy('timestamp', 'desc')
      );
      
      const snapshot = await getDocs(messagesQuery);
      
      let aiMessageCount = 0;
      let userMessageCount = 0;
      let lastMessageTime: Date | null = null;
      const participants = new Set<string>();

      snapshot.docs.forEach(docSnap => {
        const data = docSnap.data();
        const sender = data.sender;
        
        participants.add(sender);
        
        if (sender === 'ai' || sender === 'system') {
          aiMessageCount++;
        } else {
          userMessageCount++;
        }
        
        // Get last message time
        const timestamp = data.timestamp?.toDate?.();
        if (timestamp && (!lastMessageTime || timestamp > lastMessageTime)) {
          lastMessageTime = timestamp;
        }
      });

      return {
        messageCount: snapshot.docs.length,
        lastMessageTime,
        participantCount: participants.size,
        aiMessageCount,
        userMessageCount,
      };
    } catch (error) {
      console.error('Error getting chat summary:', error);
      return {
        messageCount: 0,
        lastMessageTime: null,
        participantCount: 0,
        aiMessageCount: 0,
        userMessageCount: 0,
      };
    }
  }

  // Get stream of user chat sessions
  getUserChatSessionsStream(callback: (sessions: ChatSession[]) => void): Unsubscribe {
    const userId = auth.currentUser?.uid;
    
    if (!userId) {
      throw new Error('No user logged in');
    }

    const q = query(
      collection(db, 'ai_chats'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    return onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      } as ChatSession));
      callback(sessions);
    }, (error) => {
      console.error('Error in chat sessions stream:', error);
      callback([]);
    });
  }
}

// Export singleton instance
export const aiChatService = new AIChatService();

function updateDoc(arg0: DocumentReference<DocumentData, DocumentData>, arg1: { updatedAt: FieldValue; id?: string; userId?: string; farmId?: string; createdAt?: any; }) {
    throw new Error('Function not implemented.');
}
