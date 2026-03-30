import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy | Spentum',
  description: 'Read the Spentum privacy policy. We collect only what is necessary, never sell your data, and store everything securely.',
};

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0C1F1E] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-[90px] h-[90px] rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/budget-tool.png" alt="Spentum" width={90} height={90} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Spentum</p>
            <h1 className="text-xl font-bold text-white leading-none">Privacy Policy</h1>
          </div>
        </div>
        <p className="text-xs text-white/30 mb-10">Last updated: March 2026</p>

        <div className="flex flex-col gap-8 text-sm text-white/60 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. What We Collect</h2>
            <p className="mb-2">We collect only what is necessary to provide the service:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 ml-1">
              <li><span className="text-white/80">Email address</span>, used for authentication and password resets.</li>
              <li><span className="text-white/80">Financial data you enter</span>, including transaction names, amounts, categories, dates, and any tags or goals you create.</li>
              <li><span className="text-white/80">App preferences</span>, such as currency, theme, date format, and week start day.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. How We Use Your Data</h2>
            <p>Your data is used solely to provide and improve Spentum. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Where Your Data Is Stored</h2>
            <p>Your data is stored on secure cloud infrastructure hosted in the EU region. All data is encrypted in transit (TLS) and at rest.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Data Retention</h2>
            <p>Your data is retained for as long as your account is active. You can request deletion of your account and all associated data at any time.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Cookies and Local Storage</h2>
            <p>We use browser cookies solely for authentication session management. We also use localStorage to store your theme preference for instant page loads. No tracking or advertising cookies are used.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Your Rights</h2>
            <p className="mb-2">Depending on your location, you may have the right to:</p>
            <ul className="list-disc list-inside flex flex-col gap-1.5 ml-1">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your data.</li>
              <li>Object to processing of your data.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, please contact us.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Changes to This Policy</h2>
            <p>We may update this Privacy Policy from time to time. We will notify you of significant changes via email.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Contact</h2>
            <p>If you have any questions or requests regarding your data, please contact us via the details on our website.</p>
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
