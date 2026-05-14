"use client";
import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/#about", label: "About" },
  { href: "/#memberships", label: "Memberships" },
  { href: "/#gallery", label: "Gallery" },
  { href: "/book", label: "Book a Desk" },
  { href: "/#contact", label: "Contact" },
];

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`site-header${scrolled ? " scrolled" : ""}`}
      style={{ color: "var(--twp-cream)" }}
    >
      <div className="max-w-6xl mx-auto px-6 flex items-center justify-between" style={{ paddingTop: 16, paddingBottom: 16 }}>
        <Link href="/" className="flex-shrink-0">
          <img
            src="https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/twp-logo-white.png"
            alt="The Work Place"
            className="site-header-logo"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm tracking-widest uppercase transition-opacity hover:opacity-70"
              style={{ color: "var(--twp-cream)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Mobile hamburger */}
        <button
          className="md:hidden flex flex-col gap-1.5 p-1"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="block w-6 h-0.5 bg-current" />
          <span className="block w-6 h-0.5 bg-current" />
          <span className="block w-6 h-0.5 bg-current" />
        </button>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <nav
          className="md:hidden border-t px-6 py-4 flex flex-col gap-4"
          style={{ borderColor: "rgba(245,240,235,0.2)", backgroundColor: "var(--twp-dark)" }}
        >
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setMenuOpen(false)}
              className="text-sm tracking-widest uppercase"
              style={{ color: "var(--twp-cream)" }}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
