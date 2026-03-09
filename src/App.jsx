import { useState, useEffect, useMemo } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'
import './App.css'

// IMPORTANT: In a real production app, never expose your API key in the frontend. 
// For this demontration, the user will need to provide their own key or a backend should handle this.
const genAI = new GoogleGenerativeAI("YOUR_API_KEY_HERE");

const initialMockBooks = [
  { id: 1, title: 'Introduction to Algorithms', author: 'Thomas H. Cormen', isbn: '9780262033848', status: 'Available', category: 'Computer Science', cover: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?q=80&w=200&auto=format&fit=crop', description: 'Some books are rigorously mathematical; others are mostly informal. This book combines rigor and comprehensiveness. It covers a broad range of algorithms in depth, yet makes their design and analysis accessible to all levels of readers.' },
  { id: 2, title: 'Clean Code: A Handbook of Agile Software Craftsmanship', author: 'Robert C. Martin', isbn: '9780132350884', status: 'Checked Out', category: 'Software Engineering', cover: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=200&auto=format&fit=crop', dueDate: '2026-03-20', description: 'Even bad code can function. But if code isn\'t clean, it can bring a development organization to its knees. Every year, countless hours and significant resources are lost because of poorly written code. But it doesn\'t have to be that way.' },
  { id: 3, title: 'Design Patterns: Elements of Reusable Object-Oriented Software', author: 'Erich Gamma', isbn: '9780201633610', status: 'Available', category: 'Software Engineering', cover: 'https://images.unsplash.com/photo-1516259762381-22954d7d3ad2?q=80&w=200&auto=format&fit=crop', description: 'Capturing a wealth of experience about the design of object-oriented software, four top-notch designers present a catalog of simple and succinct solutions to commonly occurring design problems.' },
  { id: 4, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', isbn: '9780201616224', status: 'Available', category: 'Software Engineering', cover: 'https://images.unsplash.com/photo-1532012197267-da84d127e765?q=80&w=200&auto=format&fit=crop', description: 'Ward Cunningham has said that this book should be required reading for all developers. It explores the core processes and methodologies that make for a successful, pragmatic developer.' },
  { id: 5, title: 'Structure and Interpretation of Computer Programs', author: 'Harold Abelson', isbn: '9780262510875', status: 'Reserved', category: 'Computer Science', cover: 'https://images.unsplash.com/photo-1456406644174-8ddd4cd52a06?q=80&w=200&auto=format&fit=crop', description: 'Structure and Interpretation of Computer Programs (SICP) has had a dramatic impact on computer science curricula over the past decade. This long-awaited revision contains changes throughout the text.' },
  { id: 6, title: 'Artificial Intelligence: A Modern Approach', author: 'Stuart Russell', isbn: '9780134610993', status: 'Available', category: 'Artificial Intelligence', cover: 'https://images.unsplash.com/photo-1507146426996-ef05306b995a?q=80&w=200&auto=format&fit=crop', description: 'Artificial Intelligence: A Modern Approach, 3e offers the most comprehensive, up-to-date introduction to the theory and practice of artificial intelligence.' },
];

function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  
  // Library Data State
  const [books, setBooks] = useState(initialMockBooks);

  // Admin Authentication State
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [showAdminLogin, setShowAdminLogin] = useState(false);
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminLoginError, setAdminLoginError] = useState('');

  // Add Book State
  const [showAddBook, setShowAddBook] = useState(false);
  const [newBook, setNewBook] = useState({
    title: '', author: '', isbn: '', status: 'Available', category: '', description: '', cover: ''
  });

  // Edit Book State
  const [isEditing, setIsEditing] = useState(false);
  const [editingBookId, setEditingBookId] = useState(null);

  // Book Details Modal State
  const [selectedBook, setSelectedBook] = useState(null);

  // AI Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiApiKey, setAiApiKey] = useState('');
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);

  useEffect(() => {
    document.title = "theBookGuy | College Library System";
    
    // Check if key exists in local storage
    const savedKey = localStorage.getItem('gemini_api_key');
    if (savedKey) {
      setAiApiKey(savedKey);
    }
  }, []);

  const searchResults = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return books.filter(book => {
      const matchesSearch = book.title.toLowerCase().includes(query) || 
                            book.author.toLowerCase().includes(query) ||
                            book.isbn.includes(query);
      
      const matchesFilter = filterStatus === 'All' || book.status === filterStatus;
      
      return matchesSearch && matchesFilter;
    });
  }, [searchQuery, filterStatus, books]);

  const handleSearchSubmit = (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setActiveTab('search');
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    alert("Your book request has been submitted to the library staff.");
    e.target.reset();
    setActiveTab('home');
  };

  const handleAdminClick = (e) => {
    e.preventDefault();
    if (isAdminLoggedIn) {
      setActiveTab('admin');
    } else {
      setShowAdminLogin(true);
      setAdminLoginError('');
      setAdminUsername('');
      setAdminPassword('');
    }
  };

  const handleAdminLogin = (e) => {
    e.preventDefault();
    if (adminUsername === 'admin' && adminPassword === 'password') {
      setIsAdminLoggedIn(true);
      setShowAdminLogin(false);
      setActiveTab('admin');
    } else {
      setAdminLoginError('Invalid credentials. Hint: use "admin" and "password"');
    }
  };

  const saveApiKey = (e) => {
    e.preventDefault();
    localStorage.setItem('gemini_api_key', aiApiKey);
    alert('API Key saved securely in your local browser storage.');
    setShowApiKeyPrompt(false);
  };

  const clearApiKey = () => {
    localStorage.removeItem('gemini_api_key');
    setAiApiKey('');
    alert('API Key cleared.');
  }

  const generateDescription = async (contextBook, isEditMode = false) => {
    if (!contextBook.title || !contextBook.author) {
      alert("Please provide at least a Title and Author before generating a description.");
      return;
    }

    if (!aiApiKey) {
      setShowApiKeyPrompt(true);
      return;
    }

    setIsGenerating(true);
    try {
      const activeGenAI = new GoogleGenerativeAI(aiApiKey);
      const model = activeGenAI.getGenerativeModel({ model: "gemini-pro" });
      const prompt = `Write a concise, engaging summary (about 3-4 sentences maximum) for a book titled "${contextBook.title}" by "${contextBook.author}". This is for a college library catalog system. Do not include spoilers. Make it sound professional and inviting to students.`;
      
      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      if (isEditMode) {
        setSelectedBook({...selectedBook, description: text.trim()});
      } else {
        setNewBook({...newBook, description: text.trim()});
      }
    } catch (error) {
      console.error("Error generating description:", error);
      alert("Failed to generate description. Please check if your API key is valid: " + error.message);
      if (error.message.includes("API key")) {
        setShowApiKeyPrompt(true);
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const AiButton = ({ onClick, isGenerating, style }) => (
    <button
      type="button"
      onClick={onClick}
      disabled={isGenerating}
      title="Auto-generate description with Gemini AI"
      style={{
        background: 'linear-gradient(45deg, #10b981, #3b82f6)',
        border: 'none',
        borderRadius: '6px',
        padding: '4px 8px',
        color: 'white',
        fontSize: '0.8rem',
        fontWeight: 'bold',
        cursor: isGenerating ? 'not-allowed' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        transition: 'all 0.3s ease',
        boxShadow: '0 2px 8px rgba(16, 185, 129, 0.4)',
        opacity: isGenerating ? 0.7 : 1,
        ...style
      }}
      onMouseOver={(e) => { if(!isGenerating) { e.currentTarget.style.transform = 'scale(1.05)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(16, 185, 129, 0.6)'; } }}
      onMouseOut={(e) => { if(!isGenerating) { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(16, 185, 129, 0.4)'; } }}
    >
      {isGenerating ? 'Generating...' : (
        <>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
          </svg>
          Gemini AI
        </>
      )}
    </button>
  );

  const handleAddBookSubmit = (e) => {
    e.preventDefault();
    const bookToAdd = {
      ...newBook,
      id: Date.now(),
      cover: newBook.cover || `https://via.placeholder.com/150/4F46E5/FFFFFF?text=${encodeURIComponent(newBook.title.substring(0, 10))}` 
    };

    setBooks([...books, bookToAdd]);
    setShowAddBook(false);
    
    setNewBook({
      title: '', author: '', isbn: '', status: 'Available', category: '', description: '', cover: ''
    });
    
    alert(`"${bookToAdd.title}" has been successfully added to the library ecosystem.`);
  };

  const handleEditBookSubmit = (e) => {
    e.preventDefault();
    
    const updatedBooks = books.map(book => {
      if (book.id === editingBookId) {
        return { ...selectedBook };
      }
      return book;
    });

    setBooks(updatedBooks);
    setIsEditing(false);
    setEditingBookId(null);
    alert(`"${selectedBook.title}" has been successfully updated.`);
  };

  const startEditing = () => {
    setIsEditing(true);
    setEditingBookId(selectedBook.id);
  };

  const cancelEditing = () => {
    setIsEditing(false);
    setEditingBookId(null);
    const originalBook = books.find(b => b.id === selectedBook.id);
    setSelectedBook(originalBook);
  };

  const renderAdminLoginModal = () => {
    if (!showAdminLogin) return null;
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s ease' }}>
        <div className="glass-panel" style={{ padding: '40px', width: '100%', maxWidth: '400px', position: 'relative' }}>
          <button onClick={() => setShowAdminLogin(false)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'transparent', border: 'none', color: 'white', fontSize: '1.2rem', cursor: 'pointer', transition: 'all 0.2s', opacity: 0.7 }} onMouseOver={e => e.target.style.opacity = 1} onMouseOut={e => e.target.style.opacity = 0.7}>✕</button>
          
          <h2 style={{ marginBottom: '8px', textAlign: 'center', fontSize: '1.8rem' }}>Admin Access</h2>
          <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '0.9rem' }}>Restricted area for library staff</p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '20px' }} onSubmit={handleAdminLogin}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Username</label>
              <input type="text" className="input-glass" required value={adminUsername} onChange={(e) => setAdminUsername(e.target.value)} style={{ width: '100%' }} placeholder="admin" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Password</label>
              <input type="password" className="input-glass" required value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} style={{ width: '100%' }} placeholder="••••••••" />
            </div>
            {adminLoginError && (
              <p style={{ color: '#ef4444', fontSize: '0.9rem', textAlign: 'center', margin: '0', background: 'rgba(239, 68, 68, 0.1)', padding: '8px', borderRadius: '8px' }}>
                {adminLoginError}
              </p>
            )}
            <button type="submit" className="btn-primary" style={{ marginTop: '16px', width: '100%', padding: '14px' }}>Login to Dashboard</button>
          </form>
        </div>
      </div>
    );
  };

  const renderBookDetailsModal = () => {
    if (!selectedBook) return null;

    if (isEditing) {
      return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s ease', padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '0', width: '100%', maxWidth: '800px', position: 'relative', display: 'flex', flexDirection: 'column', overflow: 'hidden', maxHeight: '90vh' }}>
            <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)' }}>
              <h2 style={{ fontSize: '1.5rem', margin: 0 }}>Edit Book Details</h2>
              <button className="btn-filter" onClick={cancelEditing}>Cancel</button>
            </div>
            
            <div style={{ padding: '32px', overflowY: 'auto', flex: 1 }}>
              <form id="edit-book-form" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleEditBookSubmit}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Book Title <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="input-glass" required value={selectedBook.title} onChange={(e) => setSelectedBook({...selectedBook, title: e.target.value})} style={{ width: '100%' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Author <span style={{ color: '#ef4444' }}>*</span></label>
                    <input type="text" className="input-glass" required value={selectedBook.author} onChange={(e) => setSelectedBook({...selectedBook, author: e.target.value})} style={{ width: '100%' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Status <span style={{ color: '#ef4444' }}>*</span></label>
                    <select className="input-glass" style={{ appearance: 'none', width: '100%', cursor: 'pointer' }} value={selectedBook.status} onChange={(e) => setSelectedBook({...selectedBook, status: e.target.value})}>
                      <option value="Available" style={{ background: '#1e1b4b' }}>Available</option>
                      <option value="Checked Out" style={{ background: '#1e1b4b' }}>Checked Out</option>
                      <option value="Reserved" style={{ background: '#1e1b4b' }}>Reserved</option>
                    </select>
                  </div>

                  {selectedBook.status === 'Checked Out' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Due Date</label>
                      <input type="date" className="input-glass" value={selectedBook.dueDate || ''} onChange={(e) => setSelectedBook({...selectedBook, dueDate: e.target.value})} style={{ width: '100%' }} />
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>ISBN</label>
                    <input type="text" className="input-glass" value={selectedBook.isbn || ''} onChange={(e) => setSelectedBook({...selectedBook, isbn: e.target.value})} style={{ width: '100%' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Category</label>
                    <input type="text" className="input-glass" value={selectedBook.category || ''} onChange={(e) => setSelectedBook({...selectedBook, category: e.target.value})} style={{ width: '100%' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                    <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Book Cover URL</label>
                    <input type="url" className="input-glass" value={selectedBook.cover || ''} onChange={(e) => setSelectedBook({...selectedBook, cover: e.target.value})} style={{ width: '100%' }} />
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1', position: 'relative' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                      <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>About the Book (Description)</label>
                      <AiButton onClick={() => generateDescription(selectedBook, true)} isGenerating={isGenerating} />
                    </div>
                    <textarea className="input-glass" rows="6" value={selectedBook.description || ''} onChange={(e) => setSelectedBook({...selectedBook, description: e.target.value})} style={{ width: '100%', resize: 'vertical' }}></textarea>
                  </div>
                </div>
              </form>
            </div>
            
            <div style={{ padding: '24px', borderTop: '1px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.02)' }}>
               <button type="submit" form="edit-book-form" className="btn-primary" style={{ width: '100%', padding: '16px' }}>Save Changes</button>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(12px)', zIndex: 2000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s ease', padding: '20px' }} onClick={(e) => { if (e.target === e.currentTarget) setSelectedBook(null) }}>
        <div className="glass-panel" style={{ padding: '0', width: '100%', maxWidth: '800px', position: 'relative', display: 'flex', flexDirection: window.innerWidth < 600 ? 'column' : 'row', overflow: 'hidden' }}>
          <button onClick={() => setSelectedBook(null)} style={{ position: 'absolute', top: '16px', right: '16px', background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', width: '32px', height: '32px', borderRadius: '50%', fontSize: '1rem', cursor: 'pointer', transition: 'all 0.2s', zIndex: 10, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onMouseOver={e => e.target.style.background = 'rgba(0,0,0,0.8)'} onMouseOut={e => e.target.style.background = 'rgba(0,0,0,0.5)'}>✕</button>
          
          <div style={{ flex: '0 0 300px', background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.1)' }}>
            <img src={selectedBook.cover} alt={selectedBook.title} style={{ width: '100%', height: '100%', objectFit: 'cover', minHeight: '300px' }} />
          </div>
          
          <div style={{ padding: '40px', flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
              <div style={{ 
                display: 'inline-block', 
                padding: '4px 12px', 
                borderRadius: '20px', 
                fontSize: '0.8rem', 
                fontWeight: 600,
                backgroundColor: selectedBook.status === 'Available' ? 'rgba(16, 185, 129, 0.15)' : 
                                 selectedBook.status === 'Checked Out' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                color: selectedBook.status === 'Available' ? '#34d399' : 
                       selectedBook.status === 'Checked Out' ? '#f87171' : '#fbbf24',
                border: `1px solid ${selectedBook.status === 'Available' ? 'rgba(52, 211, 153, 0.3)' : selectedBook.status === 'Checked Out' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`
              }}>
                {selectedBook.status} {selectedBook.dueDate && `(Expected return: ${selectedBook.dueDate})`}
              </div>

              {isAdminLoggedIn && (
                 <button className="btn-filter" style={{ padding: '4px 16px', fontSize: '0.8rem' }} onClick={startEditing}>Edit Book</button>
              )}
            </div>
            
            <h2 style={{ fontSize: '2.2rem', marginBottom: '8px', lineHeight: '1.2' }}>{selectedBook.title}</h2>
            <p style={{ fontSize: '1.2rem', color: 'var(--text-muted)', marginBottom: '24px', fontWeight: 500 }}>By {selectedBook.author}</p>
            
            <div style={{ display: 'flex', gap: '24px', marginBottom: '32px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>ISBN</span>
                <span style={{ fontWeight: 500 }}>{selectedBook.isbn}</span>
              </div>
              <div>
                <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '4px' }}>Category</span>
                <span style={{ fontWeight: 500 }}>{selectedBook.category || 'Uncategorized'}</span>
              </div>
            </div>

            <h3 style={{ fontSize: '1.2rem', marginBottom: '12px' }}>About the book</h3>
            <p style={{ color: 'var(--text-muted)', lineHeight: '1.7', flex: 1 }}>
              {selectedBook.description || 'No description available for this title.'}
            </p>

            <div style={{ marginTop: '32px', display: 'flex', gap: '16px' }}>
              {selectedBook.status === 'Available' ? (
                <button className="btn-primary" style={{ flex: 1 }} onClick={() => { alert('Borrow request initiated!'); setSelectedBook(null); }}>Borrow Book</button>
              ) : (
                <button className="btn-primary" style={{ flex: 1, background: 'rgba(255,255,255,0.1)', color: 'white' }} onClick={() => { alert('You have joined the waitlist.'); setSelectedBook(null); }}>Join Waitlist</button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderAddBookView = () => {
    return (
      <div style={{ animation: 'fadeIn 0.6s ease', maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        <button className="btn-filter" style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setShowAddBook(false)}>
          ← Back to Dashboard
        </button>
        
        <div className="glass-panel" style={{ padding: '48px' }}>
          <h2 style={{ marginBottom: '16px', fontSize: '2rem' }}>Add New Book</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '40px', lineHeight: '1.6' }}>
            Expand the library collection by adding a new title. Please ensure all details are accurate.
          </p>
          
          <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleAddBookSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Book Title <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" className="input-glass" required value={newBook.title} onChange={(e) => setNewBook({...newBook, title: e.target.value})} placeholder="E.g., The Rust Programming Language" style={{ width: '100%' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Author <span style={{ color: '#ef4444' }}>*</span></label>
                <input type="text" className="input-glass" required value={newBook.author} onChange={(e) => setNewBook({...newBook, author: e.target.value})} placeholder="E.g., Steve Klabnik, Carol Nichols" style={{ width: '100%' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>ISBN</label>
                <input type="text" className="input-glass" value={newBook.isbn} onChange={(e) => setNewBook({...newBook, isbn: e.target.value})} placeholder="E.g., 9781593278281" style={{ width: '100%' }} />
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Status <span style={{ color: '#ef4444' }}>*</span></label>
                <select className="input-glass" style={{ appearance: 'none', width: '100%', cursor: 'pointer' }} value={newBook.status} onChange={(e) => setNewBook({...newBook, status: e.target.value})}>
                  <option value="Available" style={{ background: '#1e1b4b' }}>Available</option>
                  <option value="Checked Out" style={{ background: '#1e1b4b' }}>Checked Out</option>
                  <option value="Reserved" style={{ background: '#1e1b4b' }}>Reserved</option>
                </select>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Category</label>
                <input type="text" className="input-glass" value={newBook.category} onChange={(e) => setNewBook({...newBook, category: e.target.value})} placeholder="E.g., Computer Science, Fiction, History" style={{ width: '100%' }} />
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1' }}>
                <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Book Cover URL (Optional)</label>
                <input type="url" className="input-glass" value={newBook.cover} onChange={(e) => setNewBook({...newBook, cover: e.target.value})} placeholder="https://example.com/cover.jpg" style={{ width: '100%' }} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '4px' }}>* If left blank, a beautiful placeholder will be generated.</span>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', gridColumn: '1 / -1', position: 'relative' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '8px' }}>
                  <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>About the Book (Description)</label>
                  <AiButton onClick={() => generateDescription(newBook, false)} isGenerating={isGenerating} />
                </div>
                <textarea className="input-glass" rows="5" value={newBook.description} onChange={(e) => setNewBook({...newBook, description: e.target.value})} placeholder="A comprehensive guide to..." style={{ width: '100%', resize: 'vertical' }}></textarea>
              </div>
            </div>
            
            <button type="submit" className="btn-primary" style={{ marginTop: '16px', width: '100%', padding: '16px' }}>Add Book to Library</button>
          </form>
        </div>
      </div>
    );
  };

  return (
    <div className="app-container">
      {showApiKeyPrompt && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 3000, display: 'flex', justifyContent: 'center', alignItems: 'center', animation: 'fadeIn 0.3s ease', padding: '20px' }}>
          <div className="glass-panel" style={{ padding: '40px', maxWidth: '500px', width: '100%' }}>
            <h2 style={{ marginBottom: '16px', color: 'white', display: 'flex', alignItems: 'center', gap: '12px' }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
              </svg>
              Gemini API Setup
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.6' }}>
              To use AI auto-generation, you need a free Google Gemini API key. We store this securely in your browser's local storage—it is never sent to our servers.
            </p>
            <form onSubmit={saveApiKey}>
               <input 
                  type="password" 
                  className="input-glass" 
                  placeholder="Paste your Gemini API Key here" 
                  style={{ width: '100%', marginBottom: '24px', borderColor: '#10b981' }} 
                  value={aiApiKey}
                  onChange={e => setAiApiKey(e.target.value)}
                  required
                />
               <div style={{ display: 'flex', gap: '12px' }}>
                 <button type="button" className="btn-filter" style={{ flex: 1 }} onClick={() => setShowApiKeyPrompt(false)}>Cancel</button>
                 <button type="submit" className="btn-primary" style={{ flex: 1, background: 'linear-gradient(45deg, #10b981, #3b82f6)' }}>Save Key</button>
               </div>
            </form>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" style={{ display: 'block', textAlign: 'center', marginTop: '24px', color: '#3b82f6', textDecoration: 'none', fontSize: '0.9rem' }}>
              Get a free API key here →
            </a>
          </div>
        </div>
      )}

      <nav className="navbar glass-panel" style={{ borderRadius: '0 0 24px 24px', borderTop: 'none' }}>
        <a href="#" className="logo" onClick={(e) => { e.preventDefault(); setActiveTab('home'); setSearchQuery(''); }}>
          <span style={{ color: 'var(--primary)', textShadow: '0 0 20px rgba(79, 70, 229, 0.5)' }}>the</span>BookGuy
        </a>
        <div className="nav-links">
          <a href="#" className={`nav-link ${activeTab === 'home' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('home'); }}>Home</a>
          <a href="#" className={`nav-link ${activeTab === 'search' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('search'); }}>Search & Filter</a>
          <a href="#" className={`nav-link ${activeTab === 'request' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('request'); }}>Request</a>
          {isAdminLoggedIn && (
            <a href="#" className={`nav-link ${activeTab === 'admin' ? 'active' : ''}`} onClick={(e) => { e.preventDefault(); setActiveTab('admin'); setShowAddBook(false); }}>Dashboard</a>
          )}
        </div>
      </nav>

      <main className="main-content">
        {activeTab === 'home' && (
          <div style={{ textAlign: 'center', marginTop: '12vh', animation: 'fadeIn 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}>
            <h1 style={{ fontSize: '4rem', marginBottom: '20px', textShadow: '0 4px 10px rgba(0,0,0,0.3)' }}>Find Your Next Read</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '1.25rem', maxWidth: '600px', margin: '0 auto 48px', lineHeight: '1.6' }}>
              The premier college library system. Fast, simple, and beautifully designed with fluid interfaces.
            </p>
            <form onSubmit={handleSearchSubmit} className="search-container glass-panel" style={{ display: 'flex', gap: '12px', maxWidth: '600px', margin: '0 auto', padding: '12px', borderRadius: '16px' }}>
              <input 
                type="text" 
                className="input-glass" 
                placeholder="Search by title, author, or ISBN..." 
                style={{ flex: 1, border: 'none', background: 'rgba(255,255,255,0.03)' }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="btn-primary" style={{ padding: '14px 32px' }}>Discover</button>
            </form>
          </div>
        )}
        
        {activeTab === 'search' && (
          <div style={{ animation: 'fadeIn 0.6s ease', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '32px', marginBottom: '40px' }}>
              <h2 style={{ marginBottom: '20px' }}>Search & Filter</h2>
              <form onSubmit={handleSearchSubmit} style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                <input 
                  type="text" 
                  className="input-glass" 
                  placeholder="Search by title, author, or ISBN..." 
                  style={{ flex: 1 }}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
              
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ color: 'var(--text-muted)', fontWeight: 500, marginRight: '8px' }}>Filter by Status:</span>
                {['All', 'Available', 'Checked Out', 'Reserved'].map(status => (
                  <button 
                    key={status}
                    className={`btn-filter ${filterStatus === status ? 'active' : ''}`}
                    onClick={() => setFilterStatus(status)}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h3 style={{ fontWeight: 500, color: 'var(--text-muted)' }}>
                {searchResults.length} {searchResults.length === 1 ? 'result' : 'results'} found
              </h3>
            </div>
            
            {searchResults.length > 0 ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '28px' }}>
                {searchResults.map(book => (
                  <div key={book.id} className="glass-panel" style={{ padding: '24px', display: 'flex', gap: '20px', alignItems: 'flex-start', transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)', cursor: 'pointer' }} onClick={() => setSelectedBook(book)} onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-6px) scale(1.02)'; e.currentTarget.style.boxShadow = '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255, 255, 255, 0.2)'; }} onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0) scale(1)'; e.currentTarget.style.boxShadow = '0 12px 40px 0 rgba(0, 0, 0, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.1)'; }}>
                    <img src={book.cover} alt={book.title} style={{ width: '90px', height: '135px', objectFit: 'cover', borderRadius: '10px', boxShadow: '0 8px 16px rgba(0,0,0,0.3)' }} />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100%' }}>
                      <h3 style={{ fontSize: '1.2rem', marginBottom: '6px', lineHeight: '1.3', textShadow: '0 2px 4px rgba(0,0,0,0.2)' }}>{book.title}</h3>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', marginBottom: '8px', fontWeight: 500 }}>{book.author}</p>
                      <div style={{ fontSize: '0.85rem', marginBottom: '16px', color: 'rgba(255,255,255,0.5)' }}>ISBN: {book.isbn}</div>
                      
                      <div style={{ 
                        marginTop: 'auto',
                        alignSelf: 'flex-start',
                        display: 'inline-block', 
                        padding: '6px 14px', 
                        borderRadius: '20px', 
                        fontSize: '0.85rem', 
                        fontWeight: 600,
                        backgroundColor: book.status === 'Available' ? 'rgba(16, 185, 129, 0.15)' : 
                                         book.status === 'Checked Out' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                        color: book.status === 'Available' ? '#34d399' : 
                               book.status === 'Checked Out' ? '#f87171' : '#fbbf24',
                        border: `1px solid ${book.status === 'Available' ? 'rgba(52, 211, 153, 0.3)' : book.status === 'Checked Out' ? 'rgba(248, 113, 113, 0.3)' : 'rgba(251, 191, 36, 0.3)'}`,
                        backdropFilter: 'blur(4px)'
                      }}>
                        {book.status} {book.dueDate && `(Until ${book.dueDate})`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="glass-panel" style={{ padding: '80px 40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                <p style={{ fontSize: '1.3rem', marginBottom: '20px' }}>No books found matching your criteria</p>
                <button className="btn-primary" onClick={() => setActiveTab('request')}>Request to add this book</button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'request' && (
          <div style={{ animation: 'fadeIn 0.6s ease', maxWidth: '650px', margin: '0 auto', width: '100%' }}>
            <div className="glass-panel" style={{ padding: '48px' }}>
              <h2 style={{ marginBottom: '16px', textAlign: 'center', fontSize: '2rem' }}>Request a Book</h2>
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', margin: '0 auto 40px', maxWidth: '450px', lineHeight: '1.6' }}>
                Can't find what you're looking for? Let us know and we'll process your request to add it to the liquid collection.
              </p>
              <form style={{ display: 'flex', flexDirection: 'column', gap: '24px' }} onSubmit={handleRequestSubmit}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Book Title <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" className="input-glass" required placeholder="E.g., Design Patterns" style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Author / ISBN</label>
                  <input type="text" className="input-glass" placeholder="E.g., Erich Gamma or 978..." style={{ width: '100%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  <label style={{ fontWeight: 500, color: 'var(--text-main)', fontSize: '0.95rem', marginLeft: '4px' }}>Reason for request (Optional)</label>
                  <textarea className="input-glass" rows="4" placeholder="Course requirement, thesis research, etc." style={{ width: '100%', resize: 'vertical' }}></textarea>
                </div>
                <button type="submit" className="btn-primary" style={{ marginTop: '24px', width: '100%', padding: '16px' }}>Submit Request</button>
              </form>
            </div>
          </div>
        )}

        {activeTab === 'admin' && isAdminLoggedIn && (
          showAddBook ? renderAddBookView() : (
            <div style={{ animation: 'fadeIn 0.6s ease', maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
              <div className="glass-panel" style={{ padding: '32px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.8rem' }}>Admin Dashboard</h2>
                  <p style={{ color: 'var(--text-muted)', marginTop: '4px' }}>Manage library resources and requests</p>
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {aiApiKey ? (
                         <button className="btn-filter" style={{ fontSize: '0.8rem', borderColor: '#10b981', color: '#10b981' }} onClick={clearApiKey}>Clear AI Key</button>
                    ) : (
                         <button className="btn-filter" style={{ fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '4px' }} onClick={() => setShowApiKeyPrompt(true)}>
                             <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></svg>
                             Set AI Key
                         </button>
                    )}
                  <button className="btn-filter" onClick={() => { setIsAdminLoggedIn(false); setActiveTab('home'); setShowAddBook(false); }}>Log Out</button>
                </div>
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '1.4rem' }}>Book Inventory</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Total books in system: {books.length}</p>
                  <button className="btn-primary" style={{ width: '100%' }} onClick={() => setShowAddBook(true)}>Add New Book</button>
                </div>
                <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '1.4rem' }}>Student Requests</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Pending requests: 3</p>
                  <button className="btn-filter active" style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>Review Requests</button>
                </div>
                <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
                  <h3 style={{ marginBottom: '16px', fontSize: '1.4rem' }}>System Settings</h3>
                  <p style={{ color: 'var(--text-muted)', marginBottom: '24px' }}>Configure library rules and aesthetics</p>
                  <button className="btn-filter" style={{ width: '100%', padding: '14px', borderRadius: '12px' }}>Preferences</button>
                </div>
              </div>
            </div>
          )
        )}
      </main>

      <footer className="footer" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', marginTop: '60px' }}>
        <p style={{ marginBottom: '8px', color: 'var(--text-main)', fontWeight: 500, letterSpacing: '1px' }}>theBookGuy</p>
        <p>© {new Date().getFullYear()} College Library System. Designed for intuitive learning.</p>
      </footer>

      {/* Hidden Admin Section */}
      <a href="#" className="hidden-admin" onClick={handleAdminClick}>Admin Panel</a>
      
      {/* Login Modal */}
      {renderAdminLoginModal()}
      
      {/* Book Details Overlay */}
      {renderBookDetailsModal()}
    </div>
  )
}

export default App
