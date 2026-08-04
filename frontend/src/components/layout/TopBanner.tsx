export function TopBanner() {
  return (
    <div className="bg-[#111810] text-white py-2.5">
      <div className="max-w-screen-xl mx-auto px-6 flex items-center justify-center gap-0 md:gap-12">
        <Item icon={<TruckIcon />} text="Envíos a todo el país" />
        <Divider />
        <Item icon={<ChatIcon />} text="Asesoramiento en diseño y paisajismo" />
        <Divider />
        <Item icon={<PhoneIcon />} text="Atención personalizada" />
      </div>
    </div>
  );
}

function Item({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-2 py-0.5">
      <span className="text-[#9CAF9E] shrink-0">{icon}</span>
      <span className="text-xs tracking-wide text-[#D5D9D4]">{text}</span>
    </div>
  );
}

function Divider() {
  return <div className="hidden md:block w-px h-4 bg-[#3A4A3C] mx-2" />;
}

function TruckIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M1 3h15v13H1zM16 8h4l3 3v5h-7V8z" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12 19.79 19.79 0 0 1 1.61 3.41 2 2 0 0 1 3.6 1.21h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 8.77a16 16 0 0 0 6.29 6.29l.97-.97a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}
