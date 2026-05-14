import Link from "next/link";
import ContactForm from "@/components/ContactForm";

const galleryImages = [
  "https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_150042434_HDR-1-768x1024.jpg",
  "https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_132708586_HDR-768x1024.jpg",
  "https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_150103503_HDR-768x1024.jpg",
  "https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_144752717_HDR-762x1024.jpg",
  "https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_150111360_HDR-768x1024.jpg",
  "https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_131348738_HDR-scaled.jpg",
];

export default function HomePage() {
  return (
    <>
      {/* HERO */}
      <section
        id="home"
        className="flex flex-col items-center justify-center text-center px-6 py-32"
        style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)" }}
      >
        <img
          src="https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/twp-logo-3.png"
          alt="The Work Place"
          className="w-48 h-48 object-contain mb-10"
        />
        <h1 className="text-5xl md:text-7xl mb-6" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>
          The Work Place
        </h1>
        <p className="text-sm tracking-widest uppercase opacity-60 mb-10">
          A shared office space for dynamic women
        </p>
        <div className="flex gap-4 flex-wrap justify-center">
          <Link href="#memberships" className="btn-outline">See Membership Options</Link>
          <Link
            href="/book"
            className="btn-primary"
            style={{ backgroundColor: "var(--twp-cream)", color: "var(--twp-dark)" }}
          >
            Book a Drop-in Desk
          </Link>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl mb-4">About Us</h2>
          <div className="divider" />
          <p className="text-lg opacity-70 mb-3 max-w-2xl">A shared office space for dynamic women.</p>
          <div className="divider" />
          <p className="opacity-70 max-w-2xl leading-relaxed mb-14">
            At The Work Place, we&apos;re more than just desks and WiFi. We&apos;re a supportive, professional
            environment where women come together to work, connect and grow. Whether you&apos;re a remote
            worker, self employed, studying or need a place to connect up, this is your space.
          </p>
          <div className="grid md:grid-cols-3 gap-10">
            <div>
              <h3 className="text-xl mb-3">Why We&apos;re Different</h3>
              <div className="divider" />
              <ul className="space-y-3 opacity-70 text-sm leading-relaxed">
                {["Ladies only", "Local with convenient access", "Various membership options", "Limited spaces"].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-0.5 opacity-50">✓</span> {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="md:col-span-2 grid grid-cols-2 gap-4">
              <img
                src="https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_144752717_HDR-762x1024.jpg"
                alt="The Work Place interior"
                className="w-full h-72 object-cover"
              />
              <img
                src="https://theworkplaceuk.co.uk/wp-content/uploads/2025/07/IMG_20250714_150111360_HDR-768x1024.jpg"
                alt="The Work Place interior"
                className="w-full h-72 object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* MEMBERSHIPS */}
      <section
        id="memberships"
        className="py-24 px-6"
        style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl mb-4">Work the Way You Want</h2>
          <div className="divider" />
          <p className="opacity-60 mb-12">Choose the setup that fits your flow.</p>

          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {[
              { title: "Fixed Desk", price: "£160", period: "/month", hours: "8am – 11pm", perks: ["Designated large desk and chair", "Lockable drawers"] },
              { title: "Daytime Hotdesk", price: "£85", period: "/month", hours: "8am – 5pm", perks: ["Undesignated small desk area", "Locker add-on £10/month"] },
              { title: "Evening Hotdesk", price: "£55", period: "/month", hours: "5pm – 11pm", perks: ["Undesignated small desk area", "Locker add-on £10/month"] },
            ].map((plan) => (
              <div
                key={plan.title}
                className="border p-8 flex flex-col"
                style={{ borderColor: "rgba(245,240,235,0.2)" }}
              >
                <p className="text-xs tracking-widest uppercase opacity-50 mb-4">{plan.title}</p>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-4xl" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>{plan.price}</span>
                  <span className="text-sm opacity-50">{plan.period}</span>
                </div>
                <span
                  className="inline-block text-xs tracking-widest uppercase px-3 py-1.5 mb-6 self-start"
                  style={{ border: "1px solid rgba(245,240,235,0.3)" }}
                >
                  {plan.hours}
                </span>
                <ul className="space-y-2 text-sm opacity-70 flex-1">
                  {plan.perks.map((perk) => (
                    <li key={perk} className="flex gap-2"><span>✓</span> {perk}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="text-xs opacity-40 mb-12">** All memberships include fast Wifi, kitchenette and bathroom</p>

          {/* Drop-in callout */}
          <div
            className="border p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6"
            style={{ borderColor: "rgba(245,240,235,0.3)", backgroundColor: "rgba(245,240,235,0.05)" }}
          >
            <div>
              <p className="text-xs tracking-widest uppercase opacity-50 mb-2">Drop-in Desk Pass</p>
              <div className="flex items-baseline gap-1 mb-3">
                <span className="text-4xl" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>From £8</span>
                <span className="text-sm opacity-50">/hour</span>
              </div>
              <p className="text-sm opacity-60 max-w-md">
                No commitment. Book online, pay securely, and get to work.<br />
                £8 first hour · £11 for 2hrs · £14 for 3hrs · £15 all-day pass.
              </p>
            </div>
            <Link href="/book" className="btn-outline flex-shrink-0">Book a Desk Now</Link>
          </div>
        </div>
      </section>

      {/* GETTING STARTED */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl mb-14 text-center">Getting Started is Simple</h2>
          <div className="grid md:grid-cols-3 gap-10 text-center">
            {[
              { step: "01", label: "Choose your option", desc: "Pick a membership or book a drop-in desk online." },
              { step: "02", label: "Pay securely", desc: "Quick and easy payment via SumUp at the time of booking." },
              { step: "03", label: "Get productive!", desc: "Show up, get settled, and make the most of your day." },
            ].map((s) => (
              <div key={s.step} className="flex flex-col items-center gap-3">
                <span className="text-6xl opacity-15" style={{ fontFamily: "Canela, Georgia, serif", fontWeight: 100 }}>{s.step}</span>
                <h3 className="text-xl">{s.label}</h3>
                <p className="text-sm opacity-60 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-14">
            <Link href="#memberships" className="btn-primary">See Membership Options</Link>
          </div>
        </div>
      </section>

      {/* GALLERY */}
      <section
        id="gallery"
        className="py-24 px-6"
        style={{ backgroundColor: "var(--twp-dark)", color: "var(--twp-cream)" }}
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-4xl md:text-5xl mb-4">A Beautiful Space for Bold Ideas</h2>
          <div className="divider" />
          <p className="opacity-60 mb-10">Our workplaces are thoughtfully designed to ensure productivity.</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {galleryImages.map((src, i) => (
              <img key={i} src={src} alt="The Work Place space" className="w-full h-64 object-cover" />
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT */}
      <section id="contact" className="py-24 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-16">
          <div>
            <h2 className="text-4xl md:text-5xl mb-4">Contact Us</h2>
            <div className="divider" />
            <p className="opacity-70 mb-8">Book your spot today and join a community that gets you.</p>
            <div className="space-y-4 text-sm">
              <a href="tel:01914683968" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <span>📞</span> 0191 468 3968
              </a>
              <a href="mailto:info@theworkplaceuk.co.uk" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <span>✉️</span> info@theworkplaceuk.co.uk
              </a>
              <a href="https://wa.me/441914683968" className="flex items-center gap-3 opacity-70 hover:opacity-100 transition-opacity">
                <span>💬</span> WhatsApp us
              </a>
            </div>
          </div>
          <ContactForm />
        </div>
      </section>
    </>
  );
}

