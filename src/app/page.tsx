import ImageEditor from "@/components/ImageEditor";

export const metadata = {
  title: "Anticrop | Expand Your Images",
  description: "A premium tool to effortlessly expand your image canvas and add custom backgrounds.",
};

export default function Home() {
  return (
    <>
      <header className="header">
        <a href="/" className="brand">
          <svg className="brand-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          Anticrop
        </a>
        <div style={{ display: 'flex', gap: '15px' }}>
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
            About
          </a>
        </div>
      </header>
      <ImageEditor />
    </>
  );
}
