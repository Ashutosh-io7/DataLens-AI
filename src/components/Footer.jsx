import DataLensLogo from "./DataLensLogo";

function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white px-6 py-10 lg:px-16">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <DataLensLogo size={32} />

          <span className="text-lg font-bold tracking-tight text-slate-900">
            DataLens <span className="text-blue-600">AI</span>
          </span>
        </div>

        <p className="text-sm text-slate-500">
          © 2026 DataLens AI. See beyond your data.
        </p>

        <div className="flex gap-6 text-sm font-medium text-slate-500">
          <a href="#" className="transition hover:text-slate-900">
            Privacy
          </a>

          <a href="#" className="transition hover:text-slate-900">
            Terms
          </a>

          <a href="#" className="transition hover:text-slate-900">
            GitHub
          </a>
        </div>
      </div>
    </footer>
  );
}

export default Footer;