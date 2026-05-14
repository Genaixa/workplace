import Link from "next/link";

export default function Footer() {
  return (
    <footer style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)" }}>
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <Link href="/">
            <img
              src="https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/twp-logo-white.png"
              alt="The Work Place"
              className="h-16 w-auto mb-4"
            />
          </Link>
          <p className="text-sm opacity-60 leading-relaxed">
            A shared office space for dynamic women.
          </p>
        </div>

        <div>
          <h4 className="text-xs tracking-widest uppercase opacity-50 mb-4">Location</h4>
          <address className="not-italic text-sm opacity-80 leading-relaxed">
            Unit 5, Former Swallow Hotel<br />
            High West Street<br />
            Gateshead, NE8 1PE
          </address>
        </div>

        <div>
          <h4 className="text-xs tracking-widest uppercase opacity-50 mb-4">Contact</h4>
          <ul className="text-sm opacity-80 space-y-2">
            <li>
              <a href="tel:01914683968" className="hover:opacity-100 opacity-80 transition-opacity">
                0191 468 3968
              </a>
            </li>
            <li>
              <a href="mailto:info@theworkplaceuk.co.uk" className="hover:opacity-100 opacity-80 transition-opacity">
                info@theworkplaceuk.co.uk
              </a>
            </li>
            <li>
              <a href="https://wa.me/441914683968" className="hover:opacity-100 opacity-80 transition-opacity">
                WhatsApp
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div
        className="border-t px-6 py-4 text-center text-xs opacity-40"
        style={{ borderColor: "rgba(245,240,235,0.15)" }}
      >
        © 2026 The Work Place Ltd. All Rights Reserved.
      </div>
    </footer>
  );
}
