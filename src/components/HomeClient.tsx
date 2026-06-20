"use client";

import Link from "next/link";
import { useState } from "react";
import ImageEditor from "@/components/ImageEditor";
import QuoteGenerator from "@/components/QuoteGenerator";

export default function HomeClient() {
  const [activeTab, setActiveTab] = useState<"editor" | "quote">("quote");

  return (
    <>
      <header className="header">
        <Link href="/" className="brand">
          <svg className="brand-icon" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" />
          </svg>
          Anticrop
        </Link>
        <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
          <button 
            className={`btn ${activeTab === 'editor' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('editor')}
          >
            Image Editor
          </button>
          <button 
            className={`btn ${activeTab === 'quote' ? 'btn-primary' : ''}`}
            onClick={() => setActiveTab('quote')}
          >
            Quote Generator
          </button>
          <div style={{ width: '1px', height: '24px', backgroundColor: 'var(--border-color)', margin: '0 10px' }} />
          <a href="#" style={{ color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.9rem' }}>
            About
          </a>
        </div>
      </header>
      {activeTab === 'editor' ? <ImageEditor /> : <QuoteGenerator />}
    </>
  );
}
