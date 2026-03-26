import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0c0f1a] flex flex-col items-center justify-center px-4 text-center">
      <div className="w-12 h-12 rounded-2xl overflow-hidden mb-6">
        <Image src="/budget-tool.png" alt="BudgetTool" width={48} height={48} className="w-full h-full object-cover" />
      </div>
      <p className="text-7xl font-bold text-white/[0.06] mb-3 leading-none">404</p>
      <h1 className="text-xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm text-white/40 mb-8 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="h-9 px-5 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors inline-flex items-center"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
