import DataLensLogo from "./DataLensLogo";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-7 lg:px-8">
      <div className="mx-auto flex max-w-6xl flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <DataLensLogo size={30} />

          <div>
            <p className="text-sm font-bold tracking-tight text-slate-900">
              DataLens <span className="text-blue-600">AI</span>
            </p>

            <p className="mt-0.5 text-[11px] text-slate-400">
              See beyond your data.
            </p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex items-center gap-6 text-xs font-medium text-slate-500">
          <a
            href="#features"
            className="transition hover:text-slate-900"
          >
            Features
          </a>

          <a
            href="#how-it-works"
            className="transition hover:text-slate-900"
          >
            How it works
          </a>

          <a
            href="#cta"
            className="transition hover:text-slate-900"
          >
            Get started
          </a>
        </nav>

        {/* Copyright */}
        <p className="text-[11px] text-slate-400">
          © 2026 DataLens AI
        </p>
      </div>
    </footer>
  );
}

export default Footer; 