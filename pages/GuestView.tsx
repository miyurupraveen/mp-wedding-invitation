import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWedding } from '../context/WeddingContext';
import { OpeningAnimation } from '../components/OpeningAnimation';
import { Invitee } from '../types';
import { Button, Input, Icons } from '../components/UI';

interface GuestViewProps {
  previewId?: string;
}

export const GuestView: React.FC<GuestViewProps> = ({ previewId }) => {
  const { getInvitee, updateInvitee, settings, isLoading: contextLoading } = useWedding();
  const { slug } = useParams<{ slug: string }>();
  
  const [invitee, setInvitee] = useState<Invitee | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  // State for animation lifecycle
  const [contentVisible, setContentVisible] = useState(false); // Controls opacity of the main page
  const [animationMounted, setAnimationMounted] = useState(true); // Controls DOM presence of animation overlay
  
  // RSVP Form State
  const [rsvpStatus, setRsvpStatus] = useState<'attending' | 'declined' | null>(null);
  const [guestCount, setGuestCount] = useState<number>(1);
  const [dietary, setDietary] = useState('');
  const [isSubmittingRsvp, setIsSubmittingRsvp] = useState(false);

  useEffect(() => {
    // Priority: 1. Direct Preview ID (Admin), 2. URL Slug
    const identifier = previewId || slug;
    
    if (identifier) {
      const found = getInvitee(identifier);
      setInvitee(found);
      if (found) {
        // Initialize RSVP state if exists
        if (found.rsvpStatus && found.rsvpStatus !== 'pending') {
          setRsvpStatus(found.rsvpStatus);
        }
        if (found.guestCount) setGuestCount(found.guestCount);
        if (found.dietaryRestrictions) setDietary(found.dietaryRestrictions);
      }
    }
    setLoading(false);
  }, [slug, getInvitee, previewId]);

  const handleRsvpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitee || !rsvpStatus) return;

    setIsSubmittingRsvp(true);
    await updateInvitee(invitee.id, {
      rsvpStatus,
      guestCount: rsvpStatus === 'attending' ? guestCount : 0,
      dietaryRestrictions: rsvpStatus === 'attending' ? dietary : ''
    });
    // Artificial delay for better UX
    setTimeout(() => {
      setIsSubmittingRsvp(false);
      alert("Thank you! Your RSVP has been sent.");
    }, 800);
  };

  const handleChangeResponse = () => {
    if (invitee) {
      // Optimistically update local invitee state to show form
      setInvitee({ ...invitee, rsvpStatus: 'pending' });
      // Reset local form state
      setRsvpStatus(null);
    }
  };

  if (loading || (contextLoading && !previewId)) {
    return (
      <div className="min-h-screen bg-wedding-ivory flex flex-col items-center justify-center gap-4">
         <div className="w-12 h-12 border-4 border-wedding-gold/30 border-t-wedding-gold rounded-full animate-spin"></div>
      </div>
    );
  }

  // Fallback if no ID/Slug provided or not found
  const displayGuestName = invitee?.name || "Family & Friends";
  const displayMessage = invitee?.message || `We invite you to celebrate our wedding.`;
  
  // Title options to display with strike-through logic
  const titleOptions = ['Ven', 'Mr & Mrs', 'Mr', 'Mrs', 'Family'];

  // Safe Map URL extraction
  const getEmbedUrl = (input?: string) => {
    if (!input) return null;
    // If it is an iframe string, extract src
    const srcMatch = input.match(/src="([^"]+)"/);
    if (srcMatch && srcMatch[1]) return srcMatch[1];
    return input; // Assume direct URL
  };
  const mapSrc = getEmbedUrl(settings.mapUrl);

  return (
    <div className="min-h-screen bg-wedding-ivory text-wedding-charcoal font-sans overflow-x-hidden">
      
      {/* Animation Overlay: Sits on top, fades out gracefully */}
      {animationMounted && (
        <OpeningAnimation 
          guestName={displayGuestName} 
          guestTitle={invitee?.title}
          inviteImage={settings.inviteImage}
          onOpen={() => setContentVisible(true)}
          onComplete={() => setAnimationMounted(false)}
        />
      )}

      {/* Main Content: Sits underneath, fades in gracefully */}
      <div className={`transition-opacity duration-[2500ms] ease-in-out ${contentVisible ? 'opacity-100' : 'opacity-0'}`}>
        
        {/* Hero Section */}
        <section className="relative flex flex-col items-center justify-center p-8 text-center bg-wedding-cream/30 pb-8">
          <div className="max-w-3xl mx-auto space-y-6 pt-12">
            <p className="font-serif italic text-xl md:text-2xl text-wedding-stone">Together with their families</p>
            
            <h1 className="font-serif text-wedding-gold mb-4">
              {/* Mobile View: Stacked */}
              <div className="flex flex-col items-center gap-2 md:hidden text-5xl">
                {settings.coupleName.includes(' & ') ? (
                  <>
                    <span>{settings.coupleName.split(' & ')[0]}</span>
                    <span className="text-3xl">&</span>
                    <span>{settings.coupleName.split(' & ')[1]}</span>
                  </>
                ) : (
                  <span>{settings.coupleName}</span>
                )}
              </div>
              
              {/* Desktop View: Single Line */}
              <div className="hidden md:block text-7xl">
                {settings.coupleName}
              </div>
            </h1>
            
            <div className="w-16 h-px bg-wedding-gold/40 mx-auto my-6" />
            <p className="text-lg uppercase tracking-widest font-light">
              Request the honor of your presence
            </p>
            
            {/* Personalized Block */}
            <div className="mt-8 p-8 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm border border-white border-opacity-40">
              <p className="font-serif text-3xl text-wedding-charcoal mb-4">Dear {displayGuestName},</p>
              <p className="text-wedding-stone/90 leading-relaxed max-w-md mx-auto">
                {displayMessage}
              </p>
            </div>
          </div>
        </section>

        {/* Invitation Card Section */}
        <section className="py-8 px-2 md:px-4 bg-white relative flex justify-center">
          {/* Card Container - using relative to position text over it */}
          <div className="relative max-w-[600px] w-full shadow-2xl rounded-sm overflow-hidden bg-wedding-ivory">
            
            {settings.inviteImage ? (
              <>
                <img 
                  src={settings.inviteImage} 
                  alt="Official Invitation" 
                  className="w-full h-auto block"
                />

                {/* Title Selection Overlay - Invisible Text, Visible Lines */}
                <div 
                  className="absolute left-0 right-0 text-center flex items-center justify-center px-4"
                  style={{
                    top: '49%', // Adjusted position based on user request
                    transform: 'translateY(-50%)', 
                  }}
                >
                  {/* Changed gap to 5px on mobile, md:gap-3 is 12px */}
                  <div className="flex flex-wrap justify-center gap-[5px] md:gap-3 font-serif font-medium"
                       style={{
                         fontSize: 'clamp(9px, 2vw, 14px)', 
                         color: 'transparent', // Text is invisible, serving only as anchors for lines
                         textShadow: 'none',
                         letterSpacing: '0.1em'
                       }}
                  >
                    {titleOptions.map((option, index) => (
                      <React.Fragment key={option}>
                        <span className="relative inline-block px-0.5">
                          {option}
                          {/* Strikethrough if title is set and doesn't match this option */}
                          {invitee?.title && invitee.title !== option && (
                            <span className="absolute left-0 right-0 top-[55%] h-[1.5px] bg-wedding-charcoal opacity-80 -translate-y-1/2 transform -rotate-2" />
                          )}
                        </span>
                        {index < titleOptions.length - 1 && <span>/</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                
                {/* 
                   Dynamic Name Overlay 
                   - Positioned at 52% from the top
                   - Centered horizontally
                */}
                <div 
                  className="absolute left-0 right-0 text-center flex items-center justify-center px-8"
                  style={{
                    top: '52%', 
                    transform: 'translateY(-50%)', 
                    height: 'auto',
                  }}
                >
                  <span 
                    className="font-serif text-wedding-gold tracking-wide capitalize font-bold"
                    style={{
                      // Increased base size from 13.5px to 15px
                      fontSize: 'clamp(15px, 2.6vw, 22px)',
                      textShadow: '0 0 1px rgba(255,255,255,0.4)'
                    }}
                  >
                    {displayGuestName}
                  </span>
                </div>
              </>
            ) : (
              // Fallback Design if no image is uploaded
              <div className="w-full aspect-[3/4] bg-white border-8 border-double border-wedding-gold/20 flex flex-col items-center justify-center p-12 text-wedding-stone">
                <span className="font-serif text-4xl mb-4 italic">Save the Date</span>
                <span className="text-2xl font-bold mb-8">{settings.weddingDate}</span>
                
                {/* Title Selection for Fallback (Visible Text) */}
                <div className="flex flex-wrap justify-center gap-2 mb-2 font-serif text-sm text-wedding-stone/80">
                    {titleOptions.map((option, index) => (
                      <React.Fragment key={option}>
                        <span className="relative inline-block">
                          {option}
                          {invitee?.title && invitee.title !== option && (
                            <span className="absolute left-0 right-0 top-1/2 h-[1px] bg-wedding-charcoal opacity-60 -translate-y-1/2" />
                          )}
                        </span>
                        {index < titleOptions.length - 1 && <span>/</span>}
                      </React.Fragment>
                    ))}
                </div>

                <div className="w-full border-b border-dotted border-wedding-stone/50 my-4 relative h-8">
                   <span className="absolute -top-6 left-0 right-0 text-center text-wedding-charcoal font-serif text-2xl">
                     {displayGuestName}
                   </span>
                </div>
                <p className="text-xs mt-8">(Admin: Upload the invitation image in dashboard)</p>
              </div>
            )}
          </div>
        </section>

        {/* Location Section */}
        {(settings.venueName || settings.mapUrl) && (
          <section className="py-16 px-4 bg-wedding-ivory flex justify-center">
            <div className="max-w-4xl w-full text-center">
               <h2 className="font-serif text-3xl md:text-4xl text-wedding-gold mb-8">The Celebration</h2>
               
               <div className="grid md:grid-cols-2 gap-4 items-stretch bg-white p-4 md:p-6 rounded-lg shadow-md border border-wedding-stone/10">
                  <div className="flex flex-col justify-center text-left space-y-2 p-2">
                      <h3 className="text-2xl font-serif font-bold text-wedding-charcoal">{settings.venueName || "Wedding Venue"}</h3>
                      <p className="text-wedding-stone text-base leading-relaxed">{settings.venueAddress || "Address details here"}</p>
                      
                      <div className="pt-4">
                        <a 
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(settings.venueName + " " + settings.venueAddress)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center bg-wedding-gold text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition-colors font-medium text-sm gap-2"
                        >
                          <Icons.MapPin className="w-4 h-4" /> Open Google Maps
                        </a>
                      </div>
                  </div>
                  
                  <div className="w-full h-64 md:h-auto min-h-[250px] bg-stone-100 rounded-lg overflow-hidden border border-wedding-stone/20 relative">
                    {mapSrc ? (
                      <iframe 
                        src={mapSrc} 
                        width="100%" 
                        height="100%" 
                        style={{ border: 0, position: 'absolute', inset: 0 }} 
                        allowFullScreen 
                        loading="lazy" 
                        referrerPolicy="no-referrer-when-downgrade"
                        title="Wedding Location"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center text-wedding-stone/40">
                         <Icons.MapPin className="w-8 h-8 mb-2" />
                         <span className="text-sm">Map unavailable</span>
                      </div>
                    )}
                  </div>
               </div>
            </div>
          </section>
        )}

        {/* RSVP Section */}
        {invitee && (
          <section className="py-16 px-4 bg-wedding-cream/30 flex justify-center">
            <div className="max-w-md w-full bg-white shadow-xl rounded-xl p-8 border-t-4 border-wedding-gold relative overflow-hidden">
               {/* Decorative Background */}
               <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-wedding-gold/10 rounded-full blur-xl" />
               <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-32 h-32 bg-wedding-stone/10 rounded-full blur-xl" />
               
               <div className="relative z-10">
                 <h2 className="font-serif text-3xl text-center text-wedding-charcoal mb-2">RSVP</h2>
                 <p className="text-center text-wedding-stone text-sm mb-8 italic">Kindly respond by Dec 1st</p>

                 {!invitee.rsvpStatus || invitee.rsvpStatus === 'pending' || isSubmittingRsvp ? (
                   <form onSubmit={handleRsvpSubmit} className="space-y-6">
                      <div className="space-y-3">
                         <label className="flex items-center gap-3 p-3 border border-wedding-stone/20 rounded-lg cursor-pointer hover:bg-wedding-cream/20 transition-colors">
                            <input 
                              type="radio" 
                              name="rsvp" 
                              value="attending" 
                              checked={rsvpStatus === 'attending'} 
                              onChange={() => setRsvpStatus('attending')}
                              className="text-wedding-gold focus:ring-wedding-gold"
                            />
                            <span className="text-wedding-charcoal font-medium">Joyfully Accept</span>
                         </label>
                         
                         <label className="flex items-center gap-3 p-3 border border-wedding-stone/20 rounded-lg cursor-pointer hover:bg-wedding-cream/20 transition-colors">
                            <input 
                              type="radio" 
                              name="rsvp" 
                              value="declined" 
                              checked={rsvpStatus === 'declined'} 
                              onChange={() => setRsvpStatus('declined')}
                              className="text-wedding-gold focus:ring-wedding-gold"
                            />
                            <span className="text-wedding-charcoal font-medium">Regretfully Decline</span>
                         </label>
                      </div>

                      {rsvpStatus === 'attending' && (
                        <div className="space-y-4 animate-fade-in-up">
                           <div className="border-t border-wedding-stone/10 pt-4 mt-2">
                             <Input 
                               label="Number of Guests" 
                               type="number" 
                               min={1} 
                               max={10} 
                               value={guestCount}
                               onChange={(e) => setGuestCount(parseInt(e.target.value) || 1)}
                             />
                           </div>
                           <div>
                             <Input 
                               label="Dietary Restrictions (Optional)" 
                               placeholder="e.g. Vegetarian, Nut Allergy" 
                               value={dietary}
                               onChange={(e) => setDietary(e.target.value)}
                             />
                           </div>
                        </div>
                      )}

                      <Button 
                        type="submit" 
                        className="w-full mt-4" 
                        disabled={!rsvpStatus || isSubmittingRsvp}
                        isLoading={isSubmittingRsvp}
                      >
                        Submit Response
                      </Button>
                   </form>
                 ) : (
                   <div className="text-center py-6 animate-fade-in">
                      {invitee.rsvpStatus === 'attending' ? (
                        <div className="flex flex-col items-center gap-3">
                           <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 mb-2">
                              <Icons.Check className="w-6 h-6" />
                           </div>
                           <h3 className="text-xl font-serif text-wedding-charcoal">Response Confirmed!</h3>
                           <p className="text-wedding-stone">
                             We are delighted that you will be joining us.
                             <br/>
                             <span className="text-sm mt-2 block">Guests: {invitee.guestCount}</span>
                           </p>
                        </div>
                      ) : (
                         <div className="flex flex-col items-center gap-3">
                            <div className="w-12 h-12 bg-stone-100 rounded-full flex items-center justify-center text-wedding-stone mb-2">
                              <Icons.Heart className="w-6 h-6" />
                           </div>
                           <h3 className="text-xl font-serif text-wedding-charcoal">Response Received</h3>
                           <p className="text-wedding-stone">
                             We will miss you, but thank you for letting us know.
                           </p>
                        </div>
                      )}
                      
                      <button 
                        onClick={handleChangeResponse}
                        className="text-xs text-wedding-gold underline mt-6 hover:text-yellow-700"
                      >
                        Change Response
                      </button>
                   </div>
                 )}
               </div>
            </div>
          </section>
        )}

        <footer className="bg-wedding-cream py-12 text-center text-wedding-stone/60 text-sm">
          <p>With Love, {settings.coupleName}</p>
        </footer>
      </div>
    </div>
  );
};
