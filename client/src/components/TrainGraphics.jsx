import React from 'react';

// Crisp Railway Vector Logo / Locomotive Front
export function TrainLocomotiveIcon({ className = "w-6 h-6", color = "currentColor" }) {
  return (
    <svg 
      viewBox="0 0 64 64" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Train Body */}
      <path 
        d="M14 16C14 10.4772 18.4772 6 24 6H40C45.5228 6 50 10.4772 50 16V44C50 48.4183 46.4183 52 42 52H22C17.5817 52 14 48.4183 14 44V16Z" 
        fill="#0b1e3b" 
        stroke={color} 
        strokeWidth="2.5" 
      />
      {/* Aerodynamic Windshield */}
      <path 
        d="M20 14C20 12.8954 20.8954 12 22 12H42C43.1046 12 44 12.8954 44 14V26H20V14Z" 
        fill="#38bdf8" 
        fillOpacity="0.85" 
      />
      {/* Front Nose & Headlight Center */}
      <circle cx="32" cy="36" r="4.5" fill="#f59e0b" stroke="#ffffff" strokeWidth="1.5" />
      {/* Side Headlights */}
      <circle cx="21" cy="44" r="2.5" fill="#ffffff" />
      <circle cx="43" cy="44" r="2.5" fill="#ffffff" />
      {/* Pilot / Cowcatcher Grill */}
      <path d="M22 52L16 60H48L42 52H22Z" fill="#334155" />
      <line x1="26" y1="52" x2="24" y2="58" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="32" y1="52" x2="32" y2="58" stroke="#ffffff" strokeWidth="1.5" />
      <line x1="38" y1="52" x2="40" y2="58" stroke="#ffffff" strokeWidth="1.5" />
    </svg>
  );
}

// Ticket Authentication Barcode Graphic
export function TicketBarcode({ number = "INC-1001", className = "h-8" }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 160 36" className="w-full h-7" preserveAspectRatio="none">
        <rect x="0" y="0" width="3" height="36" fill="#0b1e3b" />
        <rect x="5" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="10" y="0" width="5" height="36" fill="#0b1e3b" />
        <rect x="18" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="23" y="0" width="4" height="36" fill="#0b1e3b" />
        <rect x="30" y="0" width="1" height="36" fill="#0b1e3b" />
        <rect x="34" y="0" width="6" height="36" fill="#0b1e3b" />
        <rect x="43" y="0" width="3" height="36" fill="#0b1e3b" />
        <rect x="49" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="54" y="0" width="5" height="36" fill="#0b1e3b" />
        <rect x="62" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="67" y="0" width="4" height="36" fill="#0b1e3b" />
        <rect x="74" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="79" y="0" width="5" height="36" fill="#0b1e3b" />
        <rect x="87" y="0" width="3" height="36" fill="#0b1e3b" />
        <rect x="93" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="98" y="0" width="6" height="36" fill="#0b1e3b" />
        <rect x="107" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="112" y="0" width="4" height="36" fill="#0b1e3b" />
        <rect x="119" y="0" width="3" height="36" fill="#0b1e3b" />
        <rect x="125" y="0" width="5" height="36" fill="#0b1e3b" />
        <rect x="133" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="138" y="0" width="4" height="36" fill="#0b1e3b" />
        <rect x="145" y="0" width="2" height="36" fill="#0b1e3b" />
        <rect x="150" y="0" width="5" height="36" fill="#0b1e3b" />
        <rect x="158" y="0" width="2" height="36" fill="#0b1e3b" />
      </svg>
      <span className="text-[9px] font-mono font-bold tracking-widest text-slate-500 uppercase mt-0.5">
        *{number}*
      </span>
    </div>
  );
}

// 9 Officer Avatars with distinct realistic colors & portraits
export function OfficerAvatar({ name = "Meera", role = "Lead", size = "md" }) {
  const sizeClasses = {
    sm: "w-7 h-7 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-base"
  };

  // High quality curated avatars for Arvo's 9 officers
  const AVATAR_MAP = {
    'Meera (Lead)': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'Meera': 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80',
    'Rahul Sharma': 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
    'Pooja Patel': 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80',
    'Arjun Nair': 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
    'Sneha Rao': 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    'Vikram Das': 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
    'Ananya Sen': 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?w=150&auto=format&fit=crop&q=80',
    'Karthik Menon': 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
    'Priya Verma': 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80'
  };

  const matchedImg = AVATAR_MAP[name] || AVATAR_MAP[name.split(' ')[0]];

  return (
    <div className={`relative rounded-full overflow-hidden border-2 border-amber-400/80 shadow-xs flex-shrink-0 bg-slate-200 ${sizeClasses[size] || sizeClasses.md}`}>
      {matchedImg ? (
        <img 
          src={matchedImg} 
          alt={name} 
          className="w-full h-full object-cover"
          onError={(e) => {
            // fallback to initials if offline
            e.target.style.display = 'none';
          }}
        />
      ) : null}
      <div className="w-full h-full flex items-center justify-center font-bold bg-[#0b1e3b] text-amber-300">
        {name.charAt(0)}
      </div>
    </div>
  );
}

// Passenger / Client Company Badges
export function CompanyBadge({ company = "Apex Logistics" }) {
  return (
    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 text-[11px] font-semibold border border-slate-300">
      <span className="w-1.5 h-1.5 rounded-full bg-[#0b1e3b]" />
      {company}
    </span>
  );
}
