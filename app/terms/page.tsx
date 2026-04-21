import type { Metadata } from 'next'

const BASE_URL = 'https://www.lunaletsgo.com';

export const metadata: Metadata = {
  title: 'Terms of Service | Luna Let\'s Go',
  description: "Read the Terms of Service for Luna Let's Go — the AI travel planner. Understand your rights, responsibilities, and how our platform works before using the service.",
  alternates: { canonical: `${BASE_URL}/terms` },
  robots: { index: true, follow: true },
  openGraph: {
    title: "Terms of Service | Luna Let's Go",
    description: "The terms and conditions governing use of the Luna Let's Go AI travel planning platform.",
    url: `${BASE_URL}/terms`,
    type: 'website',
  },
}

export default function TermsOfServicePage() {
  return (
    <main style={{ fontFamily: "'Inter', sans-serif", background: '#fff', color: '#1a1a2e', minHeight: '100vh' }}>

      {/* Hero */}
      <section style={{ background: '#0B2A4A', borderBottom: '3px solid #FF8210', padding: '56px 64px 48px' }}>
        <div style={{ maxWidth: '820px' }}>
          <span style={{
            display: 'inline-block', fontSize: '11px', fontFamily: "'Poppins', sans-serif",
            fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#FF8210',
            background: 'rgba(255,130,16,0.12)', border: '0.5px solid rgba(255,130,16,0.3)',
            padding: '4px 12px', borderRadius: '20px', marginBottom: '20px'
          }}>Legal</span>
          <h1 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 700, fontSize: '40px', color: '#fff', lineHeight: 1.2, marginBottom: '16px' }}>
            Terms of <span style={{ color: '#FFBD59' }}>Service</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '580px', margin: 0 }}>
            Please read these terms carefully before using Luna Let&apos;s Go. By accessing or using our platform, you agree to be bound by the conditions set out below.
          </p>
          <div style={{ marginTop: '28px', display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              'Last updated: March 27, 2026',
              'Effective: March 27, 2026',
              'Applies to: lunaletsgo.com',
            ].map((item) => (
              <div key={item} style={{ fontSize: '13px', color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '4px', height: '4px', background: '#FF8210', borderRadius: '50%', display: 'inline-block' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <div style={{ display: 'grid', gridTemplateColumns: '240px 1fr', maxWidth: '1100px', margin: '0 auto', padding: '48px 64px', gap: '64px', alignItems: 'start' }}>

        {/* Sidebar Nav */}
        <nav style={{ position: 'sticky', top: '24px' }}>
          <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '11px', fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#6C6D6F', marginBottom: '16px' }}>
            Contents
          </div>
          <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '2px' }}>
            {[
              '1. Acceptance of Terms',
              '2. Description of Service',
              '3. Eligibility',
              '4. User Accounts',
              '5. Acceptable Use',
              '6. AI-Generated Content',
              '7. Bookings & Payments',
              '8. Intellectual Property',
              '9. Disclaimers',
              '10. Limitation of Liability',
              '11. Termination',
              '12. Governing Law',
              '13. Contact Us',
            ].map((item) => (
              <li key={item}>
                <a href={`#section-${item.split('.')[0].trim()}`} className="policy-nav-link">{item}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

          <Section id="1" num="01" title="Acceptance of Terms">
            <p>By accessing or using the Luna Let&apos;s Go website and services (&quot;Service&quot;) operated by Luna Let&apos;s Go (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;), you confirm that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy.</p>
            <p>If you are using the Service on behalf of an organisation, you represent and warrant that you have the authority to bind that organisation to these Terms.</p>
            <Highlight>These Terms constitute a legally binding agreement between you and Luna Let&apos;s Go. If you do not agree to any part of these Terms, you must not use our Service.</Highlight>
          </Section>

          <Section id="2" num="02" title="Description of Service">
            <p>Luna Let&apos;s Go is an AI-powered travel planning platform that provides personalised itinerary generation, destination discovery, travel recommendations, and related tools to help users plan their trips.</p>
            <p>Our Service includes:</p>
            <BulletList items={[
              'AI-generated travel itineraries tailored to your preferences and budget',
              'Destination guides, tips, and curated recommendations',
              'Trip saving, organisation, and sharing features',
              'Integration with third-party booking platforms for flights, accommodation, and activities',
              'A personalised travel dashboard and trip history',
            ]} />
            <p>We reserve the right to modify, suspend, or discontinue any part of the Service at any time with reasonable notice to users.</p>
          </Section>

          <Section id="3" num="03" title="Eligibility">
            <p>To use Luna Let&apos;s Go, you must:</p>
            <BulletList items={[
              'Be at least 18 years of age, or the age of majority in your jurisdiction',
              'Have the legal capacity to enter into a binding contract',
              'Not be prohibited from using the Service under applicable law',
              'Provide accurate, current, and complete information when creating an account',
            ]} />
            <p>If you are between 13 and 18 years of age, you may only use the Service with the involvement and consent of a parent or legal guardian who agrees to these Terms on your behalf.</p>
          </Section>

          <Section id="4" num="04" title="User Accounts">
            <p>When you create an account with Luna Let&apos;s Go, you are responsible for:</p>
            <BulletList items={[
              'Maintaining the confidentiality of your login credentials',
              'All activities that occur under your account',
              'Notifying us immediately of any unauthorised use of your account at hello@lunaletsgo.com',
              'Ensuring your account information remains accurate and up to date',
            ]} />
            <Highlight>You may not share your account credentials with others or create accounts on behalf of third parties without their explicit consent. We are not liable for any loss resulting from unauthorised use of your account.</Highlight>
            <p>We reserve the right to suspend or terminate accounts that violate these Terms or that have been inactive for an extended period, with notice where practicable.</p>
          </Section>

          <Section id="5" num="05" title="Acceptable Use">
            <p>You agree to use Luna Let&apos;s Go only for lawful purposes and in a manner that does not infringe the rights of others. You must not:</p>
            <BulletList items={[
              'Use the Service for any fraudulent, deceptive, or harmful activity',
              'Attempt to gain unauthorised access to any part of our systems or infrastructure',
              'Scrape, crawl, or extract data from the platform without our written permission',
              'Upload or distribute malware, spam, or any harmful code',
              'Impersonate any person or entity, or misrepresent your affiliation with any person or entity',
              'Use the Service to harass, threaten, or discriminate against any individual or group',
              'Reverse engineer, decompile, or disassemble any part of our software or AI systems',
              'Use automated tools or bots to interact with the Service without prior written approval',
            ]} />
            <p>We reserve the right to investigate and take appropriate action against any violations, including suspending or terminating accounts and reporting conduct to law enforcement where required.</p>
          </Section>

          <Section id="6" num="06" title="AI-Generated Content">
            <p>Luna Let&apos;s Go uses artificial intelligence to generate travel plans, recommendations, and other content. You acknowledge and agree that:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
              {[
                { title: 'Accuracy', desc: 'AI-generated content may not always be accurate, complete, or up to date. Always verify important travel details independently.' },
                { title: 'Not Professional Advice', desc: 'Our recommendations do not constitute professional travel, legal, medical, or financial advice.' },
                { title: 'Your Responsibility', desc: 'You are solely responsible for any decisions made based on AI-generated content, including bookings and travel arrangements.' },
                { title: 'Feedback', desc: 'Your interactions with the AI may be used to improve our models, in accordance with our Privacy Policy.' },
              ].map(c => <Card key={c.title} title={c.title} desc={c.desc} />)}
            </div>
            <p>We continuously strive to improve the quality and reliability of our AI systems, but we cannot guarantee that AI-generated content will be error-free at all times.</p>
          </Section>

          <Section id="7" num="07" title="Bookings & Payments">
            <p>Where Luna Let&apos;s Go facilitates bookings through third-party providers, the following conditions apply:</p>
            <BulletList items={[
              "Bookings made through third-party partners are subject to those partners' own terms, conditions, and cancellation policies",
              "Luna Let's Go acts as an intermediary only and is not a party to any booking contract between you and a travel provider",
              'Payment processing is handled by secure third-party payment providers; we do not store your full card details',
              'All prices displayed are indicative and subject to availability at the time of booking',
              "Refunds and cancellations are governed by the individual provider's policy",
            ]} />
            <Highlight>Luna Let&apos;s Go is not responsible for any losses, disruptions, or disputes arising from bookings made with third-party travel providers. We recommend purchasing appropriate travel insurance for all trips.</Highlight>
          </Section>

          <Section id="8" num="08" title="Intellectual Property">
            <p>All content, features, and functionality of the Luna Let&apos;s Go Service, including but not limited to text, graphics, logos, icons, images, AI models, and software, are the exclusive property of Luna Let&apos;s Go or its licensors and are protected by applicable intellectual property laws.</p>
            <p>You are granted a limited, non-exclusive, non-transferable licence to access and use the Service for your personal, non-commercial travel planning purposes.</p>
            <BulletList items={[
              'You may not reproduce, distribute, or create derivative works from our content without written permission',
              'User-generated content (such as custom trip notes) remains your property, but you grant us a licence to use it to operate and improve the Service',
              'Any feedback or suggestions you provide may be used by us without obligation to you',
            ]} />
          </Section>

          <Section id="9" num="09" title="Disclaimers">
            <p>The Service is provided on an &quot;as is&quot; and &quot;as available&quot; basis without warranties of any kind, either express or implied. To the fullest extent permitted by law, Luna Let&apos;s Go disclaims all warranties, including:</p>
            <BulletList items={[
              'That the Service will be uninterrupted, error-free, or free from viruses or other harmful components',
              'That AI-generated travel plans, recommendations, or content will be accurate or suitable for your needs',
              'That the Service will meet your specific requirements or expectations',
              'Any implied warranties of merchantability, fitness for a particular purpose, or non-infringement',
            ]} />
            <p>We do not warrant the accuracy or reliability of any information obtained through the Service, including third-party content, pricing, or availability.</p>
          </Section>

          <Section id="10" num="10" title="Limitation of Liability">
            <p>To the maximum extent permitted by applicable law, Luna Let&apos;s Go and its directors, employees, partners, and agents shall not be liable for:</p>
            <BulletList items={[
              'Any indirect, incidental, special, consequential, or punitive damages',
              'Loss of profit, revenue, data, goodwill, or business opportunities',
              'Damages resulting from reliance on AI-generated content or recommendations',
              'Any travel disruptions, cancellations, or losses arising from third-party bookings',
              'Unauthorised access to or alteration of your data due to circumstances beyond our reasonable control',
            ]} />
            <Highlight>Our total liability to you for any claim arising from or relating to the Service shall not exceed the greater of the amount you paid to us in the 12 months preceding the claim, or AUD $100.</Highlight>
          </Section>

          <Section id="11" num="11" title="Termination">
            <p>Either party may terminate your use of the Service at any time.</p>
            <p>You may close your account at any time by contacting us at hello@lunaletsgo.com or through your account settings. Upon closure, your data will be handled in accordance with our Privacy Policy.</p>
            <p>We may suspend or terminate your access to the Service immediately and without notice if:</p>
            <BulletList items={[
              'You breach any provision of these Terms',
              'We are required to do so by law or court order',
              'Your conduct poses a risk to other users or to the integrity of the platform',
              'Continued provision of the Service becomes commercially unviable',
            ]} />
            <p>Upon termination, all rights and licences granted to you under these Terms will immediately cease. Provisions that by their nature should survive termination will remain in effect.</p>
          </Section>

          <Section id="12" num="12" title="Governing Law">
            <p>These Terms of Service are governed by and construed in accordance with the laws of Queensland, Australia, without regard to conflict of law principles.</p>
            <p>Any disputes arising out of or relating to these Terms or the Service shall be subject to the exclusive jurisdiction of the courts of Queensland, Australia.</p>
            <p>If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary, and the remaining provisions will continue in full force and effect.</p>
            <Highlight>If you are a consumer based in the European Union or United Kingdom, you may also have rights under applicable consumer protection legislation that cannot be excluded by these Terms.</Highlight>
          </Section>

          <Section id="13" num="13" title="Contact Us">
            <p>If you have any questions about these Terms of Service, need clarification on any provision, or wish to report a concern, please get in touch with our team.</p>
            <div style={{
              background: '#0B2A4A', borderRadius: '12px', padding: '28px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginTop: '16px', flexWrap: 'wrap'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: 1.6 }}>
                <strong style={{ color: '#fff', display: 'block', fontFamily: "'Poppins', sans-serif", fontSize: '17px', marginBottom: '6px' }}>Legal & Support Team</strong>
                We aim to respond to all legal enquiries within 2 business days. For urgent matters, please mark your email accordingly.
              </div>
              <a href="mailto:hello@lunaletsgo.com" style={{
                display: 'inline-block', background: '#FF8210', color: '#fff',
                fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '14px',
                padding: '12px 24px', borderRadius: '8px', textDecoration: 'none', whiteSpace: 'nowrap', flexShrink: 0
              }}>hello@lunaletsgo.com</a>
            </div>
          </Section>

        </div>
      </div>

      <style>{`
        .policy-nav-link {
          display: block; font-size: 13px; color: #6C6D6F; text-decoration: none;
          padding: 7px 12px; border-radius: 6px; border-left: 2px solid transparent;
          line-height: 1.4; transition: color 0.15s, background 0.15s, border-color 0.15s;
        }
        .policy-nav-link:hover {
          color: #00447B; background: #f0f5fb; border-left-color: #FF8210;
        }
      `}</style>
    </main>
  )
}

function Section({ id, num, title, children }: { id: string; num: string; title: string; children: React.ReactNode }) {
  return (
    <div id={`section-${id}`}>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontSize: '11px', fontWeight: 600, color: '#FF8210', letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: '8px' }}>
        Section {num}
      </div>
      <h2 style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '22px', color: '#00447B', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1.5px solid #f0f5fb' }}>
        {title}
      </h2>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {children}
      </div>
    </div>
  )
}

function Highlight({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ background: '#f0f5fb', borderLeft: '3px solid #00447B', borderRadius: '0 8px 8px 0', padding: '16px 20px', fontSize: '14px', color: '#00447B', lineHeight: 1.7 }}>
      {children}
    </div>
  )
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div style={{ background: '#f8fafd', border: '0.5px solid #e0eaf5', borderRadius: '10px', padding: '16px 18px' }}>
      <div style={{ fontFamily: "'Poppins', sans-serif", fontWeight: 600, fontSize: '13px', color: '#00447B', marginBottom: '8px' }}>{title}</div>
      <p style={{ fontSize: '13px', color: '#6C6D6F', margin: 0 }}>{desc}</p>
    </div>
  )
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul style={{ listStyle: 'none', padding: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {items.map((item, i) => (
        <li key={i} style={{ fontSize: '15px', color: '#3a3a4a', lineHeight: 1.7, display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
          <span style={{ width: '6px', height: '6px', background: '#FF8210', borderRadius: '50%', flexShrink: 0, marginTop: '8px', display: 'inline-block' }} />
          {item}
        </li>
      ))}
    </ul>
  )
}
