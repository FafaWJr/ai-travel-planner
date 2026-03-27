import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Privacy Policy | Luna Let\'s Go',
  description: 'Learn how Luna Let\'s Go collects, uses, and protects your personal information.',
}

export default function PrivacyPolicyPage() {
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
            Privacy <span style={{ color: '#FFBD59' }}>Policy</span>
          </h1>
          <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, maxWidth: '560px', margin: 0 }}>
            We are committed to protecting your personal information and being transparent about how we use it to power your travel experiences.
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
              '1. Introduction',
              '2. Information We Collect',
              '3. How We Use Your Data',
              '4. AI & Personalisation',
              '5. Data Sharing',
              '6. Cookies',
              '7. Data Retention',
              '8. Your Rights',
              '9. Security',
              "10. Children's Privacy",
              '11. Changes to Policy',
              '12. Contact Us',
            ].map((item) => (
              <li key={item}>
                <a href={`#section-${item.split('.')[0].trim()}`} style={{
                  display: 'block', fontSize: '13px', color: '#6C6D6F', textDecoration: 'none',
                  padding: '7px 12px', borderRadius: '6px', borderLeft: '2px solid transparent',
                  lineHeight: 1.4,
                }}
                  onMouseEnter={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#00447B'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = '#f0f5fb'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderLeftColor = '#FF8210'
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLAnchorElement).style.color = '#6C6D6F'
                    ;(e.currentTarget as HTMLAnchorElement).style.background = 'transparent'
                    ;(e.currentTarget as HTMLAnchorElement).style.borderLeftColor = 'transparent'
                  }}
                >{item}</a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>

          <Section id="1" num="01" title="Introduction">
            <p>Welcome to Luna Let&apos;s Go (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;). We are an AI-powered travel planning platform that helps users discover, plan, and organise personalised travel experiences.</p>
            <p>This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our website at lunaletsgo.com and our related services (collectively, the &quot;Service&quot;).</p>
            <Highlight>By using Luna Let&apos;s Go, you agree to the collection and use of information in accordance with this policy. If you do not agree, please discontinue use of our Service.</Highlight>
          </Section>

          <Section id="2" num="02" title="Information We Collect">
            <p>We collect several types of information to provide and improve our Service to you.</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
              {[
                { title: 'Account Information', desc: 'Name, email address, password (encrypted), profile photo, and preferences provided at registration.' },
                { title: 'Travel Preferences', desc: 'Travel styles, destinations of interest, budget ranges, dietary requirements, and accessibility needs.' },
                { title: 'Usage Data', desc: 'Pages visited, features used, search queries, itineraries created, and time spent on the platform.' },
                { title: 'Device & Technical Data', desc: 'IP address, browser type, operating system, device identifiers, and referring URLs.' },
              ].map(c => <Card key={c.title} title={c.title} desc={c.desc} />)}
            </div>
            <p>We may also collect information you voluntarily provide when contacting our support team or participating in surveys and promotions.</p>
          </Section>

          <Section id="3" num="03" title="How We Use Your Data">
            <p>We use the information we collect for the following purposes:</p>
            <BulletList items={[
              'To provide, operate, and maintain our AI travel planning Service',
              'To generate personalised travel itineraries and destination recommendations',
              'To create and manage your account and authenticate your identity',
              'To process transactions and send related information including purchase confirmations',
              'To send administrative information, such as updates, security alerts, and support messages',
              'To improve, personalise, and expand our Service based on your usage patterns',
              'To analyse usage trends and measure the effectiveness of our features',
              'To comply with legal obligations and enforce our Terms of Service',
            ]} />
            <p>We will not use your data for any purpose that is incompatible with the purposes described in this policy without your explicit consent.</p>
          </Section>

          <Section id="4" num="04" title="AI & Personalisation">
            <p>Luna Let&apos;s Go uses artificial intelligence to generate travel plans, recommendations, and content tailored to you. Here is how your data interacts with our AI systems:</p>
            <BulletList items={[
              'Your travel preferences and history are used to train and personalise our recommendation models',
              'Conversations with our AI trip planner may be stored to improve response quality and accuracy',
              'We use anonymised and aggregated data to improve our AI models at a platform level',
              'You can opt out of AI personalisation in your account settings at any time',
            ]} />
            <Highlight>Our AI models do not make automated decisions that have significant legal or similarly significant effects on you without human oversight.</Highlight>
          </Section>

          <Section id="5" num="05" title="Data Sharing & Third Parties">
            <p>We do not sell your personal information. We may share your information with third parties only in the following circumstances:</p>
            <BulletList items={[
              'Service Providers: Trusted vendors who assist in operating our platform, such as cloud hosting, payment processing, and analytics providers. These parties are contractually bound to protect your data.',
              'Travel Partners: With your consent, we may share relevant details with airlines, hotels, or booking platforms to facilitate reservations made through our Service.',
              'Legal Requirements: When required by law, court order, or governmental authority, or to protect the rights, property, or safety of our users or the public.',
              'Business Transfers: In the event of a merger, acquisition, or sale of assets, your data may be transferred as part of that transaction, with notice provided to you.',
            ]} />
          </Section>

          <Section id="6" num="06" title="Cookies & Tracking">
            <p>We use cookies and similar tracking technologies to enhance your experience on our platform. These include:</p>
            <BulletList items={[
              'Essential cookies: Required for the Service to function, such as authentication and session management',
              'Analytics cookies: Help us understand how users interact with our platform (e.g. Google Analytics)',
              'Preference cookies: Remember your settings and personalisation choices',
              'Marketing cookies: Used only with your consent to deliver relevant content and promotions',
            ]} />
            <p>You can manage your cookie preferences at any time through our Cookie Settings page or your browser settings. Disabling certain cookies may affect the functionality of our Service.</p>
          </Section>

          <Section id="7" num="07" title="Data Retention">
            <p>We retain your personal information for as long as your account is active or as needed to provide you with our Service. Specifically:</p>
            <BulletList items={[
              'Account data is retained for the lifetime of your account plus 90 days after deletion',
              'Travel itineraries and saved trips are deleted within 30 days of account closure upon request',
              'Usage logs and analytics data are retained for up to 24 months in anonymised form',
              'Financial transaction records are retained for 7 years as required by applicable tax law',
            ]} />
            <p>You may request deletion of your account and associated data at any time by contacting us at hello@lunaletsgo.com.</p>
          </Section>

          <Section id="8" num="08" title="Your Rights">
            <p>Depending on your location, you may have the following rights regarding your personal data:</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', margin: '16px 0' }}>
              {[
                { title: 'Access & Portability', desc: 'Request a copy of the personal data we hold about you in a portable format.' },
                { title: 'Correction', desc: 'Request that we correct any inaccurate or incomplete personal data we hold.' },
                { title: 'Deletion', desc: 'Request the deletion of your personal data, subject to certain legal obligations.' },
                { title: 'Objection & Restriction', desc: 'Object to or restrict how we process your data in certain circumstances.' },
              ].map(c => <Card key={c.title} title={c.title} desc={c.desc} />)}
            </div>
            <p>To exercise any of these rights, please contact us at hello@lunaletsgo.com. We will respond to all requests within 30 days.</p>
          </Section>

          <Section id="9" num="09" title="Security">
            <p>We implement appropriate technical and organisational measures to protect your personal information, including:</p>
            <BulletList items={[
              'SSL/TLS encryption for all data transmitted between your browser and our servers',
              'AES-256 encryption for sensitive data stored at rest',
              'Regular security audits and penetration testing',
              'Strict access controls and two-factor authentication for internal systems',
              'Employee training on data protection and security best practices',
            ]} />
            <Highlight>No method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security. If you become aware of any security breach, please notify us immediately.</Highlight>
          </Section>

          <Section id="10" num="10" title="Children's Privacy">
            <p>Our Service is not directed to children under the age of 13. We do not knowingly collect personally identifiable information from children under 13.</p>
            <p>If you are a parent or guardian and believe your child has provided us with personal information, please contact us immediately at hello@lunaletsgo.com. We will take prompt steps to remove such information from our systems.</p>
          </Section>

          <Section id="11" num="11" title="Changes to This Policy">
            <p>We may update this Privacy Policy from time to time to reflect changes in our practices or legal requirements. When we make significant changes, we will:</p>
            <BulletList items={[
              'Post the updated policy on this page with a new "Last Updated" date',
              'Send an email notification to registered users for material changes',
              'Display a prominent notice on our platform for 30 days following the update',
            ]} />
            <p>Your continued use of the Service after any changes constitutes your acceptance of the revised policy.</p>
          </Section>

          <Section id="12" num="12" title="Contact Us">
            <p>If you have any questions about this Privacy Policy, wish to exercise your rights, or have concerns about how we handle your data, please get in touch.</p>
            <div style={{
              background: '#0B2A4A', borderRadius: '12px', padding: '28px 32px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '24px', marginTop: '16px', flexWrap: 'wrap'
            }}>
              <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '15px', lineHeight: 1.6 }}>
                <strong style={{ color: '#fff', display: 'block', fontFamily: "'Poppins', sans-serif", fontSize: '17px', marginBottom: '6px' }}>Privacy & Data Team</strong>
                We are here to help with any privacy-related questions or requests. We aim to respond within 2 business days.
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
