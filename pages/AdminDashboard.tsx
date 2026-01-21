import React, { useState } from 'react';
import { useWedding } from '../context/WeddingContext';
import { Button, Input, Card, Icons } from '../components/UI';
import { GuestView } from './GuestView';
import { isFirebaseEnabled } from '../firebaseConfig';

// Helper to compress images for Firestore (Limit < 1MB)
const compressImage = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const img = new Image();
      img.src = e.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Calculate new dimensions (Max 1000px)
        let width = img.width;
        let height = img.height;
        const MAX_DIM = 1000;
        
        if (width > height) {
          if (width > MAX_DIM) {
            height *= MAX_DIM / width;
            width = MAX_DIM;
          }
        } else {
          if (height > MAX_DIM) {
            width *= MAX_DIM / height;
            height = MAX_DIM;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          // Compress to JPEG at 0.7 quality
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          reject(new Error("Canvas context failed"));
        }
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

export const AdminDashboard: React.FC = () => {
  const { settings, invitees, updateSettings, addInvitee, deleteInvitee, logout } = useWedding();
  const [newGuestName, setNewGuestName] = useState('');
  const [newGuestTitle, setNewGuestTitle] = useState('Mr & Mrs');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [previewGuestId, setPreviewGuestId] = useState<string | null>(null);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      setUploadError(null);
      
      try {
        const compressedBase64 = await compressImage(file);
        await updateSettings({ inviteImage: compressedBase64 });
      } catch (err) {
        console.error(err);
        setUploadError("Failed to process image. Please try a different file.");
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleAddGuest = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGuestName.trim()) {
      addInvitee(newGuestName.trim(), newGuestTitle);
      setNewGuestName('');
      setNewGuestTitle('Mr & Mrs');
    }
  };

  const getInviteUrl = (slug: string) => {
    // Ensure we don't have double slashes if pathname ends with /
    const baseUrl = window.location.origin + window.location.pathname.replace(/\/$/, '');
    return `${baseUrl}/#/${slug}`;
  };

  const copyLink = (slug: string) => {
    const url = getInviteUrl(slug);
    navigator.clipboard.writeText(url);
    alert('Invitation link copied to clipboard!');
  };

  const filteredInvitees = invitees.filter(inv => 
    inv.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      <div className="min-h-screen bg-stone-50 p-6 md:p-12 font-sans">
        <header className="max-w-6xl mx-auto flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-serif text-wedding-charcoal">Wedding Admin</h1>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-wedding-stone text-sm">Manage your special day details</p>
               {isFirebaseEnabled ? (
                 <span className="bg-green-100 text-green-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-green-200">Database Connected</span>
               ) : (
                 <span className="bg-orange-100 text-orange-700 text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wide border border-orange-200" title="Guests on other devices will NOT see your changes. Configure Firebase env vars to go live.">Local Demo Mode (Offline)</span>
               )}
            </div>
            {!isFirebaseEnabled && (
               <p className="text-xs text-red-500 mt-2 font-medium">
                 Warning: You are in Local Mode. Remote guests cannot see data unless you configure the database.
               </p>
            )}
          </div>
          <Button variant="secondary" onClick={logout} className="gap-2">
            <Icons.LogOut className="w-4 h-4" /> Logout
          </Button>
        </header>

        <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Settings Column */}
          <div className="lg:col-span-1 space-y-6">
            <Card>
              <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                <Icons.Settings className="w-5 h-5 text-wedding-gold" /> Settings
              </h2>
              <div className="space-y-4">
                <Input 
                  label="Couple Names" 
                  value={settings.coupleName} 
                  onChange={(e) => updateSettings({ coupleName: e.target.value })} 
                />
                <Input 
                  label="Wedding Date" 
                  type="date"
                  value={settings.weddingDate} 
                  onChange={(e) => updateSettings({ weddingDate: e.target.value })} 
                />
              </div>
            </Card>

            <Card>
              <h2 className="text-xl font-serif mb-4 flex items-center gap-2">
                <Icons.Upload className="w-5 h-5 text-wedding-gold" /> Invitation Card
              </h2>
              <div className="border-2 border-dashed border-wedding-stone/30 rounded-lg p-6 text-center hover:bg-wedding-cream/30 transition-colors relative group">
                {isUploading ? (
                  <div className="flex flex-col items-center justify-center py-8">
                     <div className="w-8 h-8 border-2 border-wedding-gold border-t-transparent rounded-full animate-spin mb-2" />
                     <span className="text-xs text-wedding-stone">Optimizing & Uploading...</span>
                  </div>
                ) : settings.inviteImage ? (
                  <div className="relative">
                    <img src={settings.inviteImage} alt="Invitation" className="w-full h-auto rounded shadow-sm max-h-64 object-cover" />
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded">
                        <span className="text-white text-sm">Click to replace</span>
                    </div>
                  </div>
                ) : (
                  <div className="text-wedding-stone py-8">
                    <p className="text-sm">Upload PNG/JPG</p>
                    <p className="text-xs mt-1">(Image will be optimized)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={handleImageUpload} 
                  disabled={isUploading}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
              </div>
              {uploadError && <p className="text-red-500 text-xs mt-2">{uploadError}</p>}
            </Card>
          </div>

          {/* Invitees Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-serif flex items-center gap-2">
                  <Icons.Users className="w-5 h-5 text-wedding-gold" /> Guest List
                </h2>
                <span className="bg-wedding-cream text-wedding-charcoal px-3 py-1 rounded-full text-xs font-bold">
                  {invitees.length} Guests
                </span>
              </div>

              {/* Add New Guest Form */}
              <form onSubmit={handleAddGuest} className="bg-wedding-ivory/50 p-4 rounded-lg mb-6 border border-wedding-stone/10">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                  <div className="md:col-span-4">
                    <Input 
                      placeholder="Guest Name (e.g. Aunt Mary)" 
                      value={newGuestName} 
                      onChange={e => setNewGuestName(e.target.value)} 
                      required
                    />
                  </div>
                  <div className="md:col-span-6">
                    <div className="relative">
                      <select 
                        value={newGuestTitle} 
                        onChange={e => setNewGuestTitle(e.target.value)} 
                        className="w-full px-3 py-2 bg-white border border-wedding-stone/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-wedding-gold/20 focus:border-wedding-gold transition-colors appearance-none text-wedding-charcoal"
                      >
                        <option value="Ven">Ven</option>
                        <option value="Mr & Mrs">Mr & Mrs</option>
                        <option value="Mr">Mr</option>
                        <option value="Mrs">Mrs</option>
                        <option value="Family">Family</option>
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-wedding-stone">
                        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
                        </svg>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <Button type="submit" className="w-full">Add</Button>
                  </div>
                </div>
              </form>

              {/* Search */}
              <div className="mb-4">
                <Input 
                  placeholder="Search guests..." 
                  value={searchQuery} 
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Guest Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="text-xs text-wedding-stone uppercase bg-wedding-ivory">
                    <tr>
                      <th className="px-4 py-3">Name</th>
                      <th className="px-4 py-3">Links</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredInvitees.length > 0 ? filteredInvitees.map(inv => (
                      <tr key={inv.id} className="border-b border-wedding-stone/10 hover:bg-wedding-ivory/50 transition-colors">
                        <td className="px-4 py-3 font-medium text-wedding-charcoal">
                          <div className="flex items-center">
                            {inv.title && (
                              <span className="text-[10px] font-bold text-wedding-gold mr-2 uppercase tracking-wider border border-wedding-gold/30 px-1.5 py-0.5 rounded bg-wedding-gold/5">
                                {inv.title}
                              </span>
                            )}
                            {inv.name}
                          </div>
                          {inv.message && <p className="text-xs text-wedding-stone font-light truncate max-w-xs mt-0.5">{inv.message}</p>}
                        </td>
                        <td className="px-4 py-3 flex items-center gap-3">
                          <button 
                            onClick={() => copyLink(inv.slug)}
                            className="text-wedding-gold hover:text-yellow-600 flex items-center gap-1 text-xs font-bold uppercase tracking-wide"
                            title="Copy to clipboard"
                          >
                            <Icons.Copy className="w-3 h-3" /> Copy
                          </button>
                          <button 
                            onClick={() => setPreviewGuestId(inv.id)}
                            className="text-wedding-stone hover:text-wedding-charcoal flex items-center gap-1 text-xs font-bold uppercase tracking-wide"
                            title="Preview in this window"
                          >
                            <Icons.Eye className="w-3 h-3" /> Preview
                          </button>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <button 
                            onClick={() => deleteInvitee(inv.id)}
                            className="text-red-400 hover:text-red-600 transition-colors p-1"
                            title="Delete guest"
                          >
                            <Icons.Trash className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={3} className="px-4 py-8 text-center text-wedding-stone italic">
                          No guests found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

        </main>
      </div>

      {/* Full Screen Preview Modal */}
      {previewGuestId && (
        <div className="fixed inset-0 z-[100] bg-white overflow-y-auto animate-fade-in">
          <button 
            onClick={() => setPreviewGuestId(null)} 
            className="fixed top-4 right-4 z-[110] bg-black/40 hover:bg-black/70 text-white rounded-full p-2 transition-colors shadow-lg backdrop-blur-sm"
            title="Close Preview"
          >
            <Icons.X className="w-6 h-6" />
          </button>
          <GuestView previewId={previewGuestId} />
        </div>
      )}
    </>
  );
};