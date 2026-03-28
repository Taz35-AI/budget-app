import Link from 'next/link';
import Image from 'next/image';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0C1F1E] flex flex-col items-center justify-center px-4 text-center">
      {/* Logo — hero element */}
      <div className="w-36 h-36 rounded-[2.5rem] overflow-hidden shadow-[0_0_80px_rgba(99,102,241,0.25)] mb-8">
        <Image
          src="/budget-tool.png?v=2"
          alt="BudgetTool"
          width={144}
          height={144}
          className="w-full h-full object-cover"
          priority
        />
      </div>

      <p className="text-8xl font-black text-white/[0.05] mb-3 leading-none tracking-tight select-none">404</p>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm text-white/40 mb-8 max-w-xs">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/dashboard"
        className="h-10 px-6 rounded-xl bg-white text-slate-900 text-sm font-semibold hover:bg-slate-100 transition-colors inline-flex items-center"
      >
        Go to Dashboard
      </Link>
    </div>
  );
}
