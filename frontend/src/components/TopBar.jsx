import { useState, useEffect, useRef } from 'react';

const mockProfile = {
  name: 'Gowtham_Raghu K',
  email: 'gowthamkr89815',
  role: 'Engineer In Computer Science'
};

export function TopBar({ who, citizen, authority, onLogout }) {
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  const userProfile = citizen ? citizen.user : authority ? authority.authority : mockProfile;

  const toggleDropdown = () => setShowDropdown(!showDropdown);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/50 backdrop-blur-xl">
      <div className="mx-auto max-w-6xl px-4 py-4 flex items-center justify-between gap-3 relative">
        {/* Static Logo */}
        <div className="flex items-center gap-3">
          <img 
            src="/logo.png" 
            alt="CivicLink Logo" 
            className="h-11 w-11 object-contain animate-logo-pulse drop-shadow-[0_0_15px_rgba(255,255,255,0.15)]" 
          />
          <div>
            <div className="text-xl font-black leading-tight gradient-text tracking-tighter">CivicLink</div>
          </div>
        </div>

        {/* Right side: User status + Author dropdown trigger */}
        <div className="flex items-center gap-2">
          {who ? (
            <div className="hidden sm:block text-xs text-slate-200 glass rounded-xl px-3 py-2 max-w-32 truncate">{who}</div>
          ) : null}

          
          {/* Author Dropdown Trigger */}
          <div 
            className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-white font-bold text-sm cursor-pointer hover:scale-110 transition-all duration-200 shadow-lg hover:shadow-xl hover:drop-shadow-[0_0_15px_rgba(34,211,238,0.5)]" 
            onClick={toggleDropdown}
            title="About Author"
          >
            G
          </div>

          {who && (
            <button className="btn text-xs px-3 py-1.5 ml-1" onClick={onLogout}>Logout</button>
          )}
        </div>

        {/* Profile Dropdown */}
        {showDropdown && (
          <div ref={dropdownRef} className="absolute right-4 top-full mt-2 w-80 glass rounded-2xl shadow-2xl border-white/20 p-6 z-30">
            <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/10">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center font-bold text-2xl text-white shadow-2xl">
                G
              </div>
              <div>
                <div className="font-bold text-white text-lg">{userProfile.name}</div>
                <div className="text-gray-300 text-sm">{userProfile.role}</div>
              </div>
            </div>
            <div className="space-y-3 mb-6 text-sm">
              <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-all">
                <svg className="w-5 h-5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V8l8 5 8-5v10zm-8-7L4 6v2l8 5 8-5V6l-8 5z"/>
                </svg>
                <span className="text-white font-medium">{userProfile.email}</span>
              </div>
            </div>
            {!who ? (
              <div className="flex gap-2">
                <button className="btn bg-gradient-to-r from-blue-500 to-purple-600 flex-1 text-sm py-2">Citizen Login</button>
                <button className="btn bg-gradient-to-r from-purple-500 to-indigo-600 flex-1 text-sm py-2">Authority Login</button>
              </div>
            ) : (
              <button className="btn w-full text-sm py-2" onClick={onLogout}>Logout</button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

