import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useWedding } from '../context/WeddingContext';
import { OpeningAnimation } from '../components/OpeningAnimation';
import { Invitee } from '../types';

interface GuestViewProps {
  previewId?: string;
}

export const GuestView: React.FC<GuestViewProps> = ({ previewId }) => {
  const { getInvitee, settings, isLoading: contextLoading } = useWedding();
  const { slug } = useParams<{ slug: string }>();
  
  const [invitee, setInvitee] = useState<Invitee | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  
  // State for animation lifecycle
  const [contentVisible, setContentVisible] = useState(false); // Controls opacity of the main page
  const [animationMounted, setAnimationMounted] = useState(true); // Controls DOM presence of animation overlay
  
  useEffect(() => {
    // Priority: 1. Direct Preview ID (Admin), 2. URL Slug
    const identifier = previewId || slug;
    
    if (identifier) {
      const found = getInvitee(identifier);
      setInvitee(found);
    }
    setLoading(false);
  }, [slug, getInvitee, previewId]);

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

        <footer className="bg-wedding-cream py-12 text-center text-wedding-stone/60 text-sm">
          <p>With Love, {settings.coupleName}</p>
        </footer>
      </div>
    </div>
  );
};
