import { useState } from "react";
import { TopBar } from "./components/TopBar";
import { Footer } from "./components/Footer";
import { LandingView } from "./views/LandingView";
import { CitizenAuth } from "./auth/CitizenAuth";
import { AuthorityAuth } from "./auth/AuthorityAuth";
import { CitizenApp } from "./views/CitizenApp";
import { AuthorityApp } from "./views/AuthorityApp";

export default function App() {
  const [mode, setMode] = useState("citizen");
  const [activeView, setActiveView] = useState("landing");
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const [citizen, setCitizen] = useState(() => {
    const raw = localStorage.getItem("civiclink_citizen");
    return raw ? JSON.parse(raw) : null;
  });
  const [authority, setAuthority] = useState(() => {
    const raw = localStorage.getItem("civiclink_authority");
    return raw ? JSON.parse(raw) : null;
  });

  const who = citizen ? `Citizen: ${citizen.user?.name}` : authority ? `Authority: ${authority.authority?.category}` : null;

  function logout() {
    localStorage.removeItem("civiclink_citizen");
    localStorage.removeItem("civiclink_authority");
    setCitizen(null);
    setAuthority(null);
    setActiveView("landing");
  }

  function handleModeSelect(selectedMode) {
    setIsTransitioning(true);
    setMode(selectedMode);
    setTimeout(() => {
      setActiveView(selectedMode === "citizen" ? "citizen_login" : "authority_login");
      setIsTransitioning(false);
    }, 300);
  }

  return (
    <div className="min-h-full bg-aurora relative">
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>
      <div className="blob blob-3"></div>
      
      <TopBar who={who} citizen={citizen} authority={authority} onLogout={logout} />

      
      <div className="mx-auto max-w-6xl px-4 py-10 relative z-10">
        {!citizen && !authority ? (
          <>
            {activeView === "landing" && (
              <LandingView onModeSelect={handleModeSelect} activeView={activeView} isTransitioning={isTransitioning} />
            )}
            
            {activeView === "citizen_login" && (
              <div className="max-w-lg mx-auto">
                <button className="btn mb-4" onClick={() => setActiveView("landing")}>← Back</button>
                <CitizenAuth onAuthed={(data) => {
                  localStorage.setItem("civiclink_citizen", JSON.stringify(data));
                  setCitizen(data);
                }} />
              </div>
            )}
            
            {activeView === "authority_login" && (
              <div className="max-w-lg mx-auto">
                <button className="btn mb-4" onClick={() => setActiveView("landing")}>← Back</button>
                <AuthorityAuth onAuthed={(data) => {
                  localStorage.setItem("civiclink_authority", JSON.stringify(data));
                  setAuthority(data);
                }} />
              </div>
            )}
          </>
        ) : citizen ? (
          <CitizenApp token={citizen.token} user={citizen.user} />
        ) : (
          <AuthorityApp token={authority.token} authority={authority.authority} />
        )}
      </div>
      
      <Footer />
    </div>
  );
}
