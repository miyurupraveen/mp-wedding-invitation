import React, { useState } from 'react';
import { Icons } from './UI';
import confetti from 'canvas-confetti';

interface OpeningAnimationProps {
  guestName: string;
  guestTitle?: string;
  inviteImage: string | null;
  onOpen: () => void;     // Triggers the fade-in of the underlying page
  onComplete: () => void; // Triggers the unmount of this animation component
}

export const OpeningAnimation: React.FC<OpeningAnimationProps> = ({ guestName, guestTitle, inviteImage, onOpen, onComplete }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [showEnterButton, setShowEnterButton] = useState(false);

  // Title options matching GuestView for the strikethrough logic
  const titleOptions = ['Dr', 'Mr & Mrs', 'Mr', 'Mrs', 'Family'];

  const handleOpen = () => {
    setIsOpening(true);
    
    // Trigger confetti when opening the envelope
    confetti({
      particleCount: 150,
      spread: 80,
      origin: { y: 0.6 },
      colors: ['#D4AF37', '#E8D5D5', '#A89F91', '#F5EFE6'], // Gold, Blush, Stone, Cream
      zIndex: 100, // Ensure it's above the envelope but below extreme overlays if any
      disableForReducedMotion: true,
      gravity: 1,       // Slower fall
      startVelocity: 30,  // Slower pop
      ticks: 300,         // Last longer
      scalar: 1.1         // Slightly larger
    });
    
    // Timeline:
    // 0ms: Start opening (ribbon moves, envelope flaps open)
    // 2500ms: Card is fully revealed. Show the Enter button.
    
    setTimeout(() => {
      setShowEnterButton(true);
    }, 2500);
  };

  const handleEnter = () => {
    onOpen(); // Parent content starts fading in
    setIsFadingOut(true); // This component starts fading out

    setTimeout(() => {
      onComplete(); // Remove from DOM
    }, 2000);
  };

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-center overflow-hidden bg-stone-100 transition-opacity duration-[2000ms] ease-in-out ${isFadingOut ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
      
      {/* --- SVG Filters for Wax Realism --- */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <filter id="wax-texture" x="-20%" y="-20%" width="140%" height="140%">
            {/* Create organic height map */}
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="4" xChannelSelector="R" yChannelSelector="G" />
            <feGaussianBlur stdDeviation="0.5" result="smoothed" />
            
            {/* Lighting for 3D wax effect */}
            <feSpecularLighting in="smoothed" surfaceScale="3" specularConstant="1" specularExponent="20" lightingColor="#ffefd5" result="specular">
              <fePointLight x="-500" y="-500" z="300" />
            </feSpecularLighting>
            <feComposite in="specular" in2="SourceAlpha" operator="in" result="specular-masked" />
            
            {/* Combine for final texture */}
            <feComposite in="SourceGraphic" in2="specular-masked" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" />
          </filter>
          
          <filter id="paper-fiber">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" stitchTiles="stitch"/>
            <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0"/>
          </filter>
        </defs>
      </svg>

      {/* --- Background Texture & Lighting --- */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" 
           style={{ filter: 'url(#paper-fiber)' }} />
      <div className="absolute inset-0 bg-gradient-to-b from-white/60 via-transparent to-stone-200/40 pointer-events-none" />
      
      {/* --- Main Envelope Assembly --- */}
      <div className={`relative w-[320px] md:w-[400px] h-[480px] md:h-[600px] perspective-1000 transition-transform duration-[1500ms] ease-in-out ${isOpening ? 'scale-110 translate-y-4' : 'animate-float'}`}>
        
        {/* 1. The Invitation Card (Bottom Layer) */}
        <div className={`absolute inset-0 bg-white shadow-2xl rounded-sm flex items-center justify-center overflow-hidden transition-all duration-[2000ms] ease-[cubic-bezier(0.25,1,0.5,1)] delay-[1200ms] ${isOpening ? 'transform -translate-y-16 scale-[1.05] shadow-[0_30px_60px_-12px_rgba(0,0,0,0.2)]' : 'shadow-md'}`}>
          {inviteImage ? (
            <div className="relative w-full h-full">
              <img src={inviteImage} alt="Invitation" className="w-full h-full object-cover" />
              
              {/* Title Selection Overlay - Matched to GuestView */}
              <div 
                  className="absolute left-0 right-0 text-center flex items-center justify-center px-4"
                  style={{
                    top: '49%', 
                    transform: 'translateY(-50%)', 
                  }}
                >
                  {/* Updated: md:gap-[2px] is 2px */}
                  <div className="flex flex-wrap justify-center gap-[4px] md:gap-[2px] font-serif font-medium"
                       style={{
                         fontSize: 'clamp(9px, 2vw, 14px)', 
                         color: 'transparent',
                         textShadow: 'none',
                         letterSpacing: '0.1em'
                       }}
                  >
                    {titleOptions.map((option, index) => (
                      <React.Fragment key={option}>
                        <span className="relative inline-block">
                          {option}
                          {/* Strikethrough if title is set and doesn't match this option */}
                          {guestTitle && guestTitle !== option && (
                            <span className="absolute -left-[1.5px] right-[1.5px] top-[55%] h-[1.5px] bg-wedding-charcoal opacity-80 -translate-y-1/2 transform -rotate-2" />
                          )}
                        </span>
                        {index < titleOptions.length - 1 && <span>/</span>}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

              {/* Name Overlay in Animation - Matched to GuestView */}
              <div 
                className="absolute left-0 right-0 text-center flex items-center justify-center px-4"
                style={{
                  top: '52%',
                  transform: 'translateY(-50%)',
                }}
              >
                <span 
                  className="font-serif text-wedding-gold tracking-wide capitalize font-bold"
                  style={{
                    // Reverted base size from 15px to 13.5px
                    fontSize: 'clamp(13.5px, 2.6vw, 22px)',
                    textShadow: '0 0 1px rgba(255,255,255,0.4)'
                  }}
                >
                  {guestName}
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center p-8 border-4 border-double border-wedding-gold/30 m-4 h-[90%] flex flex-col justify-center bg-wedding-ivory w-full">
              <p className="font-serif text-3xl text-wedding-gold mb-2">Save the Date</p>
              
              {/* Fallback Title Selection */}
              <div className="flex flex-wrap justify-center gap-2 mb-2 font-serif text-sm text-wedding-stone/80">
                  {titleOptions.map((option, index) => (
                    <React.Fragment key={option}>
                      <span className="relative inline-block">
                        {option}
                        {guestTitle && guestTitle !== option && (
                          <span className="absolute -left-[1.5px] right-[1.5px] top-1/2 h-[1px] bg-wedding-charcoal opacity-60 -translate-y-1/2" />
                        )}
                      </span>
                      {index < titleOptions.length - 1 && <span>/</span>}
                    </React.Fragment>
                  ))}
              </div>

              <div className="border-b border-dotted border-wedding-stone/50 w-full my-4 relative h-6">
                 <span className="absolute -top-4 left-0 right-0 text-wedding-charcoal font-serif font-bold">{guestName}</span>
              </div>
              <p className="font-serif text-xl text-wedding-stone mt-4">Official Invitation</p>
            </div>
          )}
          {/* Shine effect on card reveal */}
          <div className={`absolute inset-0 bg-gradient-to-tr from-transparent via-white/30 to-transparent transition-transform duration-[2000ms] ease-out delay-[1500ms] ${isOpening ? 'translate-x-[150%]' : '-translate-x-[150%]'}`} />
        </div>

        {/* 2. Oil Paper Wrappers (Middle Layer) */}
        {/* Left Flap */}
        <div className={`absolute inset-y-0 left-0 w-1/2 bg-white/90 backdrop-blur-[2px] shadow-lg origin-left transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] delay-[600ms] z-20 border-r border-stone-100/50 ${isOpening ? 'rotate-y-[-160deg] opacity-0' : 'rotate-y-0 opacity-100'}`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')]" />
        </div>
        
        {/* Right Flap */}
        <div className={`absolute inset-y-0 right-0 w-1/2 bg-white/90 backdrop-blur-[2px] shadow-lg origin-right transition-all duration-[2000ms] ease-[cubic-bezier(0.4,0,0.2,1)] delay-[600ms] z-20 border-l border-stone-100/50 ${isOpening ? 'rotate-y-[160deg] opacity-0' : 'rotate-y-0 opacity-100'}`}>
          <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/rice-paper.png')]" />
        </div>

        {/* 3. Silk Ribbon (Top Layer) */}
        {/* Horizontal Band */}
        <div className={`absolute top-1/2 left-0 right-0 h-10 md:h-12 -mt-6 z-30 flex items-center justify-center transition-all duration-[1200ms] ease-in-out delay-[200ms] ${isOpening ? 'opacity-0 translate-x-full scale-x-50' : 'opacity-95'}`}>
          <div className="w-full h-full bg-[#E6D4D4] shadow-md border-t border-b border-white/20" />
        </div>
        
        {/* Vertical Band */}
        <div className={`absolute top-0 bottom-0 left-1/2 w-8 md:w-10 -ml-4 z-20 flex flex-col items-center transition-all duration-[1200ms] ease-in-out delay-[200ms] ${isOpening ? 'opacity-0 -translate-y-full scale-y-50' : 'opacity-95'}`}>
           <div className="h-full w-full bg-[#E6D4D4] shadow-md border-l border-r border-white/20" />
        </div>

        {/* 4. Hyper-Realistic Wax Seal (Top-most) */}
        <div className={`absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-40 transition-all duration-1000 ease-in ${isOpening ? 'opacity-0 scale-125 pointer-events-none blur-sm' : 'opacity-100 scale-100'}`}>
          <div className="relative group cursor-pointer" onClick={handleOpen}>
            
            {/* The Seal Body with Organic Shape and Filter */}
            <div 
              className="w-20 h-20 md:w-24 md:h-24 relative flex items-center justify-center shadow-xl transition-transform duration-300 group-hover:scale-105"
              style={{
                borderRadius: '42% 58% 48% 52% / 55% 45% 55% 45%', // Organic blob shape
                background: 'radial-gradient(circle at 35% 35%, #D4AF37, #AA8C2C 60%, #755C1B 100%)',
                boxShadow: 'inset 2px 2px 6px rgba(255,255,255,0.4), inset -2px -2px 6px rgba(0,0,0,0.3), 3px 6px 15px rgba(0,0,0,0.3)',
                filter: 'url(#wax-texture)'
              }}
            >
              {/* Inner Rim (Pressed Effect) */}
              <div 
                className="w-14 h-14 md:w-16 md:h-16 rounded-full flex items-center justify-center"
                style={{
                  border: '2px solid rgba(117, 92, 27, 0.4)',
                  boxShadow: 'inset 2px 2px 4px rgba(0,0,0,0.2), 1px 1px 2px rgba(255,255,255,0.3)'
                }}
              >
                 {/* Icon (Pressed into wax) */}
                 <div style={{ filter: 'drop-shadow(1px 1px 0px rgba(255,255,255,0.3)) drop-shadow(-1px -1px 0px rgba(0,0,0,0.3))' }}>
                   <Icons.Heart className="w-8 h-8 md:w-10 md:h-10 text-[#5C491F]" fill="currentColor" fillOpacity="0.2" />
                 </div>
              </div>
            </div>
            
            {/* Ribbon Knot under seal */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#Dbbcb9] rotate-45 -z-10 shadow-md rounded-sm" />
          </div>
        </div>

      </div>

      {/* --- Action Area: Title (Top) --- */}
      <div className={`absolute top-16 md:top-24 z-50 w-full flex justify-center transition-all duration-1000 ${isOpening ? 'opacity-0 -translate-y-8' : 'opacity-100 translate-y-0'}`}>
        <div className="text-center animate-pulse">
           <p className="font-serif text-xl md:text-2xl text-wedding-charcoal tracking-wide">Tap to open the invitation</p>
        </div>
      </div>
      
      {/* --- Action Area: Button (Bottom) - REMOVED --- */}

       {/* --- Action Area: Enter Button (Appears after opening) --- */}
       <div className={`absolute bottom-12 md:bottom-20 z-50 w-full flex justify-center transition-all duration-1000 ${showEnterButton ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8 pointer-events-none'}`}>
        <button
          onClick={handleEnter}
          className="group relative px-8 py-3 bg-wedding-gold text-white font-serif tracking-widest uppercase text-sm rounded-full overflow-hidden shadow-lg hover:shadow-xl transition-all border border-white/20"
        >
          <span className="relative z-10 group-hover:text-white transition-colors duration-500">See Details</span>
          <div className="absolute inset-0 bg-wedding-charcoal transform scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]" />
        </button>
      </div>

    </div>
  );
};
