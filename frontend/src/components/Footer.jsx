export function Footer() {
  return (
    <footer className="w-full bg-[#040406] py-16">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <div className="rounded-[2rem] border border-white/10 bg-[#0a0a0b]/80 backdrop-blur-[20px] shadow-[0_40px_120px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="grid gap-10 lg:grid-cols-[1.9fr_1fr] p-10">
            <div className="grid gap-10 lg:grid-cols-3">
              <div>
                <h3 className="text-white font-bold text-lg mb-5">Platform</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Rapid File</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Live Ledger</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Civic Insights</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-5">Support</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">About</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Documentation</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Support</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Contact Us</a></li>
                </ul>
              </div>
              <div>
                <h3 className="text-white font-bold text-lg mb-5">Connect</h3>
                <ul className="space-y-3">
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Citizen Forums</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">CivicLink.hq</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">Community</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition-colors">LinkedIn</a></li>
                </ul>
              </div>
            </div>

            <div className="rounded-[1.75rem] border border-white/10 bg-white/5 p-8 shadow-[0_30px_80px_rgba(0,0,0,0.25)]">
              <div className="text-white font-semibold text-xl mb-8">Connect with CivicLink</div>
              <div className="space-y-6">
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#0f3f86] shadow-[0_0_40px_rgba(59,130,246,0.4)] ring-2 ring-cyan-400/20">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">@CivicLinkHQ</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#1c4bb3] shadow-[0_0_40px_rgba(59,130,246,0.35)] ring-2 ring-blue-400/20">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">@CivicLinkHQ</span>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#15408f] shadow-[0_0_40px_rgba(59,130,246,0.35)] ring-2 ring-sky-400/20">
                    <svg className="w-7 h-7 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
                    </svg>
                  </div>
                  <span className="text-lg font-semibold text-transparent bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text">@CivicLinkHQ</span>
                </div>
              </div>
            </div>
          </div>

          {/* Escalation Accountability Banner */}
          <div className="bg-gradient-to-r from-red-500/10 via-transparent to-red-500/10 border-y border-red-500/30 px-10 py-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-shrink-0">
                  <div className="h-4 w-4 bg-red-500 rounded-full animate-pulse"></div>
                  <div className="h-4 w-4 bg-red-500/30 rounded-full absolute top-0 left-0 animate-ping"></div>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-red-400 font-bold">Escalation Protocol Active</p>
                  <p className="text-[11px] text-gray-400 mt-1">Direct 48-Hour Commissioner Bypass Enabled • Transparent Accountability Chain</p>
                </div>
              </div>
              
              {/* Mini Escalation Flow */}
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center text-cyan-400 text-[10px] font-bold">1</div>
                  <span className="text-gray-500 hidden sm:inline">Citizen</span>
                </div>
                <div className="h-0.5 w-4 bg-gradient-to-r from-cyan-400 to-yellow-500"></div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-yellow-500/20 border border-yellow-400/60 flex items-center justify-center text-yellow-400 text-[10px] font-bold">2</div>
                  <span className="text-gray-500 hidden sm:inline">Process</span>
                </div>
                <div className="h-0.5 w-4 bg-gradient-to-r from-yellow-500 to-red-500"></div>
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-red-500/30 border border-red-400/80 flex items-center justify-center text-red-400 text-[10px] font-bold">3</div>
                  <span className="text-gray-500 hidden sm:inline">Commissioner</span>
                </div>
              </div>
            </div>
          </div>

          {/* BBMP Authority Contact Section */}
          <div className="bg-gradient-to-r from-blue-500/10 via-transparent to-cyan-500/10 border-t border-blue-500/20 px-10 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Helpline */}
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="h-12 w-12 rounded-lg bg-blue-500/20 border border-blue-400/60 flex items-center justify-center flex-shrink-0 group-hover:bg-blue-500/40 group-hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] transition-all">
                  <svg className="w-6 h-6 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-blue-400 font-bold">BBMP 24x7 Helpline</p>
                  <p className="text-sm text-gray-300 mt-1 font-semibold group-hover:text-blue-300 transition-colors">080-22660000</p>
                </div>
              </div>

              {/* WhatsApp */}
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="h-12 w-12 rounded-lg bg-green-500/20 border border-green-400/60 flex items-center justify-center flex-shrink-0 group-hover:bg-green-500/40 group-hover:shadow-[0_0_20px_rgba(34,197,94,0.5)] transition-all">
                  <svg className="w-6 h-6 text-green-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004c-1.762 0-3.417.6-4.76 1.691l-.337.321-.349-.088c-1.23-.31-2.403-.857-3.384-1.608l-.28-.21-.306.255C1.77 6.7 1 8.399 1 10.25 1 15.556 5.384 19.85 10.8 19.85c1.659 0 3.229-.323 4.689-.923l.276-.11.287.06c1.231.27 2.42.764 3.426 1.462l.252.195.337-.265c1.257-1.06 2.216-2.408 2.766-3.98l.146-.464-.471-.226c-1.075-.516-2.084-1.19-2.964-2.015l-.383-.36-.469.088c-.533.1-1.084.14-1.637.14z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-green-400 font-bold">BBMP WhatsApp</p>
                  <p className="text-sm text-gray-300 mt-1 font-semibold group-hover:text-green-300 transition-colors">9480685700</p>
                </div>
              </div>

              {/* Email */}
              <div className="flex items-start gap-4 group cursor-pointer">
                <div className="h-12 w-12 rounded-lg bg-cyan-500/20 border border-cyan-400/60 flex items-center justify-center flex-shrink-0 group-hover:bg-cyan-500/40 group-hover:shadow-[0_0_20px_rgba(34,211,238,0.5)] transition-all">
                  <svg className="w-6 h-6 text-cyan-400" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-xs uppercase tracking-widest text-cyan-400 font-bold">Commissioner's Office</p>
                  <p className="text-sm text-gray-300 mt-1 font-semibold group-hover:text-cyan-300 transition-colors break-all">comm@bbmp.gov.in</p>
                </div>
              </div>
            </div>

            {/* Divider Text */}
            <div className="mt-6 pt-6 border-t border-white/10 text-center">
              <p className="text-xs text-gray-500">BBMP - Bruhat Bengaluru Mahanagara Palike | Direct Municipal Authority Contact</p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
