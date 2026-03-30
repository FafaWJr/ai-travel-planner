'use client';
import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (navRef.current) {
        navRef.current.style.boxShadow =
          window.scrollY > 10 ? '0 2px 16px rgba(0,68,123,0.08)' : 'none';
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box}
        :root{
          --orange:#FF8210;
          --navy:#00447B;
          --orange-light:#FFBD59;
          --navy-mid:#679AC1;
          --gray-dark:#6C6D6F;
          --gray-light:#C0C0C0;
          --bg-soft:#F7F5F2;
          --bg-navy-tint:#EEF4FB;
        }
        html{scroll-behavior:smooth}
        body{font-family:'Lato',sans-serif;font-weight:400;color:#333;overflow-x:hidden}
        h1,h2,h3,h4{font-family:'Poppins',sans-serif;font-weight:500}
        /* NAVBAR */
        nav{position:sticky;top:0;z-index:100;background:white;border-bottom:0.5px solid rgba(0,68,123,0.08);padding:0 60px}
        .nav-inner{display:flex;align-items:center;justify-content:space-between;height:68px}
        .nav-logo img{height:50px;width:auto;display:block}
        .nav-links{display:flex;gap:28px;align-items:center}
        .nav-links a{font-family:'Lato',sans-serif;font-size:14px;color:var(--gray-dark);text-decoration:none;font-weight:400;transition:color .2s}
        .nav-links a:hover{color:var(--orange)}
        .nav-links a.active{color:var(--navy);font-weight:700;border-bottom:2px solid var(--orange);padding-bottom:2px}
        .nav-actions{display:flex;gap:10px;align-items:center}
        .btn-login{background:transparent;color:var(--navy);border:1.5px solid var(--navy);border-radius:22px;padding:8px 20px;font-family:'Lato',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;text-decoration:none;display:inline-block}
        .btn-login:hover{background:var(--navy);color:white}
        .btn-plan{background:var(--orange);color:white;border:1.5px solid var(--orange);border-radius:22px;padding:8px 20px;font-family:'Lato',sans-serif;font-size:14px;font-weight:700;cursor:pointer;transition:all .2s;text-decoration:none;display:inline-block}
        .btn-plan:hover{background:#e06e00;border-color:#e06e00}
        /* HERO */
        @keyframes heroFade{0%,28%{opacity:1}33%,95%{opacity:0}100%{opacity:1}}
        @keyframes kenburns{0%{transform:scale(1) translate(0,0)}100%{transform:scale(1.08) translate(-1%,-1%)}}
        .hero{padding:110px 60px 80px;text-align:center;position:relative;overflow:hidden;min-height:92vh;display:flex;flex-direction:column;align-items:center;justify-content:center}
        .hero-bg{position:absolute;inset:0;background-size:cover;background-position:center;animation:heroFade 24s infinite,kenburns 24s ease-in-out infinite alternate}
        .hero-bg:nth-child(2){animation-delay:6s}
        .hero-bg:nth-child(3){animation-delay:12s}
        .hero-bg:nth-child(4){animation-delay:18s}
        .hero-overlay{position:absolute;inset:0;background:rgba(0,20,50,0.58);z-index:1}
        .hero-content{position:relative;z-index:2}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,189,89,0.15);border:1px solid rgba(255,189,89,0.4);border-radius:22px;padding:6px 18px;margin-bottom:36px}
        .hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--orange);flex-shrink:0}
        .hero-badge span{color:var(--orange-light);font-size:13px;font-weight:700;font-family:'Lato',sans-serif}
        .hero-title{font-size:78px;font-weight:500;line-height:0.95;letter-spacing:-2px;margin-bottom:0}
        .hero-title .navy{color:white}
        .hero-title .orange{color:var(--orange);font-style:italic}
        .hero-sub{font-family:'Lato',sans-serif;font-size:18px;font-weight:300;color:rgba(255,255,255,0.82);line-height:1.7;max-width:520px;margin:28px auto 36px}
        .hero-pills{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:40px}
        .hero-pill{border-radius:22px;padding:10px 20px}
        .hero-pill.blue{background:rgba(255,255,255,0.1);border:1px solid rgba(255,255,255,0.2)}
        .hero-pill.orange{background:rgba(255,130,16,0.2);border:1px solid rgba(255,130,16,0.4)}
        .hero-pill .pill-title{font-family:'Poppins',sans-serif;font-size:13px;font-weight:500;color:white}
        .hero-pill.orange .pill-title{color:var(--orange-light)}
        .hero-pill .pill-sub{font-family:'Lato',sans-serif;font-size:11px;color:rgba(255,255,255,0.55);margin-top:1px}
        .hero-pill.orange .pill-sub{color:rgba(255,189,89,0.85)}
        .btn-letsgo{background:var(--orange);color:white;border:none;border-radius:50px;padding:18px 56px;font-family:'Poppins',sans-serif;font-size:18px;font-weight:500;cursor:pointer;letter-spacing:0.02em;display:inline-block;text-decoration:none;transition:background .2s;margin-bottom:48px}
        .btn-letsgo:hover{background:#e06e00}
        .see-more{color:rgba(255,255,255,0.4);font-family:'Lato',sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px}
        .see-more-arrow{color:rgba(255,255,255,0.4);font-size:22px;line-height:1}
        /* SECTION COMMON */
        .section{padding:80px 60px}
        .section-label{font-family:'Lato',sans-serif;font-size:12px;font-weight:700;color:var(--orange);letter-spacing:0.12em;text-transform:uppercase;border-bottom:2px solid var(--orange);display:inline-block;padding-bottom:3px;margin-bottom:16px}
        .section-title{font-size:40px;font-weight:500;color:var(--navy);margin-bottom:12px;letter-spacing:-0.5px}
        .section-sub{font-family:'Lato',sans-serif;font-size:17px;font-weight:300;color:var(--gray-dark);line-height:1.65;max-width:560px}
        .section-sub.centered{margin:0 auto}
        /* HOW IT WORKS */
        .how{background:var(--bg-soft);text-align:center}
        .how .section-title,.how .section-label,.how .section-sub{text-align:center}
        .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:52px}
        .step-card{background:white;border-radius:16px;padding:36px 28px;border:0.5px solid rgba(0,68,123,0.08);text-align:left}
        .step-num{width:36px;height:36px;border-radius:50%;background:var(--orange);color:white;font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .step-card h3{font-size:20px;font-weight:500;color:var(--navy);margin-bottom:10px}
        .step-card p{font-family:'Lato',sans-serif;font-size:15px;font-weight:300;color:var(--gray-dark);line-height:1.65}
        /* FEATURES */
        .features{background:white}
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:52px}
        .feat-card{background:var(--bg-soft);border-radius:14px;padding:28px 24px;border:0.5px solid rgba(0,68,123,0.06)}
        .feat-icon{width:44px;height:44px;margin-bottom:14px}
        .feat-card h3{font-size:18px;font-weight:500;color:var(--navy);margin-bottom:8px}
        .feat-card p{font-family:'Lato',sans-serif;font-size:14px;font-weight:300;color:var(--gray-dark);line-height:1.6}
        /* YOUR WAY */
        .yourway{background:var(--bg-navy-tint)}
        .yourway-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;margin-top:40px}
        .yourway-points{display:flex;flex-direction:column;gap:20px;margin-top:12px}
        .yw-point{display:flex;gap:14px;align-items:flex-start}
        .yw-dot{width:10px;height:10px;border-radius:50%;background:var(--orange);flex-shrink:0;margin-top:6px}
        .yw-point h4{font-size:16px;font-weight:500;color:var(--navy);margin-bottom:4px}
        .yw-point p{font-family:'Lato',sans-serif;font-size:14px;font-weight:300;color:var(--gray-dark);line-height:1.6}
        .yourway-visual{background:white;border-radius:16px;padding:32px;border:0.5px solid rgba(0,68,123,0.1)}
        .chat-bubble{background:var(--bg-navy-tint);border-radius:12px 12px 12px 2px;padding:14px 18px;margin-bottom:10px;font-family:'Lato',sans-serif;font-size:14px;color:var(--navy);font-weight:400;max-width:90%;line-height:1.5}
        .chat-bubble.luna{background:var(--navy);color:white;border-radius:12px 12px 2px 12px;margin-left:auto}
        .chat-label{font-family:'Lato',sans-serif;font-size:11px;color:var(--gray-light);margin-bottom:6px;font-weight:400}
        .chat-label.luna{text-align:right}
        /* MEET LUNA */
        .meet-luna{background:var(--navy);padding:80px 60px}
        .meet-luna-inner{display:grid;grid-template-columns:380px 1fr;gap:60px;align-items:center;max-width:1100px;margin:0 auto}
        .luna-avatar-wrap{display:flex;justify-content:center}
        .luna-avatar-wrap img{height:440px;width:auto;mix-blend-mode:screen;filter:brightness(1.05)}
        .luna-copy .section-label{color:var(--orange-light);border-color:var(--orange-light)}
        .luna-copy .section-title{color:white;font-size:44px;line-height:1.1}
        .luna-copy .section-sub{color:rgba(255,255,255,0.65);max-width:100%}
        .luna-features{display:flex;flex-direction:column;gap:14px;margin-top:28px}
        .luna-feat{display:flex;gap:12px;align-items:flex-start}
        .luna-feat-check{width:20px;height:20px;border-radius:50%;background:var(--orange);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px}
        .luna-feat-check::after{content:'';width:6px;height:10px;border-right:2px solid white;border-bottom:2px solid white;transform:rotate(45deg) translate(-1px,-1px)}
        .luna-feat p{font-family:'Lato',sans-serif;font-size:15px;font-weight:300;color:rgba(255,255,255,0.75);line-height:1.55}
        .luna-feat strong{color:white;font-weight:700}
        .btn-letsgo-white{background:var(--orange);color:white;border:none;border-radius:50px;padding:16px 44px;font-family:'Poppins',sans-serif;font-size:16px;font-weight:500;cursor:pointer;display:inline-block;text-decoration:none;margin-top:32px;transition:background .2s}
        .btn-letsgo-white:hover{background:#e06e00}
        /* TRIP IDEAS */
        .trip-ideas{background:white}
        .ideas-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:52px}
        .idea-card{border-radius:16px;overflow:hidden;border:0.5px solid rgba(0,68,123,0.1)}
        .idea-img{height:200px;background:var(--bg-navy-tint);position:relative;overflow:hidden}
        .idea-img-bg{position:absolute;inset:0;display:flex;align-items:flex-end;padding:16px}
        .idea-tag{display:inline-block;background:var(--orange);color:white;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:10px}
        .idea-body{padding:20px}
        .idea-body h3{font-size:20px;font-weight:500;color:var(--navy);margin-bottom:4px}
        .idea-body .days{font-family:'Lato',sans-serif;font-size:13px;color:var(--gray-dark);font-weight:300;margin-bottom:10px}
        .idea-tags{display:flex;gap:6px;flex-wrap:wrap}
        .tag{background:#EEF4FB;color:var(--navy);font-family:'Lato',sans-serif;font-size:11px;font-weight:400;padding:4px 10px;border-radius:8px}
        /* PERSONA */
        .persona{background:#FFF8F0;text-align:center;padding:80px 60px}
        .persona-cards{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:40px 0}
        .persona-card{background:white;border-radius:12px;padding:18px 28px;border:1.5px solid rgba(0,68,123,0.15);min-width:140px;text-align:center;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:10px}
        .persona-card:hover{border-color:var(--orange);background:var(--orange);transform:translateY(-2px)}
        .persona-card .p-name{font-family:'Poppins',sans-serif;font-size:14px;font-weight:500;color:var(--navy);transition:color .2s}
        .persona-card:hover .p-name{color:white}
        /* FINAL CTA */
        .final-cta{background:var(--orange);padding:80px 60px;text-align:center}
        .final-cta h2{font-size:52px;font-weight:500;color:white;margin-bottom:16px;letter-spacing:-1px}
        .final-cta p{font-family:'Lato',sans-serif;font-size:18px;font-weight:300;color:rgba(255,255,255,0.85);margin-bottom:40px}
        .btn-cta-white{background:white;color:var(--orange);border:none;border-radius:50px;padding:18px 52px;font-family:'Poppins',sans-serif;font-size:18px;font-weight:500;cursor:pointer;text-decoration:none;display:inline-block;transition:all .2s}
        .btn-cta-white:hover{background:#FFF5EC}
        /* FOOTER */
        footer{background:var(--navy);padding:60px 60px 32px;color:rgba(255,255,255,0.65)}
        .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}
        .footer-brand img{height:38px;margin-bottom:16px}
        .footer-brand p{font-family:'Lato',sans-serif;font-size:14px;font-weight:300;line-height:1.65;color:rgba(255,255,255,0.5);max-width:260px}
        .footer-col h4{font-family:'Poppins',sans-serif;font-size:14px;font-weight:500;color:white;margin-bottom:16px}
        .footer-col a{display:block;font-family:'Lato',sans-serif;font-size:14px;font-weight:300;color:rgba(255,255,255,0.55);text-decoration:none;margin-bottom:9px;transition:color .2s}
        .footer-col a:hover{color:var(--orange-light)}
        .footer-bottom{border-top:0.5px solid rgba(255,255,255,0.1);padding-top:24px;display:flex;justify-content:space-between;align-items:center}
        .footer-bottom p{font-family:'Lato',sans-serif;font-size:13px;font-weight:300;color:rgba(255,255,255,0.35)}
        .social-links{display:flex;gap:14px}
        .social-links a{color:rgba(255,255,255,0.35);text-decoration:none;font-family:'Lato',sans-serif;font-size:13px;transition:color .2s}
        .social-links a:hover{color:var(--orange-light)}
        /* RESPONSIVE */
        @media(max-width:900px){
          nav{padding:0 24px}
          .nav-links{display:none}
          .hero{padding:80px 24px 60px}
          .hero-title{font-size:48px}
          .section{padding:60px 24px}
          .steps{grid-template-columns:1fr}
          .features-grid{grid-template-columns:1fr 1fr}
          .yourway-grid{grid-template-columns:1fr;gap:32px}
          .meet-luna{padding:60px 24px}
          .meet-luna-inner{grid-template-columns:1fr;gap:32px}
          .luna-avatar-wrap img{height:280px}
          .ideas-grid{grid-template-columns:1fr 1fr}
          .final-cta{padding:60px 24px}
          .final-cta h2{font-size:36px}
          footer{padding:48px 24px 24px}
          .footer-grid{grid-template-columns:1fr 1fr;gap:28px}
        }
        @media(max-width:540px){
          .hero-title{font-size:36px;letter-spacing:-1px}
          .features-grid{grid-template-columns:1fr}
          .ideas-grid{grid-template-columns:1fr}
          .persona-cards{flex-direction:column;align-items:center}
          .footer-grid{grid-template-columns:1fr}
          .footer-bottom{flex-direction:column;gap:12px;text-align:center}
        }
      `}</style>

      {/* NAVBAR */}
      <nav ref={navRef}>
        <div className="nav-inner">
          <div className="nav-logo">
            <Link href="/"><img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" /></Link>
          </div>
          <div className="nav-links">
            <a href="#trip-ideas" className="active">Trip Ideas</a>
            <a href="#quiz">Quiz</a>
            <Link href="/blog">Blog</Link>
            <Link href="/deals">Deals</Link>
          </div>
          <div className="nav-actions">
            <Link href="/auth" className="btn-login">Login</Link>
            <Link href="/start" className="btn-plan">Plan a Trip</Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero" id="hero">
        <div className="hero-bg" style={{backgroundImage:"url('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=1600&q=80')"}}></div>
        <div className="hero-bg" style={{backgroundImage:"url('https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?w=1600&q=80')"}}></div>
        <div className="hero-bg" style={{backgroundImage:"url('https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=1600&q=80')"}}></div>
        <div className="hero-bg" style={{backgroundImage:"url('https://images.unsplash.com/photo-1495567720989-cebdbdd97913?w=1600&q=80')"}}></div>
        <div className="hero-overlay"></div>
        <div className="hero-content">
          <div className="hero-badge">
            <div className="hero-badge-dot"></div>
            <span>The smarter way to travel</span>
          </div>
          <h1 className="hero-title">
            <span className="navy">Your trip.<br /></span>
            <span className="orange">Your rules.</span><br />
            <span className="navy">Your way.</span>
          </h1>
          <p className="hero-sub">Not just another AI planner. Luna works with you, every step towards your perfect trip.</p>
          <div className="hero-pills">
            <div className="hero-pill blue">
              <div className="pill-title">30 seconds</div>
              <div className="pill-sub">to a full itinerary</div>
            </div>
            <div className="hero-pill orange">
              <div className="pill-title">100% personal</div>
              <div className="pill-sub">built for your tastes</div>
            </div>
            <div className="hero-pill blue">
              <div className="pill-title">Chat with Luna</div>
              <div className="pill-sub">refine as you go</div>
            </div>
            <div className="hero-pill blue">
              <div className="pill-title">Always free</div>
              <div className="pill-sub">no account needed</div>
            </div>
          </div>
          <Link href="/start" className="btn-letsgo">Let&apos;s Go &rarr;</Link>
          <div>
            <div className="see-more">See more</div>
            <div className="see-more-arrow">↓</div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how" id="how-it-works">
        <div className="section-label">How it works</div>
        <h2 className="section-title">As easy as 1, 2, 3</h2>
        <p className="section-sub centered">Tell us where you want to go. Luna handles everything else, in seconds.</p>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>Tell Luna where you want to go</h3>
            <p>Type your destination, travel dates, and who you are travelling with. That is all it takes to get started.</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>Get a full personalised plan</h3>
            <p>Luna builds your complete itinerary with activities, stays, budget breakdown, weather tips, and local transport options.</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>Refine, save, and go</h3>
            <p>Chat with Luna to tweak anything. Swap days, add ideas, change your style. Save your trip and head out with confidence.</p>
          </div>
        </div>
      </section>

      {/* EVERYTHING IN EVERY PLAN */}
      <section className="section features" id="features">
        <div className="section-label">What you get</div>
        <h2 className="section-title">Everything in every plan</h2>
        <p className="section-sub">Every trip Luna builds comes fully loaded. No upgrades, no paywalls, no surprises.</p>
        <div className="features-grid">
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#EEF4FB" />
              <rect x="12" y="10" width="20" height="24" rx="3" stroke="#00447B" strokeWidth="1.5" />
              <line x1="16" y1="16" x2="28" y2="16" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="20" x2="28" y2="20" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
              <line x1="16" y1="24" x2="22" y2="24" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <h3>Day-by-day itinerary</h3>
            <p>A full schedule with timings, activity descriptions, insider tips, and local recommendations tailored to your style.</p>
          </div>
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FFF5EC" />
              <rect x="10" y="16" width="24" height="16" rx="3" stroke="#FF8210" strokeWidth="1.5" />
              <path d="M15 16v-3a7 7 0 0 1 14 0v3" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="22" cy="24" r="2" fill="#FF8210" />
            </svg>
            <h3>Hotel suggestions</h3>
            <p>Curated stay options matched to your budget and location preferences, near the activities in your plan.</p>
          </div>
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#EEF4FB" />
              <circle cx="22" cy="20" r="8" stroke="#00447B" strokeWidth="1.5" />
              <path d="M18 20c0-2.2 1.8-4 4-4" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22 32v2" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
              <path d="M14 22l-2 2" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
              <path d="M30 22l2 2" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <h3>Weather and seasons</h3>
            <p>Know what to expect and what to pack. Luna factors in seasonal weather and events so there are no unpleasant surprises.</p>
          </div>
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FFF5EC" />
              <circle cx="14" cy="30" r="3" stroke="#FF8210" strokeWidth="1.5" />
              <circle cx="30" cy="30" r="3" stroke="#FF8210" strokeWidth="1.5" />
              <path d="M8 28h4v-6h16v6h4" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>Getting around</h3>
            <p>Transport options for every leg of your trip, from airport transfers to local taxis, trains, and everything in between.</p>
          </div>
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#EEF4FB" />
              <rect x="12" y="14" width="20" height="16" rx="3" stroke="#00447B" strokeWidth="1.5" />
              <line x1="17" y1="22" x2="17" y2="26" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="19" x2="22" y2="26" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" />
              <line x1="27" y1="20" x2="27" y2="26" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3>Budget breakdown</h3>
            <p>A clear cost estimate across accommodation, food, activities, and transport. Know what you will spend before you go.</p>
          </div>
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FFF5EC" />
              <path d="M14 28a10 10 0 1 1 16 0" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="22" cy="22" r="3" fill="#FF8210" />
              <line x1="22" y1="28" x2="22" y2="32" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>Chat with Luna</h3>
            <p>Ask Luna anything about your trip. Adjust days, add activities, get local advice. She is always one message away.</p>
          </div>
        </div>
      </section>

      {/* YOUR TRIP YOUR WAY */}
      <section className="section yourway" id="your-way">
        <div className="yourway-grid">
          <div>
            <div className="section-label">Personal by design</div>
            <h2 className="section-title">Travel made personal, your way</h2>
            <p className="section-sub">Generic itineraries are for everyone. Yours should be for you. Luna learns what you love and builds every trip around it.</p>
            <div className="yourway-points">
              <div className="yw-point">
                <div className="yw-dot"></div>
                <div>
                  <h4>Your interests, front and centre</h4>
                  <p>From street food tours to mountain hikes, Luna surfaces only what genuinely excites you.</p>
                </div>
              </div>
              <div className="yw-point">
                <div className="yw-dot"></div>
                <div>
                  <h4>Your pace, not someone else&apos;s</h4>
                  <p>Prefer slow mornings and long lunches? Or pack in every hour? Luna adapts to how you like to travel.</p>
                </div>
              </div>
              <div className="yw-point">
                <div className="yw-dot"></div>
                <div>
                  <h4>Your budget, respected</h4>
                  <p>Set your range and Luna works within it, no upsells, no surprises.</p>
                </div>
              </div>
            </div>
          </div>
          <div className="yourway-visual">
            <div className="chat-label">You</div>
            <div className="chat-bubble">I want 7 days in Japan. I love food and local markets but hate tourist traps.</div>
            <div className="chat-label luna" style={{marginTop:16}}>Luna</div>
            <div className="chat-bubble luna">Perfect. I&apos;ll build your Tokyo itinerary around Tsukiji outer market, hidden izakayas in Shimokitazawa, and a day trip to Nikko. No tourist traps, promise.</div>
            <div className="chat-label" style={{marginTop:16}}>You</div>
            <div className="chat-bubble">Can you make day 3 more relaxed? Maybe a morning at an onsen?</div>
            <div className="chat-label luna" style={{marginTop:16}}>Luna</div>
            <div className="chat-bubble luna">Done. I&apos;ve swapped day 3 to include a morning at Oedo-Onsen Monogatari and a gentle afternoon at Yanaka, one of Tokyo&apos;s most charming old neighbourhoods.</div>
          </div>
        </div>
      </section>

      {/* MEET LUNA */}
      <section className="meet-luna" id="meet-luna">
        <div className="meet-luna-inner">
          <div className="luna-avatar-wrap">
            <img src="/luna_extracted_1.jpeg" alt="Luna, your AI travel companion" />
          </div>
          <div className="luna-copy">
            <div className="section-label">Meet Luna</div>
            <h2 className="section-title">This isn&apos;t just another AI planner.</h2>
            <p className="section-sub">Luna works with you, every step towards your perfect trip. She remembers your preferences, adapts your plan, and speaks to you, not at you.</p>
            <div className="luna-features">
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>Fully contextual.</strong> Every suggestion Luna makes is based on your complete trip, not a generic template.</p>
              </div>
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>Conversational.</strong> Chat naturally. Change your mind. Luna keeps up without losing context.</p>
              </div>
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>End-to-end.</strong> From itinerary to budget to stays and transport, Luna covers every detail in one plan.</p>
              </div>
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>Always free.</strong> No subscriptions, no paywalls. Luna is yours from the very first message.</p>
              </div>
            </div>
            <Link href="/start" className="btn-letsgo-white">Plan with Luna &rarr;</Link>
          </div>
        </div>
      </section>

      {/* TRIP IDEAS */}
      <section className="section trip-ideas" id="trip-ideas">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:52}}>
          <div>
            <div className="section-label">Inspiration</div>
            <h2 className="section-title" style={{marginBottom:0}}>Trip ideas to get you started</h2>
          </div>
          <Link href="/trip-ideas" style={{fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700,color:'var(--orange)',textDecoration:'none'}}>See all ideas &rarr;</Link>
        </div>
        <div className="ideas-grid">
          <div className="idea-card">
            <div className="idea-img" style={{backgroundImage:"url('https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=600&q=80')",backgroundSize:'cover',backgroundPosition:'center'}}>
              <div className="idea-img-bg"><span className="idea-tag">Culture</span></div>
            </div>
            <div className="idea-body">
              <h3>Tokyo, Japan</h3>
              <div className="days">7 days</div>
              <div className="idea-tags">
                <span className="tag">Food</span><span className="tag">Markets</span><span className="tag">Art</span><span className="tag">History</span>
              </div>
            </div>
          </div>
          <div className="idea-card">
            <div className="idea-img" style={{backgroundImage:"url('https://images.unsplash.com/photo-1548707309-dcebeab9ea9b?w=600&q=80')",backgroundSize:'cover',backgroundPosition:'center'}}>
              <div className="idea-img-bg"><span className="idea-tag">Trending</span></div>
            </div>
            <div className="idea-body">
              <h3>Lisbon, Portugal</h3>
              <div className="days">5 days</div>
              <div className="idea-tags">
                <span className="tag">History</span><span className="tag">Food</span><span className="tag">Sunsets</span>
              </div>
            </div>
          </div>
          <div className="idea-card">
            <div className="idea-img" style={{backgroundImage:"url('https://images.unsplash.com/photo-1537996194471-e657df975ab4?w=600&q=80')",backgroundSize:'cover',backgroundPosition:'center'}}>
              <div className="idea-img-bg"><span className="idea-tag">Budget pick</span></div>
            </div>
            <div className="idea-body">
              <h3>Bali, Indonesia</h3>
              <div className="days">10 days</div>
              <div className="idea-tags">
                <span className="tag">Nature</span><span className="tag">Temples</span><span className="tag">Relax</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TRAVELLER PERSONA */}
      <section className="section persona" id="quiz">
        <div className="section-label">Find your travel style</div>
        <h2 className="section-title">What kind of traveller are you?</h2>
        <p className="section-sub centered" style={{margin:'0 auto 8px'}}>Take the 2-minute quiz and let Luna build trips matched exactly to your personality.</p>
        <div className="persona-cards">
          <div className="persona-card">
            <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}><circle cx="9" cy="9" r="9" fill="var(--orange)" /></svg>
            <div className="p-name">The Explorer</div>
          </div>
          <div className="persona-card">
            <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}><circle cx="9" cy="9" r="9" fill="var(--navy)" /></svg>
            <div className="p-name">The Foodie</div>
          </div>
          <div className="persona-card">
            <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}><circle cx="9" cy="9" r="9" fill="var(--orange)" /></svg>
            <div className="p-name">The Relaxer</div>
          </div>
          <div className="persona-card">
            <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}><circle cx="9" cy="9" r="9" fill="var(--navy)" /></svg>
            <div className="p-name">The Photographer</div>
          </div>
          <div className="persona-card">
            <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}><circle cx="9" cy="9" r="9" fill="var(--navy)" /></svg>
            <div className="p-name">The Culture Seeker</div>
          </div>
        </div>
        <Link href="/quiz" style={{display:'inline-block',background:'var(--orange)',color:'white',borderRadius:50,padding:'16px 44px',fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:500,textDecoration:'none',marginTop:8}}>Take the quiz &rarr;</Link>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="cta">
        <h2>Your next adventure starts here.</h2>
        <p>Free, personal, and built around you. No account required to get started.</p>
        <Link href="/start" className="btn-cta-white">Let&apos;s Go &rarr;</Link>
      </section>

      {/* FOOTER */}
      <footer>
        <div className="footer-grid">
          <div className="footer-brand">
            <img src="/luna_letsgo_bigger_3.PNG" alt="Luna Let's Go" />
            <p>AI-powered travel planning that feels human. Built for travellers who want something more personal.</p>
          </div>
          <div className="footer-col">
            <h4>About Us</h4>
            <Link href="/about">Our Story</Link>
            <Link href="/about#team">The Team</Link>
            <Link href="/blog">Blog</Link>
          </div>
          <div className="footer-col">
            <h4>Quick Links</h4>
            <Link href="/start">Plan a Trip</Link>
            <Link href="/trip-ideas">Trip Ideas</Link>
            <Link href="/quiz">Travel Quiz</Link>
            <Link href="/deals">Deals</Link>
          </div>
          <div className="footer-col">
            <h4>Legal</h4>
            <Link href="/privacy-policy">Privacy Policy</Link>
            <Link href="/terms-of-service">Terms of Service</Link>
            <a href="mailto:hello@lunaletsgo.com">Contact Us</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 Luna Let&apos;s Go. All rights reserved. lunaletsgo.com</p>
          <div className="social-links">
            <a href="#">Instagram</a>
            <a href="#">TikTok</a>
            <a href="#">Facebook</a>
          </div>
        </div>
      </footer>
    </>
  );
}
