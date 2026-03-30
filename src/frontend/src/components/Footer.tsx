export default function Footer() {
  const year = new Date().getFullYear();
  const link = `https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`;

  return (
    <footer className="footer-navy text-white/60 py-8 mt-auto">
      <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/20 flex items-center justify-center">
            <span className="text-white text-base font-bold">T</span>
          </div>
          <span className="text-white font-semibold text-sm">Teacher App</span>
        </div>
        <p className="text-sm">
          &copy; {year}. Built with ❤️ using{" "}
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            className="text-white/80 hover:text-white underline"
          >
            caffeine.ai
          </a>
        </p>
      </div>
    </footer>
  );
}
