import React, { useState, useRef, useEffect } from 'react';
import { ChatThread, Message, User } from '../types';
import { cn } from '../lib/utils';
import { api } from '../services/api';

interface InboxProps {
  chats: ChatThread[];
  setChats: React.Dispatch<React.SetStateAction<ChatThread[]>>;
  activeChatId: string | null;
  setActiveChatId: (id: string | null) => void;
  users: User[];
}

const Inbox: React.FC<InboxProps> = ({ chats, setChats, activeChatId, setActiveChatId, users }) => {
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [phoneLookup, setPhoneLookup] = useState('');
  const [lookupError, setLookupError] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const socketRef = useRef<WebSocket | null>(null);

  // Initialize WebSocket for real-time chat
  useEffect(() => {
    socketRef.current = new WebSocket('ws://127.0.0.1:3005');
    
    socketRef.current.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'CHAT_UPDATE') {
          const updatedChats = await api.getChats();
          setChats(updatedChats);
        }
      } catch (e) {}
    };

    return () => {
      socketRef.current?.close();
    };
  }, [setChats]);

  const activeChat = chats.find(c => c.id === activeChatId);

  const handleSendMessage = async (e?: React.FormEvent, fileData?: { data: string, name: string }) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() && !fileData && !activeChatId) return;

    const msg: Message = {
      id: Date.now().toString(),
      sender: 'Me',
      text: newMessage.trim() || undefined,
      file: fileData?.data,
      fileName: fileData?.name,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isMe: true
    };

    if (activeChat) {
      const updatedChat = {
        ...activeChat,
        messages: [...activeChat.messages, msg],
        lastMessage: fileData ? `Sent a file: ${fileData.name}` : (newMessage || 'Attachment'),
        timestamp: 'Just now'
      };
      
      await api.saveChat(updatedChat);
      setChats(prev => [updatedChat, ...prev.filter(c => c.id !== activeChatId)]);
    }
    setNewMessage('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      handleSendMessage(undefined, { data: reader.result as string, name: file.name });
    };
    reader.readAsDataURL(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleStartConversation = async () => {
    setLookupError('');
    const targetUser = users.find(u => u.phone === phoneLookup.trim());
    if (!targetUser) {
      setLookupError('Node identifier (phone) not found in directory.');
      return;
    }

    const userName = `${targetUser.first_name} ${targetUser.last_name}`;
    const existing = chats.find(c => c.contactName === userName);
    
    if (existing) {
      setActiveChatId(existing.id);
    } else {
      const newId = `C-${Date.now()}`;
      const newChat: ChatThread = {
        id: newId,
        contactName: userName,
        lastMessage: 'Encryption bridge established...',
        timestamp: 'Just now',
        messages: []
      };
      // Persist the initial bridge chat
      await api.saveChat(newChat);
      setChats(prev => [newChat, ...prev]);
      setActiveChatId(newId);
    }
    setShowNewChatModal(false);
    setPhoneLookup('');
  };

  const filteredChats = chats.filter(c => 
    c.contactName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.lastMessage.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="card-premium flex h-[calc(100vh-200px)] md:h-[calc(100vh-250px)] overflow-hidden relative text-left">
      {/* Sidebar */}
      <div className={cn(
        "w-full md:w-80 border-r border-slate-100 flex flex-col",
        activeChatId ? "hidden md:flex" : "flex"
      )}>
        <div className="p-6 border-b border-slate-100 space-y-4">
          <button 
            onClick={() => setShowNewChatModal(true)}
            className="btn-primary w-full text-[10px] flex items-center justify-center space-x-2"
          >
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4"></path></svg>
            <span>Initialize Node Comm</span>
          </button>

          <div className="relative">
            <input 
              type="text" 
              placeholder="Filter active streams..." 
              className="input-standard py-2.5 pl-10 text-[10px] uppercase tracking-widest bg-slate-50"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
          </div>
        </div>
        
        <div className="flex-1 overflow-y-auto no-scrollbar">
          {filteredChats.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Awaiting Uplink</p>
            </div>
          ) : (
            filteredChats.map(chat => (
              <button 
                key={chat.id}
                onClick={() => setActiveChatId(chat.id)}
                className={cn(
                  "w-full p-6 flex items-center space-x-4 hover:bg-slate-50 transition-colors border-b border-slate-50",
                  activeChatId === chat.id && "bg-orange-50/50"
                )}
              >
                <div className="w-12 h-12 rounded-2xl bg-white shadow-sm text-[#FF5722] border border-orange-50 flex-shrink-0 flex items-center justify-center font-black text-lg">{chat.contactName?.[0] || 'N'}</div>
                <div className="flex-1 text-left overflow-hidden">
                  <div className="flex justify-between items-center mb-1">
                    <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter truncate">{chat.contactName}</h4>
                    <span className="text-[9px] text-slate-400 font-bold whitespace-nowrap ml-2 uppercase tracking-widest">{chat.timestamp}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate font-medium">{chat.lastMessage}</p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex-1 flex flex-col bg-slate-50/30",
        activeChatId ? "flex" : "hidden md:flex"
      )}>
        {activeChat ? (
          <>
            <div className="p-5 bg-white border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <button onClick={() => setActiveChatId(null)} className="md:hidden p-2 text-slate-400"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path></svg></button>
                <div className="w-10 h-10 rounded-xl bg-[#FF5722] text-white flex items-center justify-center font-black">{activeChat.contactName?.[0] || 'N'}</div>
                <div>
                  <h4 className="text-sm font-black text-slate-800 uppercase tracking-tighter">{activeChat.contactName}</h4>
                  <p className="text-[9px] text-[#10B981] font-black uppercase tracking-[0.2em]">Verified Encryption</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
              {activeChat.messages.map(m => (
                <div key={m.id} className={cn("flex", m.isMe ? "justify-end" : "justify-start")}>
                  <div className={cn(
                    "max-w-[85%] md:max-w-[70%] p-4 rounded-[25px] shadow-sm text-xs font-medium",
                    m.isMe ? "bg-[#FF5722] text-white rounded-tr-none" : "bg-white text-slate-700 rounded-tl-none border border-slate-100"
                  )}>
                    {m.text && <p className="whitespace-pre-wrap">{m.text}</p>}
                    {m.file && (
                      <div className="mt-2 space-y-2">
                        {m.file.startsWith('data:image') ? (
                          <div className="max-w-[240px] overflow-hidden rounded-xl border-2 border-white/20 shadow-sm">
                             <img src={m.file} className="w-full h-auto cursor-pointer hover:opacity-90 transition-opacity" onClick={() => window.open(m.file, '_blank')} alt="Attached" />
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 p-3 bg-black/10 rounded-xl max-w-[240px]">
                            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                            <span className="truncate text-[10px]">{m.fileName}</span>
                            <button onClick={() => window.open(m.file, '_blank')} className="ml-auto underline font-black text-[9px] uppercase">Open</button>
                          </div>
                        )}
                      </div>
                    )}
                    <p className={cn("text-[9px] mt-2 font-bold opacity-60", m.isMe ? "text-right" : "text-left")}>{m.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-slate-100 flex items-center gap-2 md:gap-4">
              <button type="button" onClick={() => fileInputRef.current?.click()} className="btn-ghost p-3"><svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg></button>
              <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} />
              <textarea 
                rows={1}
                placeholder="Secure uplink..." 
                className="input-standard flex-1 p-3.5 bg-slate-50"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />
              <button type="submit" disabled={!newMessage.trim()} className="bg-[#FF5722] text-white p-3.5 rounded-2xl shadow-xl disabled:opacity-50 active:scale-95 transition-transform"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg></button>
            </form>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-10 bg-white">
            <div className="w-20 h-20 bg-slate-50 rounded-[35px] flex items-center justify-center mb-6">
               <svg className="w-10 h-10 text-slate-200" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path></svg>
            </div>
            <h4 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Terminal Standby</h4>
            <p className="text-[10px] text-slate-400 mt-2 font-bold uppercase tracking-widest max-w-[200px] leading-relaxed">Select or initialize a node stream to begin communication</p>
          </div>
        )}
      </div>

      {showNewChatModal && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-white rounded-[40px] w-full max-sm p-8 shadow-2xl animate-scale-up text-left">
            <div className="flex justify-between items-center mb-8">
              <div>
                 <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">New Uplink</h3>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Privacy protocol: Enter node phone</p>
              </div>
              <button onClick={() => { setShowNewChatModal(false); setLookupError(''); setPhoneLookup(''); }} className="text-slate-300 hover:text-[#FF5722] transition-colors"><svg strokeWidth="2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"></path></svg></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1">
                 <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">Target Node (Phone)</label>
                 <input 
                  type="tel" 
                  placeholder="09..." 
                  className="input-standard text-sm uppercase tracking-widest p-4" 
                  value={phoneLookup} 
                  onChange={(e) => { setPhoneLookup(e.target.value); setLookupError(''); }} 
                 />
              </div>
              
              {lookupError && <p className="text-[9px] font-black text-red-500 uppercase tracking-widest text-center animate-pulse">{lookupError}</p>}
              
              <button 
                onClick={handleStartConversation}
                className="btn-primary w-full text-[10px]"
              >
                Establish Bridge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inbox;