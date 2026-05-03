'use client';
import { useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import NavBar from '@/components/NavBar';

export default function HomePage() {
  const tHero = useTranslations('hero');
  const tHow = useTranslations('howItWorks');
  const tFeat = useTranslations('features');
  const tYW = useTranslations('yourway');
  const tML = useTranslations('meetLuna');
  const tPT = useTranslations('planTogether');
  const tTI = useTranslations('tripIdeas');
  const tQuiz = useTranslations('quiz');
  const tFaq = useTranslations('faq');
  const tCta = useTranslations('finalCta');
  const tPS = useTranslations('proofStrip');
  const tTL = useTranslations('talkToLuna');
  const tWL = useTranslations('whyLuna');

  const carouselRef = useRef<HTMLDivElement>(null);
  const autoPlayRef = useRef<NodeJS.Timeout | null>(null);

  const stopAutoPlay = useCallback(() => {
    if (autoPlayRef.current) { clearInterval(autoPlayRef.current); autoPlayRef.current = null; }
  }, []);

  const startAutoPlay = useCallback(() => {
    stopAutoPlay();
    autoPlayRef.current = setInterval(() => {
      const el = carouselRef.current;
      if (!el) return;
      const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4;
      if (atEnd) { el.scrollTo({ left: 0, behavior: 'smooth' }); }
      else { el.scrollBy({ left: 320, behavior: 'smooth' }); }
    }, 3500);
  }, [stopAutoPlay]);

  useEffect(() => {
    startAutoPlay();
    return () => stopAutoPlay();
  }, [startAutoPlay, stopAutoPlay]);

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
        h1,h2,h3,h4{font-family:'Poppins',sans-serif;font-weight:600}
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
        .hero-overlay{position:absolute;inset:0;background:linear-gradient(to bottom,rgba(0,0,0,0.65) 0%,rgba(0,0,0,0.55) 100%);z-index:1}
        .hero-content{position:relative;z-index:2}
        .hero-badge{display:inline-flex;align-items:center;gap:8px;background:rgba(255,189,89,0.15);border:1px solid rgba(255,189,89,0.4);border-radius:22px;padding:6px 18px;margin-bottom:36px}
        .hero-badge-dot{width:6px;height:6px;border-radius:50%;background:var(--orange);flex-shrink:0}
        .hero-badge span{color:var(--orange-light);font-size:13px;font-weight:700;font-family:'Lato',sans-serif}
        .hero-title{font-size:78px;font-weight:500;line-height:0.95;letter-spacing:-2px;margin-bottom:0}
        .hero-title .navy{color:white}
        .hero-title .orange{color:var(--orange);font-style:italic}
        .hero-sub{font-family:'Lato',sans-serif;font-size:18px;font-weight:400;color:rgba(255,255,255,0.82);line-height:1.7;max-width:520px;margin:28px auto 36px}
        .hero-pills{display:flex;justify-content:center;gap:10px;flex-wrap:wrap;margin-bottom:40px}
        .hero-pill{border-radius:12px;padding:12px 20px;background:rgba(255,255,255,0.15);backdrop-filter:blur(8px);border:1.5px solid rgba(255,255,255,0.4);box-shadow:0 4px 20px rgba(0,0,0,0.3)}
        .hero-pill.blue{background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.4)}
        .hero-pill.orange{background:rgba(255,255,255,0.15);border:1.5px solid rgba(255,255,255,0.4)}
        .hero-pill .pill-title{font-family:'Poppins',sans-serif;font-size:1.1rem;font-weight:700;color:#FF8210}
        .hero-pill.orange .pill-title{color:#FF8210}
        .hero-pill .pill-sub{font-family:'Poppins',sans-serif;font-size:11px;font-weight:600;color:white;margin-top:2px}
        .hero-pill.orange .pill-sub{color:white}
        .btn-letsgo{background:var(--orange);color:white;border:none;border-radius:50px;padding:18px 56px;font-family:'Poppins',sans-serif;font-size:18px;font-weight:500;cursor:pointer;letter-spacing:0.02em;display:inline-block;text-decoration:none;transition:background .2s;margin-bottom:10px}
        .btn-letsgo:hover{background:#e06e00}
        .hero-microcopy{font-family:'Lato',sans-serif;font-size:13px;color:rgba(255,255,255,0.5);margin-bottom:32px}
        .see-more{color:rgba(255,255,255,0.4);font-family:'Lato',sans-serif;font-size:12px;letter-spacing:0.1em;text-transform:uppercase;margin-bottom:4px}
        .see-more-arrow{color:rgba(255,255,255,0.4);font-size:22px;line-height:1}
        /* PROOF STRIP */
        .proof-strip{background:var(--bg-soft);border-top:1px solid rgba(0,68,123,0.08);border-bottom:1px solid rgba(0,68,123,0.08)}
        .proof-inner{max-width:900px;margin:0 auto;padding:36px 40px;text-align:center}
        .proof-headline{font-family:'Lato',sans-serif;font-size:15px;font-weight:400;color:var(--gray-dark);margin-bottom:24px}
        .proof-stats{display:flex;justify-content:center;gap:48px;flex-wrap:wrap}
        .proof-stat-num{font-family:'Poppins',sans-serif;font-size:32px;font-weight:700;color:var(--navy);line-height:1}
        .proof-stat-label{font-family:'Lato',sans-serif;font-size:13px;font-weight:400;color:var(--gray-dark);margin-top:4px}
        /* SECTION COMMON */
        .section{padding:80px 60px}
        .section-label{font-family:'Lato',sans-serif;font-size:12px;font-weight:700;color:var(--orange);letter-spacing:0.12em;text-transform:uppercase;border-bottom:2px solid var(--orange);display:inline-block;padding-bottom:3px;margin-bottom:16px}
        .section-title{font-size:40px;font-weight:600;color:var(--navy);margin-bottom:12px;letter-spacing:-0.5px}
        .section-sub{font-family:'Lato',sans-serif;font-size:17px;font-weight:400;color:var(--gray-dark);line-height:1.65;max-width:560px}
        .section-sub.centered{margin:0 auto}
        /* HOW IT WORKS */
        .how{background:var(--bg-soft);text-align:center}
        .how .section-title,.how .section-label,.how .section-sub{text-align:center}
        .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:32px;margin-top:52px}
        .step-card{background:white;border-radius:16px;padding:36px 28px;border:0.5px solid rgba(0,68,123,0.08);text-align:left}
        .step-num{width:36px;height:36px;border-radius:50%;background:var(--orange);color:white;font-family:'Poppins',sans-serif;font-size:16px;font-weight:700;display:flex;align-items:center;justify-content:center;margin-bottom:20px}
        .step-card h3{font-size:20px;font-weight:600;color:var(--navy);margin-bottom:10px}
        .step-card p{font-family:'Lato',sans-serif;font-size:15px;font-weight:400;color:var(--gray-dark);line-height:1.65}
        /* FEATURES */
        .features{background:white}
        .features-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:52px}
        .feat-card{background:var(--bg-soft);border-radius:14px;padding:28px 24px;border:0.5px solid rgba(0,68,123,0.06)}
        .feat-card.highlight{background:var(--navy);border-color:var(--navy)}
        .feat-card.highlight h3{color:white}
        .feat-card.highlight p{color:rgba(255,255,255,0.7)}
        .feat-icon{width:44px;height:44px;margin-bottom:14px}
        .feat-card h3{font-size:18px;font-weight:600;color:var(--navy);margin-bottom:8px}
        .feat-card p{font-family:'Lato',sans-serif;font-size:14px;font-weight:400;color:var(--gray-dark);line-height:1.6}
        /* YOUR WAY */
        .yourway{background:var(--bg-navy-tint)}
        .yourway-grid{display:grid;grid-template-columns:1fr 1fr;gap:60px;align-items:center;margin-top:40px}
        .yourway-points{display:flex;flex-direction:column;gap:20px;margin-top:12px}
        .yw-point{display:flex;gap:14px;align-items:flex-start}
        .yw-dot{width:10px;height:10px;border-radius:50%;background:var(--orange);flex-shrink:0;margin-top:6px}
        .yw-point h4{font-size:16px;font-weight:600;color:var(--navy);margin-bottom:4px}
        .yw-point p{font-family:'Lato',sans-serif;font-size:14px;font-weight:400;color:var(--gray-dark);line-height:1.6}
        .yourway-visual{background:white;border-radius:16px;padding:32px;border:0.5px solid rgba(0,68,123,0.1)}
        .chat-bubble{background:var(--bg-navy-tint);border-radius:12px 12px 12px 2px;padding:14px 18px;margin-bottom:10px;font-family:'Lato',sans-serif;font-size:14px;color:var(--navy);font-weight:400;max-width:90%;line-height:1.5}
        .chat-bubble.luna{background:var(--navy);color:white;border-radius:12px 12px 2px 12px;margin-left:auto}
        .chat-label{font-family:'Lato',sans-serif;font-size:11px;color:var(--gray-light);margin-bottom:6px;font-weight:400}
        .chat-label.luna{text-align:right}
        /* MEET LUNA */
        .meet-luna{background:var(--navy);padding:80px 60px}
        .meet-luna-inner{display:grid;grid-template-columns:380px 1fr;gap:60px;align-items:center;max-width:1100px;margin:0 auto}
        .luna-avatar-wrap{display:flex;justify-content:center;align-items:center}
        .luna-avatar-wrap img{height:480px;width:auto;display:block}
        .luna-copy .section-label{color:var(--orange-light);border-color:var(--orange-light)}
        .luna-copy .section-title{color:white;font-size:44px;line-height:1.1}
        .luna-copy .section-sub{color:rgba(255,255,255,0.65);max-width:100%}
        .luna-features{display:flex;flex-direction:column;gap:14px;margin-top:28px}
        .luna-feat{display:flex;gap:12px;align-items:flex-start}
        .luna-feat-check{width:20px;height:20px;border-radius:50%;background:var(--orange);flex-shrink:0;display:flex;align-items:center;justify-content:center;margin-top:1px}
        .luna-feat-check::after{content:'';width:6px;height:10px;border-right:2px solid white;border-bottom:2px solid white;transform:rotate(45deg) translate(-1px,-1px)}
        .luna-feat p{font-family:'Lato',sans-serif;font-size:15px;font-weight:400;color:rgba(255,255,255,0.75);line-height:1.55}
        .luna-feat strong{color:white;font-weight:700}
        .btn-letsgo-white{background:var(--orange);color:white;border:none;border-radius:50px;padding:16px 44px;font-family:'Poppins',sans-serif;font-size:16px;font-weight:500;cursor:pointer;display:inline-block;text-decoration:none;margin-top:32px;transition:background .2s}
        .btn-letsgo-white:hover{background:#e06e00}
        /* PLAN TOGETHER */
        .plan-together{background:var(--bg-navy-tint)}
        .pt-grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center;margin-top:36px}
        .pt-points{display:flex;flex-direction:column;gap:18px;margin-top:16px}
        .pt-point{display:flex;gap:14px;align-items:flex-start}
        .pt-num{width:28px;height:28px;border-radius:50%;background:var(--navy);color:white;font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .pt-point p{font-family:'Lato',sans-serif;font-size:15px;color:var(--gray-dark);line-height:1.6;margin:0}
        .pt-point strong{color:var(--navy)}
        .pt-visual{background:white;border-radius:16px;padding:24px;border:0.5px solid rgba(0,68,123,0.1)}
        .pt-avatar{width:36px;height:36px;border-radius:50%;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-family:'Poppins',sans-serif;font-size:13px;font-weight:700;color:white;margin-left:-8px}
        .pt-avatar:first-child{margin-left:0}
        .pt-live{display:inline-flex;align-items:center;gap:6px;background:rgba(16,185,129,0.1);border:1px solid rgba(16,185,129,0.3);border-radius:20px;padding:4px 12px}
        .pt-live-dot{width:6px;height:6px;border-radius:50%;background:#10b981}
        .pt-live span{font-family:'Lato',sans-serif;font-size:12px;font-weight:700;color:#10b981}
        .pt-activity{display:flex;align-items:center;gap:12px;padding:10px 14px;border-radius:10px;background:var(--bg-soft);margin-bottom:8px;font-family:'Lato',sans-serif;font-size:13px;color:var(--gray-dark)}
        .pt-activity-badge{font-family:'Lato',sans-serif;font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px;margin-left:auto;white-space:nowrap}
        .btn-plan-together{background:var(--orange);color:white;border:none;border-radius:50px;padding:14px 40px;font-family:'Poppins',sans-serif;font-size:16px;font-weight:500;cursor:pointer;display:inline-block;text-decoration:none;margin-top:28px;transition:background .2s}
        .btn-plan-together:hover{background:#e06e00}
        /* TALK TO LUNA */
        .talk-luna{background:white}
        .prompts-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:32px}
        .prompt-card{background:var(--bg-navy-tint);border-radius:14px;padding:18px 20px;font-family:'Lato',sans-serif;font-size:14px;color:var(--navy);line-height:1.5;border:1px solid rgba(0,68,123,0.08)}
        .prompt-card::before{content:'"';font-family:'Poppins',sans-serif;font-size:28px;font-weight:700;color:var(--orange);line-height:1;display:block;margin-bottom:4px}
        .tip-card{background:#FFF8F0;border-radius:14px;border:1.5px solid rgba(255,130,16,0.2);padding:20px 24px;margin-top:24px;max-width:660px}
        .tip-card-title{font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;color:var(--orange);margin-bottom:6px}
        .tip-card p{font-family:'Lato',sans-serif;font-size:14px;color:var(--gray-dark);line-height:1.6}
        /* DIFFERENTIATION */
        .diff{background:var(--bg-soft)}
        .diff-table{width:100%;border-collapse:separate;border-spacing:0;margin-top:40px;border-radius:14px;overflow:hidden;border:1px solid rgba(0,68,123,0.08);background:white}
        .diff-table th{font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;padding:18px 24px;text-align:left}
        .diff-table th:first-child{background:white;color:var(--gray-dark);width:180px}
        .diff-table th:nth-child(2){background:var(--navy);color:white}
        .diff-table th:nth-child(3){background:#f0f0f0;color:var(--gray-dark)}
        .diff-table td{font-family:'Lato',sans-serif;font-size:14px;padding:16px 24px;border-top:1px solid rgba(0,68,123,0.08);vertical-align:top;line-height:1.55}
        .diff-table td:first-child{font-family:'Poppins',sans-serif;font-weight:600;color:var(--navy);font-size:13px}
        .diff-table td:nth-child(2){color:var(--navy);background:rgba(0,68,123,0.02)}
        .diff-table td:nth-child(3){color:#888}
        /* TRIP IDEAS */
        .trip-ideas{background:white}
        .ideas-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;margin-top:52px}
        .idea-card{border-radius:16px;overflow:hidden;border:0.5px solid rgba(0,68,123,0.1)}
        .idea-img{height:200px;background:var(--bg-navy-tint);position:relative;overflow:hidden}
        .idea-img-bg{position:absolute;inset:0;display:flex;align-items:flex-end;padding:16px}
        .idea-tag{display:inline-block;background:var(--orange);color:white;font-family:'Lato',sans-serif;font-size:11px;font-weight:700;padding:4px 12px;border-radius:10px}
        .idea-body{padding:20px}
        .idea-body h3{font-size:20px;font-weight:600;color:var(--navy);margin-bottom:4px}
        .idea-body .days{font-family:'Lato',sans-serif;font-size:13px;color:var(--gray-dark);font-weight:400;margin-bottom:10px}
        .idea-tags{display:flex;gap:6px;flex-wrap:wrap}
        .tag{background:#EEF4FB;color:var(--navy);font-family:'Lato',sans-serif;font-size:11px;font-weight:400;padding:4px 10px;border-radius:8px}
        /* PERSONA */
        .persona{background:#FFF8F0;text-align:center;padding:80px 60px}
        .persona-cards{display:flex;justify-content:center;gap:12px;flex-wrap:wrap;margin:40px 0}
        .persona-card{background:white;border-radius:12px;padding:18px 28px;border:1.5px solid rgba(0,68,123,0.15);min-width:140px;text-align:center;cursor:pointer;transition:all .2s;display:flex;align-items:center;gap:10px}
        .persona-card:hover{border-color:var(--orange);background:var(--orange);transform:translateY(-2px)}
        .persona-card .p-name{font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;color:var(--navy);transition:color .2s}
        .persona-card:hover .p-name{color:white}
        /* FINAL CTA */
        .final-cta{background:var(--orange);padding:80px 60px;text-align:center}
        .final-cta h2{font-size:52px;font-weight:600;color:white;margin-bottom:16px;letter-spacing:-1px}
        .final-cta p{font-family:'Lato',sans-serif;font-size:18px;font-weight:400;color:rgba(255,255,255,0.85);margin-bottom:40px}
        .btn-cta-white{background:white;color:var(--orange);border:none;border-radius:50px;padding:18px 52px;font-family:'Poppins',sans-serif;font-size:18px;font-weight:500;cursor:pointer;text-decoration:none;display:inline-block;transition:all .2s}
        .btn-cta-white:hover{background:#FFF5EC}
        /* FOOTER */
        footer{background:var(--navy);padding:60px 60px 32px;color:rgba(255,255,255,0.65)}
        .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1fr;gap:40px;margin-bottom:48px}
        .footer-brand img{height:38px;margin-bottom:16px}
        .footer-brand p{font-family:'Lato',sans-serif;font-size:14px;font-weight:400;line-height:1.65;color:rgba(255,255,255,0.5);max-width:260px}
        .footer-col h4{font-family:'Poppins',sans-serif;font-size:14px;font-weight:600;color:white;margin-bottom:16px}
        .footer-col a{display:block;font-family:'Lato',sans-serif;font-size:14px;font-weight:400;color:rgba(255,255,255,0.55);text-decoration:none;margin-bottom:9px;transition:color .2s}
        .footer-col a:hover{color:var(--orange-light)}
        .footer-bottom{border-top:0.5px solid rgba(255,255,255,0.1);padding-top:24px;display:flex;justify-content:space-between;align-items:center}
        .footer-bottom p{font-family:'Lato',sans-serif;font-size:13px;font-weight:400;color:rgba(255,255,255,0.35)}
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
          .pt-grid{grid-template-columns:1fr;gap:28px}
          .prompts-grid{grid-template-columns:1fr 1fr}
          .diff-table{font-size:12px}
          .diff-table th,.diff-table td{padding:12px 14px}
          .ideas-grid{grid-template-columns:1fr 1fr}
          .final-cta{padding:60px 24px}
          .final-cta h2{font-size:36px}
          footer{padding:48px 24px 24px}
          .footer-grid{grid-template-columns:1fr 1fr;gap:28px}
          .proof-inner{padding:28px 24px}
          .proof-stats{gap:28px}
        }
        @media(max-width:540px){
          .hero-title{font-size:36px;letter-spacing:-1px}
          .features-grid{grid-template-columns:1fr}
          .persona-cards{flex-direction:column;align-items:center}
          .prompts-grid{grid-template-columns:1fr}
          .proof-stats{flex-direction:column;gap:20px}
        }
        /* CAROUSEL */
        .ideas-carousel-wrap{position:relative;margin-top:52px}
        .ideas-carousel{display:flex;gap:20px;overflow-x:auto;scroll-snap-type:x mandatory;scroll-behavior:smooth;padding-bottom:12px;-ms-overflow-style:none;scrollbar-width:none}
        .ideas-carousel::-webkit-scrollbar{display:none}
        .ideas-carousel .idea-card{min-width:280px;flex-shrink:0;scroll-snap-align:start}
        .carousel-btn{position:absolute;top:50%;transform:translateY(-60%);width:40px;height:40px;border-radius:50%;background:white;border:1.5px solid rgba(0,68,123,0.15);cursor:pointer;display:flex;align-items:center;justify-content:center;z-index:10;box-shadow:0 2px 8px rgba(0,0,0,0.1);transition:all 0.2s}
        .carousel-btn:hover{background:var(--orange);border-color:var(--orange)}
        .carousel-btn:hover svg{stroke:white}
        .carousel-btn.prev{left:-20px}
        .carousel-btn.next{right:-20px}
        @media(max-width:900px){.carousel-btn{display:none}}
      `}</style>

      {/* NAVBAR */}
      <NavBar />

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
            <span>{tHero('badge')}</span>
          </div>
          <h1 className="hero-title">
            <span className="navy">{tHero('title1')}<br /></span>
            <span className="orange">{tHero('title2')}</span><br />
            <span className="navy">{tHero('title3')}</span>
          </h1>
          <p className="hero-sub">{tHero('subtitle')}</p>
          <div className="hero-pills">
            <div className="hero-pill blue">
              <div className="pill-title">{tHero('pill1Title')}</div>
              <div className="pill-sub">{tHero('pill1Sub')}</div>
            </div>
            <div className="hero-pill orange">
              <div className="pill-title">{tHero('pill2Title')}</div>
              <div className="pill-sub">{tHero('pill2Sub')}</div>
            </div>
            <div className="hero-pill blue">
              <div className="pill-title">{tHero('pill3Title')}</div>
              <div className="pill-sub">{tHero('pill3Sub')}</div>
            </div>
            <div className="hero-pill blue">
              <div className="pill-title">{tHero('pill4Title')}</div>
              <div className="pill-sub">{tHero('pill4Sub')}</div>
            </div>
          </div>
          <Link href="/start" className="btn-letsgo">{tHero('cta')} &rarr;</Link>
          <p className="hero-microcopy">{tHero('microCopy')}</p>
          <div style={{ cursor: 'pointer' }} onClick={() => document.getElementById('proof-strip')?.scrollIntoView({ behavior: 'smooth' })}>
            <div className="see-more">{tHero('seeMore')}</div>
            <div className="see-more-arrow">↓</div>
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF STRIP */}
      <div className="proof-strip" id="proof-strip">
        <div className="proof-inner">
          <p className="proof-headline">{tPS('headline')}</p>
          <div className="proof-stats">
            <div style={{textAlign:'center'}}>
              <div className="proof-stat-num">{tPS('stat1Num')}</div>
              <div className="proof-stat-label">{tPS('stat1Label')}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div className="proof-stat-num">{tPS('stat2Num')}</div>
              <div className="proof-stat-label">{tPS('stat2Label')}</div>
            </div>
            <div style={{textAlign:'center'}}>
              <div className="proof-stat-num">{tPS('stat3Num')}</div>
              <div className="proof-stat-label">{tPS('stat3Label')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* HOW IT WORKS */}
      <section className="section how" id="how-it-works">
        <div className="section-label">{tHow('label')}</div>
        <h2 className="section-title">{tHow('title')}</h2>
        <p className="section-sub centered">{tHow('subtitle')}</p>
        <div className="steps">
          <div className="step-card">
            <div className="step-num">1</div>
            <h3>{tHow('step1Title')}</h3>
            <p>{tHow('step1Body')}</p>
          </div>
          <div className="step-card">
            <div className="step-num">2</div>
            <h3>{tHow('step2Title')}</h3>
            <p>{tHow('step2Body')}</p>
          </div>
          <div className="step-card">
            <div className="step-num">3</div>
            <h3>{tHow('step3Title')}</h3>
            <p>{tHow('step3Body')}</p>
          </div>
        </div>
      </section>

      {/* EVERYTHING IN EVERY PLAN */}
      <section className="section features" id="features">
        <div className="section-label">{tFeat('label')}</div>
        <h2 className="section-title">{tFeat('title')}</h2>
        <p className="section-sub">{tFeat('subtitle')}</p>
        <div className="features-grid">

          {/* 1 - Personalised itineraries */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#EEF4FB" />
              <rect x="12" y="10" width="20" height="24" rx="3" stroke="#00447B" strokeWidth="1.5" />
              <line x1="16" y1="16" x2="28" y2="16" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="16" y1="20" x2="28" y2="20" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
              <line x1="16" y1="24" x2="22" y2="24" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <h3>{tFeat('personalisedTitle')}</h3>
            <p>{tFeat('personalisedBody')}</p>
          </div>

          {/* 2 - Smart pacing */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FFF5EC" />
              <circle cx="22" cy="22" r="10" stroke="#FF8210" strokeWidth="1.5" />
              <path d="M22 16v6l4 2" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>{tFeat('pacingTitle')}</h3>
            <p>{tFeat('pacingBody')}</p>
          </div>

          {/* 3 - Add, swap, remove */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#EEF4FB" />
              <path d="M16 22h12M22 16v12" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M14 28l3 3 5-5" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <h3>{tFeat('editingTitle')}</h3>
            <p>{tFeat('editingBody')}</p>
          </div>

          {/* 4 - Hotel suggestions */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FFF5EC" />
              <rect x="10" y="16" width="24" height="16" rx="3" stroke="#FF8210" strokeWidth="1.5" />
              <path d="M15 16v-3a7 7 0 0 1 14 0v3" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="22" cy="24" r="2" fill="#FF8210" />
            </svg>
            <h3>{tFeat('hotelsTitle')}</h3>
            <p>{tFeat('hotelsBody')}</p>
          </div>

          {/* 5 - Budget breakdown */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#EEF4FB" />
              <rect x="12" y="14" width="20" height="16" rx="3" stroke="#00447B" strokeWidth="1.5" />
              <line x1="17" y1="22" x2="17" y2="26" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" />
              <line x1="22" y1="19" x2="22" y2="26" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" />
              <line x1="27" y1="20" x2="27" y2="26" stroke="#FF8210" strokeWidth="2" strokeLinecap="round" />
            </svg>
            <h3>{tFeat('budgetTitle')}</h3>
            <p>{tFeat('budgetBody')}</p>
          </div>

          {/* 6 - Weather */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FFF5EC" />
              <circle cx="22" cy="20" r="8" stroke="#FF8210" strokeWidth="1.5" />
              <path d="M18 20c0-2.2 1.8-4 4-4" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" />
              <path d="M22 32v2" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
              <path d="M14 22l-2 2" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
              <path d="M30 22l2 2" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" strokeOpacity="0.4" />
            </svg>
            <h3>{tFeat('weatherTitle')}</h3>
            <p>{tFeat('weatherBody')}</p>
          </div>

          {/* 7 - Getting around */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#EEF4FB" />
              <circle cx="14" cy="30" r="3" stroke="#00447B" strokeWidth="1.5" />
              <circle cx="30" cy="30" r="3" stroke="#00447B" strokeWidth="1.5" />
              <path d="M8 28h4v-6h16v6h4" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M12 22v-4a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v4" stroke="#00447B" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>{tFeat('transportTitle')}</h3>
            <p>{tFeat('transportBody')}</p>
          </div>

          {/* 8 - Chat with Luna */}
          <div className="feat-card">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="#FFF5EC" />
              <path d="M14 28a10 10 0 1 1 16 0" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="22" cy="22" r="3" fill="#FF8210" />
              <line x1="22" y1="28" x2="22" y2="32" stroke="#FF8210" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <h3>{tFeat('chatTitle')}</h3>
            <p>{tFeat('chatBody')}</p>
          </div>

          {/* 9 - Plan together (highlight) */}
          <div className="feat-card highlight">
            <svg className="feat-icon" viewBox="0 0 44 44" fill="none">
              <rect width="44" height="44" rx="10" fill="rgba(255,255,255,0.15)" />
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="white" strokeWidth="1.5" strokeLinecap="round" transform="translate(10,8) scale(0.85)" />
              <circle cx="21.5" cy="17.5" r="3.5" stroke="white" strokeWidth="1.5" />
              <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="rgba(255,255,255,0.6)" strokeWidth="1.5" strokeLinecap="round" transform="translate(10,8) scale(0.85)" />
            </svg>
            <h3>{tFeat('planTogetherTitle')}</h3>
            <p>{tFeat('planTogetherBody')}</p>
          </div>

        </div>
      </section>

      {/* YOUR TRIP YOUR WAY */}
      <section className="section yourway" id="your-way">
        <div className="yourway-grid">
          <div>
            <div className="section-label">{tYW('label')}</div>
            <h2 className="section-title">{tYW('title')}</h2>
            <p className="section-sub">{tYW('subtitle')}</p>
            <div className="yourway-points">
              <div className="yw-point">
                <div className="yw-dot"></div>
                <div>
                  <h4>{tYW('point1Title')}</h4>
                  <p>{tYW('point1Body')}</p>
                </div>
              </div>
              <div className="yw-point">
                <div className="yw-dot"></div>
                <div>
                  <h4>{tYW('point2Title')}</h4>
                  <p>{tYW('point2Body')}</p>
                </div>
              </div>
              <div className="yw-point">
                <div className="yw-dot"></div>
                <div>
                  <h4>{tYW('point3Title')}</h4>
                  <p>{tYW('point3Body')}</p>
                </div>
              </div>
            </div>
          </div>
          <div className="yourway-visual">
            <div className="chat-label">{tYW('chatYou')}</div>
            <div className="chat-bubble">{tYW('chat1')}</div>
            <div className="chat-label luna" style={{marginTop:16}}>{tYW('chatLuna')}</div>
            <div className="chat-bubble luna">{tYW('chat2')}</div>
            <div className="chat-label" style={{marginTop:16}}>{tYW('chatYou')}</div>
            <div className="chat-bubble">{tYW('chat3')}</div>
            <div className="chat-label luna" style={{marginTop:16}}>{tYW('chatLuna')}</div>
            <div className="chat-bubble luna">{tYW('chat4')}</div>
          </div>
        </div>
      </section>

      {/* MEET LUNA */}
      <section className="meet-luna" id="meet-luna">
        <div className="meet-luna-inner">
          <div className="luna-avatar-wrap">
            <img src="/luna_BLUE.png" alt="Luna, your AI travel companion" />
          </div>
          <div className="luna-copy">
            <div className="section-label">{tML('label')}</div>
            <h2 className="section-title">{tML('title')}</h2>
            <p className="section-sub">{tML('subtitle')}</p>
            <div className="luna-features">
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>{tML('feat1Bold')}</strong>{tML('feat1Body')}</p>
              </div>
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>{tML('feat2Bold')}</strong>{tML('feat2Body')}</p>
              </div>
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>{tML('feat3Bold')}</strong>{tML('feat3Body')}</p>
              </div>
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>{tML('feat4Bold')}</strong>{tML('feat4Body')}</p>
              </div>
              <div className="luna-feat">
                <div className="luna-feat-check"></div>
                <p><strong>{tML('feat5Bold')}</strong>{tML('feat5Body')}</p>
              </div>
            </div>
            <Link href="/start" className="btn-letsgo-white">{tML('cta')} &rarr;</Link>
          </div>
        </div>
      </section>

      {/* PLAN TOGETHER */}
      <section className="section plan-together" id="plan-together">
        <div className="pt-grid">
          <div>
            <div className="section-label">{tPT('label')}</div>
            <h2 className="section-title">{tPT('headline')}</h2>
            <p className="section-sub">{tPT('subhead')}</p>
            <div className="pt-points">
              <div className="pt-point">
                <div className="pt-num">1</div>
                <p><strong>{tPT('point1Bold')}</strong>{tPT('point1Body')}</p>
              </div>
              <div className="pt-point">
                <div className="pt-num">2</div>
                <p><strong>{tPT('point2Bold')}</strong>{tPT('point2Body')}</p>
              </div>
              <div className="pt-point">
                <div className="pt-num">3</div>
                <p><strong>{tPT('point3Bold')}</strong>{tPT('point3Body')}</p>
              </div>
              <div className="pt-point">
                <div className="pt-num">4</div>
                <p><strong>{tPT('point4Bold')}</strong>{tPT('point4Body')}</p>
              </div>
            </div>
            <Link href="/start" className="btn-plan-together">{tPT('cta')} &rarr;</Link>
          </div>
          <div className="pt-visual">
            <div style={{display:'flex',alignItems:'center',gap:12,marginBottom:16}}>
              <div style={{display:'flex'}}>
                <div className="pt-avatar" style={{background:'var(--orange)'}}>W</div>
                <div className="pt-avatar" style={{background:'var(--navy)'}}>F</div>
                <div className="pt-avatar" style={{background:'var(--navy-mid)'}}>M</div>
              </div>
              <div className="pt-live"><div className="pt-live-dot"></div><span>3 editing now</span></div>
            </div>
            <div style={{fontFamily:"'Poppins',sans-serif",fontSize:13,fontWeight:600,color:'var(--navy)',marginBottom:12}}>Day 2 - Asakusa and Ueno</div>
            <div className="pt-activity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Senso-ji Temple, morning
              <span className="pt-activity-badge" style={{background:'rgba(16,185,129,0.1)',color:'#10b981'}}>Accepted</span>
            </div>
            <div className="pt-activity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--orange)" strokeWidth="2" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
              Ueno Park, afternoon
              <span className="pt-activity-badge" style={{background:'rgba(16,185,129,0.1)',color:'#10b981'}}>Accepted</span>
            </div>
            <div className="pt-activity">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--gray-light)" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="10"/><path d="M8 12h8"/></svg>
              <span style={{textDecoration:'line-through',color:'var(--gray-light)'}}>Robot Restaurant, evening</span>
              <span className="pt-activity-badge" style={{background:'rgba(239,68,68,0.1)',color:'#ef4444'}}>Removed</span>
            </div>
            <div style={{marginTop:14,padding:'10px 14px',background:'var(--bg-navy-tint)',borderRadius:10,fontFamily:"'Lato',sans-serif",fontSize:12,color:'var(--navy)'}}>
              <strong style={{color:'var(--orange)'}}>F:</strong> &quot;Let&apos;s swap Robot Restaurant for a local izakaya instead&quot;
            </div>
          </div>
        </div>
      </section>

      {/* TALK TO LUNA */}
      <section className="section talk-luna" id="talk-to-luna">
        <div className="section-label">{tTL('label')}</div>
        <h2 className="section-title">{tTL('title')}</h2>
        <p className="section-sub">{tTL('subtitle')}</p>
        <div className="prompts-grid">
          <div className="prompt-card">{tTL('prompt1')}</div>
          <div className="prompt-card">{tTL('prompt2')}</div>
          <div className="prompt-card">{tTL('prompt3')}</div>
          <div className="prompt-card">{tTL('prompt4')}</div>
          <div className="prompt-card">{tTL('prompt5')}</div>
          <div className="prompt-card">{tTL('prompt6')}</div>
        </div>
        <div className="tip-card">
          <div className="tip-card-title">{tTL('tipTitle')}</div>
          <p>{tTL('tipBody')}</p>
        </div>
        <div style={{marginTop:16}}>
          <Link href="/how-to-use-luna" style={{fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700,color:'var(--orange)',textDecoration:'none'}}>{tTL('guideLink')} &rarr;</Link>
        </div>
      </section>

      {/* WHY LUNA - DIFFERENTIATION */}
      <section className="section diff" id="why-luna">
        <div style={{textAlign:'center'}}>
          <div className="section-label">{tWL('label')}</div>
          <h2 className="section-title" style={{textAlign:'center'}}>{tWL('title')}</h2>
        </div>
        <table className="diff-table">
          <thead>
            <tr>
              <th></th>
              <th>{tWL('colLuna')}</th>
              <th>{tWL('colOther')}</th>
            </tr>
          </thead>
          <tbody>
            {(['1','2','3','4','5','6'] as const).map((n) => (
              <tr key={n}>
                <td>{tWL(`row${n}Label` as Parameters<typeof tWL>[0])}</td>
                <td>{tWL(`row${n}Luna` as Parameters<typeof tWL>[0])}</td>
                <td>{tWL(`row${n}Other` as Parameters<typeof tWL>[0])}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* TRIP IDEAS */}
      <section className="section trip-ideas" id="trip-ideas">
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-end',marginBottom:0}}>
          <div>
            <div className="section-label">{tTI('label')}</div>
            <h2 className="section-title" style={{marginBottom:0}}>{tTI('title')}</h2>
          </div>
          <Link href="/trip-ideas" style={{fontFamily:"'Lato',sans-serif",fontSize:14,fontWeight:700,color:'var(--orange)',textDecoration:'none'}}>{tTI('seeAll')} &rarr;</Link>
        </div>
        <div className="ideas-carousel-wrap" onMouseEnter={stopAutoPlay} onMouseLeave={startAutoPlay}>
          <button className="carousel-btn prev" onClick={()=>{ carouselRef.current?.scrollBy({left:-320,behavior:'smooth'}); startAutoPlay(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00447B" strokeWidth="2.5" strokeLinecap="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="ideas-carousel" ref={carouselRef}>
            {[
              {img:'photo-1540959733332-eab4deabeeaf',tag:'Culture',name:'Tokyo, Japan',days:'7 days',tags:['Food','Markets','Art']},
              {img:'photo-1548707309-dcebeab9ea9b',tag:'Trending',name:'Lisbon, Portugal',days:'5 days',tags:['History','Food','Sunsets']},
              {img:'photo-1537996194471-e657df975ab4',tag:'Budget pick',name:'Bali, Indonesia',days:'10 days',tags:['Nature','Temples','Relax']},
              {img:'photo-1570077188670-e3a8d69ac5ff',tag:'Romance',name:'Santorini, Greece',days:'6 days',tags:['Beaches','Views','Wine']},
              {img:'photo-1508193638397-1c4234db14d8',tag:'Adventure',name:'Banff, Canada',days:'7 days',tags:['Hiking','Mountains','Nature']},
              {img:'photo-1539020140153-e479b8c22e70',tag:'Culture',name:'Marrakech, Morocco',days:'5 days',tags:['Souks','History','Food']},
              {img:'photo-1514282401047-d79a71a590e8',tag:'Luxury',name:'Maldives',days:'8 days',tags:['Beach','Resort','Water']},
              {img:'photo-1496442226666-8d4d0e62e6e9',tag:'City',name:'New York City, USA',days:'6 days',tags:['Culture','Food','Nightlife']},
              {img:'photo-1501854140801-50d01698950b',tag:'Adventure',name:'Patagonia, Argentina',days:'10 days',tags:['Trekking','Nature','Wildlife']},
              {img:'photo-1493976040374-85c8e12f0c0e',tag:'Cultural',name:'Kyoto, Japan',days:'5 days',tags:['Temples','Gardens','History']},
            ].map(item => (
              <Link key={item.name} href={`/start?destination=${encodeURIComponent(item.name)}`} className="idea-card" style={{textDecoration:'none',color:'inherit'}}>
                <div className="idea-img" style={{backgroundImage:`url('https://images.unsplash.com/${item.img}?w=600&q=80')`,backgroundSize:'cover',backgroundPosition:'center'}}>
                  <div className="idea-img-bg"><span className="idea-tag">{item.tag}</span></div>
                </div>
                <div className="idea-body">
                  <h3>{item.name}</h3>
                  <div className="days">{item.days}</div>
                  <div className="idea-tags">
                    {item.tags.map(t => <span key={t} className="tag">{t}</span>)}
                  </div>
                </div>
              </Link>
            ))}
          </div>
          <button className="carousel-btn next" onClick={()=>{ carouselRef.current?.scrollBy({left:320,behavior:'smooth'}); startAutoPlay(); }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#00447B" strokeWidth="2.5" strokeLinecap="round"><polyline points="9 18 15 12 9 6" /></svg>
          </button>
        </div>
      </section>

      {/* TRAVELLER PERSONA */}
      <section className="section persona" id="quiz">
        <div className="section-label">{tQuiz('label')}</div>
        <h2 className="section-title">{tQuiz('title')}</h2>
        <p className="section-sub centered" style={{margin:'0 auto 8px'}}>{tQuiz('subtitle')}</p>
        <div className="persona-cards" style={{justifyContent:'center',flexWrap:'wrap',gap:12}}>
          {[
            { name: 'The Explorer',         color: 'var(--orange)' },
            { name: 'The Foodie',           color: 'var(--navy)'   },
            { name: 'The Relaxer',          color: 'var(--orange)' },
            { name: 'The Photographer',     color: 'var(--navy)'   },
            { name: 'The Culture Seeker',   color: 'var(--orange)' },
            { name: 'The Adventurer',       color: 'var(--navy)'   },
            { name: 'The Luxury Traveller', color: 'var(--orange)' },
            { name: 'The Family Planner',   color: 'var(--navy)'   },
            { name: 'The Romantic',         color: 'var(--orange)' },
            { name: 'The Solo Wanderer',    color: 'var(--navy)'   },
            { name: 'The Party Animal',     color: 'var(--orange)' },
            { name: 'The Festival Chaser',  color: 'var(--navy)'   },
          ].map(({ name, color }) => (
            <Link key={name} href="/quiz" className="persona-card" style={{textDecoration:'none'}}>
              <svg width="18" height="18" viewBox="0 0 18 18" style={{flexShrink:0}}><circle cx="9" cy="9" r="9" fill={color} /></svg>
              <div className="p-name">{name}</div>
            </Link>
          ))}
        </div>
        <Link href="/quiz" style={{display:'inline-block',background:'var(--orange)',color:'white',borderRadius:50,padding:'16px 44px',fontFamily:"'Poppins',sans-serif",fontSize:16,fontWeight:500,textDecoration:'none',marginTop:8}}>{tQuiz('cta')} &rarr;</Link>
      </section>

      {/* FAQ */}
      <section id="faq" style={{ background: '#F8FBFF', padding: '80px 24px' }}>
        <div style={{ maxWidth: 800, margin: '0 auto' }}>
          <p style={{ fontFamily: "'Poppins',sans-serif", fontSize: 12, fontWeight: 700, color: '#FF8210', letterSpacing: '0.12em', textTransform: 'uppercase', borderBottom: '2px solid #FF8210', display: 'inline-block', paddingBottom: 3, marginBottom: 16 }}>{tFaq('label')}</p>
          <h2 style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 700, fontSize: 'clamp(26px,3.5vw,38px)', color: '#00447B', lineHeight: 1.2, marginBottom: 48, letterSpacing: '-0.5px' }}>
            {tFaq('title')}
          </h2>
          <div itemScope itemType="https://schema.org/FAQPage">
            {(['1','2','3','4','5','6','7','8'] as const).map((n) => (
              <div
                key={n}
                itemScope
                itemProp="mainEntity"
                itemType="https://schema.org/Question"
                style={{ borderBottom: '1px solid rgba(0,68,123,0.1)', paddingBottom: 28, marginBottom: 28 }}
              >
                <h3
                  itemProp="name"
                  style={{ fontFamily: "'Poppins',sans-serif", fontWeight: 600, fontSize: 17, color: '#00447B', marginBottom: 10 }}
                >
                  {tFaq(`q${n}` as Parameters<typeof tFaq>[0])}
                </h3>
                <div itemScope itemProp="acceptedAnswer" itemType="https://schema.org/Answer">
                  <p
                    itemProp="text"
                    style={{ fontFamily: "'Lato',sans-serif", fontSize: 15, fontWeight: 300, color: '#4a4a5a', lineHeight: 1.75, margin: 0 }}
                  >
                    {tFaq(`a${n}` as Parameters<typeof tFaq>[0])}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="final-cta" id="cta">
        <h2>{tCta('title')}</h2>
        <p>{tCta('subtitle')}</p>
        <Link href="/start" className="btn-cta-white">{tCta('cta')} &rarr;</Link>
        <p style={{fontFamily:"'Lato',sans-serif",fontSize:13,color:'rgba(255,255,255,0.55)',marginTop:12}}>{tCta('microCopy')}</p>
      </section>

    </>
  );
}
