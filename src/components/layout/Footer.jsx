/**
 * Site footer with CoolSafe branding, emergency disclaimer, and resource/support links.
 */
export default function Footer() {
  return (
    <footer
      className="px-6 py-[48px]"
      style={{ background: '#f1f5f9', borderTop: '8px solid #0056d2' }}
    >
      <div className="max-w-[1232px] mx-auto flex flex-col lg:flex-row justify-between gap-10">
        <div style={{ maxWidth: '398px' }}>
          <p
            className="font-['Public_Sans'] text-[30px] text-[#0f172a] mb-3"
            style={{ fontWeight: 900, letterSpacing: '-1.5px' }}
          >
            CoolSafe Melbourne
          </p>
          <p
            className="font-['Public_Sans'] text-[18px] text-[#475569]"
            style={{ fontWeight: 500, lineHeight: '29.25px' }}
          >
            Emergency: Call 000. This application provides information only; in extreme
            heat, follow official health advice.
          </p>
        </div>

        <div className="flex gap-[48px]">
          <div>
            <p
              className="font-['Public_Sans'] text-[14px] text-[#0f172a] uppercase mb-4"
              style={{ fontWeight: 900, letterSpacing: '1.4px' }}
            >
              Resources
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="#"
                className="font-['Public_Sans'] font-bold text-[18px] text-[#475569] underline decoration-[#cbd5e1]"
              >
                Privacy Policy
              </a>
              <a
                href="#"
                className="font-['Public_Sans'] font-bold text-[18px] text-[#475569] underline decoration-[#cbd5e1]"
              >
                Terms of Service
              </a>
            </div>
          </div>

          <div>
            <p
              className="font-['Public_Sans'] text-[14px] text-[#0f172a] uppercase mb-4"
              style={{ fontWeight: 900, letterSpacing: '1.4px' }}
            >
              Support
            </p>
            <div className="flex flex-col gap-3">
              <a
                href="#"
                className="font-['Public_Sans'] font-bold text-[18px] text-[#475569] underline decoration-[#cbd5e1]"
              >
                Contact Us
              </a>
              <a
                href="#"
                className="font-['Public_Sans'] font-bold text-[18px] text-[#475569] underline decoration-[#cbd5e1]"
              >
                Language Help
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
