export default function HomePage() {
  return (
    <main className="relative min-h-screen overflow-hidden text-white">
      <div className="absolute inset-0 bg-cover bg-center opacity-90" style={{ backgroundImage: "url('/BACKGROUND2.jpg')" }} />
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.30),rgba(0,0,0,0.92))]" />
      <div className="relative z-10 px-6 py-20 lg:px-12">
        <style>{`
          @keyframes hero-slide-up {
            from { opacity: 0; transform: translateY(32px); }
            to { opacity: 1; transform: translateY(0); }
          }
          .slide-up {
            animation: hero-slide-up 1s ease-out forwards;
          }
          .slide-up-delay {
            animation: hero-slide-up 1s ease-out 0.2s forwards;
          }
          .slide-up-delay-2 {
            animation: hero-slide-up 1s ease-out 0.35s forwards;
          }
        `}</style>
        <div className="mx-auto max-w-6xl">
         
          <h1 className="slide-up-delay mt-8 text-5xl font-black tracking-tight text-slate-100 sm:text-6xl opacity-0">
           ASRT.CO
          </h1>
          {/* <p className="slide-up-delay-2 mt-6 max-w-3xl text-lg leading-8 text-slate-300 sm:text-xl opacity-0">
            Competitive sim racing platform. Championships, verified leaderboards and race craft — built for drivers who chase tenths.
          </p> */}
          <div className="slide-up-delay-2 mt-10 flex flex-col gap-4 sm:flex-row sm:items-center opacity-0">
            <a
              href="#events"
              className="inline-flex items-center justify-center rounded-full bg-cyan-400 px-8 py-3 text-sm font-semibold text-slate-950 shadow-[0_30px_60px_-30px_rgba(56,189,248,0.85)] transition duration-200 hover:bg-cyan-300"
            >
              View Events
            </a>
            <a
              href="#leaderboard"
              className="inline-flex items-center justify-center rounded-full border border-white/10 bg-white/5 px-8 py-3 text-sm font-semibold text-slate-100 transition duration-200 hover:bg-white/10"
            >
              Leaderboard
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}
