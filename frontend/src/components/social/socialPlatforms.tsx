import type { SocialPlatform } from "../../types/content";

/** Metadatos de cada red social soportada: etiqueta para el admin, ejemplo
 * de URL para el placeholder, e ícono para el footer. Para sumar una red
 * nueva alcanza con agregar una entrada acá y el literal en
 * `SocialPlatform` (frontend y backend). */
interface PlatformMeta {
  label: string;
  placeholder: string;
  icon: (props: { size?: number }) => JSX.Element;
}

export const SOCIAL_PLATFORMS: Record<SocialPlatform, PlatformMeta> = {
  instagram: {
    label: "Instagram",
    placeholder: "https://instagram.com/tu-usuario",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="2" width="20" height="20" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  facebook: {
    label: "Facebook",
    placeholder: "https://facebook.com/tu-pagina",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
      </svg>
    ),
  },
  pinterest: {
    label: "Pinterest",
    placeholder: "https://pinterest.com/tu-usuario",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2C6.48 2 2 6.48 2 12c0 4.24 2.65 7.86 6.39 9.29-.09-.78-.17-1.98.04-2.83.19-.77 1.27-5.38 1.27-5.38s-.32-.65-.32-1.61c0-1.51.88-2.64 1.97-2.64.93 0 1.38.7 1.38 1.54 0 .94-.6 2.34-.91 3.64-.26 1.09.54 1.97 1.6 1.97 1.92 0 3.4-2.02 3.4-4.94 0-2.58-1.86-4.39-4.51-4.39-3.07 0-4.87 2.3-4.87 4.68 0 .93.36 1.92.8 2.46.09.11.1.2.07.31-.08.33-.26 1.09-.3 1.24-.05.2-.17.24-.38.14-1.39-.65-2.26-2.69-2.26-4.33 0-3.51 2.55-6.74 7.36-6.74 3.86 0 6.86 2.75 6.86 6.42 0 3.83-2.41 6.91-5.76 6.91-1.12 0-2.18-.58-2.54-1.27l-.69 2.58c-.25.96-.93 2.17-1.38 2.9.04.01.07.03.11.04" />
      </svg>
    ),
  },
  x: {
    label: "X (Twitter)",
    placeholder: "https://x.com/tu-usuario",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  youtube: {
    label: "YouTube",
    placeholder: "https://youtube.com/@tu-canal",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z" />
        <polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  tiktok: {
    label: "TikTok",
    placeholder: "https://tiktok.com/@tu-usuario",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M16.5 3h-3v13.1a2.6 2.6 0 1 1-2.6-2.6c.27 0 .53.04.78.12V10.5a5.9 5.9 0 0 0-.78-.05 5.55 5.55 0 1 0 5.55 5.55V8.83a7.3 7.3 0 0 0 4.28 1.37V7.1a4.3 4.3 0 0 1-4.28-4.1z" />
      </svg>
    ),
  },
  linkedin: {
    label: "LinkedIn",
    placeholder: "https://linkedin.com/company/tu-empresa",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-4 0v7h-4v-7a6 6 0 0 1 6-6z" />
        <rect x="2" y="9" width="4" height="12" />
        <circle cx="4" cy="4" r="2" />
      </svg>
    ),
  },
  threads: {
    label: "Threads",
    placeholder: "https://threads.net/@tu-usuario",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.19 2c3.02 0 5.28 1 6.72 2.98 1.06 1.46 1.63 3.5 1.7 6.08v.02c0 5.9-2.98 8.9-8.14 8.92h-.01c-3.1-.02-5.44-1.08-6.95-3.15C4.15 15.02 3.5 12.9 3.5 12v-.02c.03-2.6.6-4.63 1.67-6.09C6.6 3.9 8.86 2.9 11.88 2.87zm.16 2.28h-.13c-1.83.02-3.2.53-4.08 1.53-.83.94-1.26 2.36-1.28 4.22 0 .96.4 3.24 1.72 4.7 1.06 1.18 2.58 1.79 4.5 1.8h.01c1.9-.01 3.24-.46 4.15-1.4.75-.78 1.13-1.87 1.13-3.24 0-.36-.03-.7-.08-1a3.36 3.36 0 0 0-.5-.13 8 8 0 0 0-1.1-.08c-.55 1.55-1.7 2.42-3.32 2.44-1 .01-1.86-.33-2.42-.96a2.36 2.36 0 0 1-.6-1.65c.03-1.42 1.28-2.28 3.18-2.28.5 0 .97.03 1.4.1-.05-.35-.16-.65-.34-.87-.28-.35-.75-.53-1.4-.54h-.04c-.5 0-1.2.14-1.63.8l-1.87-1.26c.72-1.1 1.9-1.7 3.5-1.7h.05c2.7.02 4.3 1.68 4.55 4.55.15.02.3.05.43.08 1.9.45 2.68 1.65 2.68 3.35 0 2-1.5 4.28-5.66 4.3h-.06c-2.55-.02-4.5-.85-5.82-2.32C6.68 15.6 6 13.28 6 12c.02-1.9.5-3.4 1.42-4.44 1.1-1.24 2.78-1.88 4.98-1.9z" />
      </svg>
    ),
  },
  whatsapp: {
    label: "WhatsApp",
    placeholder: "https://wa.me/5493811234567",
    icon: ({ size = 14 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    ),
  },
};

export const SOCIAL_PLATFORM_OPTIONS = (
  Object.keys(SOCIAL_PLATFORMS) as SocialPlatform[]
).map((value) => ({ value, label: SOCIAL_PLATFORMS[value].label }));

export function SocialIcon({ platform, size }: { platform: SocialPlatform; size?: number }) {
  const meta = SOCIAL_PLATFORMS[platform];
  if (!meta) return null;
  return meta.icon({ size });
}
