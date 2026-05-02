import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Spentum',
  description: 'Read the Spentum privacy policy. We collect only what is necessary, never sell your data, and store everything securely.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#011817] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-[90px] h-[90px] rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/spentum.png" alt="Spentum" width={90} height={90} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Spentum</p>
            <h1 className="text-xl font-bold text-white leading-none">Privacy Policy</h1>
          </div>
        </div>
        <p className="text-xs text-white/30 mb-10">Last updated: May 2026</p>

        <div className="flex flex-col gap-8 text-sm text-white/60 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. What We Collect</h2>
            <p className="mb-2">We collect only what is necessary to provide the service:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 ml-1">
              <li><span className="text-white/80">Email address</span>, used for authentication, password resets, and account-related communication.</li>
              <li><span className="text-white/80">Financial data you enter</span>, including transaction names, amounts, categories, dates, accounts, and any tags, budgets, or savings goals you create.</li>
              <li><span className="text-white/80">App preferences</span>, such as currency, theme, language, date format, and week start day.</li>
              <li><span className="text-white/80">Household membership</span> (if you join or create a shared household), so members can collaborate on shared finances.</li>
            </ul>
            <p className="mt-3">We do <span className="text-white/80">not</span> collect: location data, contacts, photos, calendar entries, advertising identifiers, browsing history, or any data outside the app.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p>Your data is used solely to provide and improve Spentum: to display your transactions, calculate balances and forecasts, sync across your devices, and generate optional spending insights you explicitly request. We do not sell, rent, or share your personal data with third parties for advertising or marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Third-Party Services</h2>
            <p className="mb-2">Spentum relies on the following sub-processors. Each has been chosen because it offers strong privacy protections and supports EU data-protection requirements:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 ml-1">
              <li><span className="text-white/80">Supabase</span> — authentication and database (EU region). Stores your account email and the financial data you enter.</li>
              <li><span className="text-white/80">Vercel</span> — application hosting. Receives standard server-access logs (IP address, request path, user agent) which are retained for a short period for operational purposes.</li>
              <li><span className="text-white/80">xAI / OpenAI</span> — only when you explicitly use the AI-powered CSV import or generate spending insights. We send the relevant transaction text to the AI provider to categorize or summarize it. We do not send your email, account ID, or any data unrelated to the request. AI providers may retain the request for a short period for abuse-prevention purposes only.</li>
              <li><span className="text-white/80">Google Sign-In</span> — only when you choose to sign in with Google. Google receives standard sign-in metadata.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Where Your Data Is Stored</h2>
            <p>Your data is stored on secure cloud infrastructure hosted in the European Union. All data is encrypted in transit (TLS 1.2+) and at rest (AES-256).</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. On-Device Data and Biometrics</h2>
            <p>The mobile app may use Face ID, Touch ID, or fingerprint authentication to lock the app. <span className="text-white/80">Biometric data never leaves your device</span> — it is processed entirely by your phone&apos;s secure enclave. Spentum only receives a yes/no result from the operating system. We do not store, transmit, or have access to any biometric template.</p>
            <p className="mt-2">The app caches your most recent transactions, balances, and accounts locally so you can read them when offline. This local cache is stored in encrypted device storage and is removed when you sign out or uninstall the app.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Notifications</h2>
            <p>If you enable reminders in Settings, the app schedules <span className="text-white/80">local</span> notifications on your device for upcoming bills, daily logging reminders, weekly digests, and budget alerts. These notifications are computed and stored on your device — no notification content is sent to or from our servers.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Cookies and Local Storage</h2>
            <p>We use cookies solely for authentication session management. We also use localStorage to store your theme, language, and currency preferences for instant page loads. No tracking, analytics, or advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Data Retention</h2>
            <p>Your data is retained for as long as your account is active. When you delete your account from Settings, all of your personal data and financial records are permanently removed from our systems within 30 days. Encrypted backups containing your data are also purged within 90 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Your Rights (GDPR / UK GDPR)</h2>
            <p className="mb-2">If you are in the European Economic Area, the United Kingdom, or another jurisdiction with similar laws, you have the right to:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 ml-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data (right to erasure).</li>
              <li>Export your data in a portable format (you can do this from Settings → Data → Backup).</li>
              <li>Object to or restrict our processing of your data.</li>
              <li>Lodge a complaint with your local data-protection authority.</li>
            </ul>
            <p className="mt-2">Our lawful basis for processing your data is the performance of our contract with you (providing the Spentum service). Where you opt in to AI-powered features, the lawful basis is your consent, which you can withdraw at any time by disabling those features.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Children&apos;s Privacy</h2>
            <p>Spentum is not directed to children under 13 (or under 16 in the EEA). We do not knowingly collect personal information from children. If you believe a child has provided personal information to us, please contact us and we will delete it.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">11. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. The &quot;Last updated&quot; date at the top reflects the most recent revision. Significant changes will be communicated via email or an in-app notice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">12. Contact</h2>
            <p>If you have any questions, requests, or wish to exercise any of your data-protection rights, contact us at <a href="mailto:privacy@spentum.com" className="text-white/80 underline hover:text-white">privacy@spentum.com</a>.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex gap-4 text-sm text-white/30">
          <Link href="/terms" className="hover:text-white/60 transition-colors">Terms of Service</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-white/60 transition-colors">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
