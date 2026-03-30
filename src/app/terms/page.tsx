import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service | Spentum',
  description: 'Read the Spentum terms of service. Personal finance tracking for non-commercial personal use.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0C1F1E] px-4 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center gap-3 mb-10">
          <div className="w-[90px] h-[90px] rounded-xl overflow-hidden flex-shrink-0">
            <Image src="/spentum.png" alt="Spentum" width={90} height={90} className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-xs text-white/30 uppercase tracking-widest font-semibold">Spentum</p>
            <h1 className="text-xl font-bold text-white leading-none">Terms of Service</h1>
          </div>
        </div>
        <p className="text-xs text-white/30 mb-10">Last updated: March 2026</p>

        <div className="flex flex-col gap-8 text-sm text-white/60 leading-relaxed">

          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account or using Spentum, you agree to these Terms of Service. If you do not agree, please do not use the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Description of Service</h2>
            <p>Spentum is a personal finance dashboard that lets you track income and expenses, view projected balances, and plan your finances. The service is provided as-is for personal, non-commercial use.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Your Account</h2>
            <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity that occurs under your account. You must provide a valid email address to create an account. You may not share your account with others.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Your Data</h2>
            <p>You own all financial data you enter into Spentum. We do not sell, share, or monetise your data. You can delete your account and all associated data at any time by contacting us.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Acceptable Use</h2>
            <p>You agree not to misuse the service, including attempting to access other users&apos; data, reverse engineering the application, or using it for any unlawful purpose.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Disclaimer of Warranties</h2>
            <p>Spentum is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that the service will be uninterrupted or error-free, or that balance projections will be accurate. This tool is for personal planning purposes only and does not constitute financial advice.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Limitation of Liability</h2>
            <p>To the fullest extent permitted by law, Spentum and its creators shall not be liable for any indirect, incidental, or consequential damages arising from your use of the service.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Changes to These Terms</h2>
            <p>We may update these Terms from time to time. Continued use of the service after changes constitutes acceptance of the updated Terms.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Contact</h2>
            <p>If you have any questions about these Terms, please reach out via the contact details on our website.</p>
          </section>

        </div>

        <div className="mt-12 pt-8 border-t border-white/[0.06] flex gap-4 text-sm text-white/30">
          <Link href="/privacy" className="hover:text-white/60 transition-colors">Privacy Policy</Link>
          <span>·</span>
          <Link href="/login" className="hover:text-white/60 transition-colors">Back to sign in</Link>
        </div>
      </div>
    </div>
  );
}
