import { useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { DesignHero } from "../components/design/DesignHero";
import { DesignIntro } from "../components/design/DesignIntro";
import { DesignGallery } from "../components/design/DesignGallery";
import { DesignCTA } from "../components/design/DesignCTA";
import { contentService } from "../services/content.service";
import type { DesignSettings } from "../types/content";

const EMPTY_DESIGN: DesignSettings = {
  hero_image: "",
  hero_title: "Diseño que transforma espacios.",
  intro_title: "Diseño & Paisajismo integral",
  intro_text: "",
  projects: [],
};

export function Design() {
  // Se pide una sola vez acá y se reparte por props a las secciones, en vez
  // de que cada una haga su propio fetch — todas necesitan el mismo documento.
  const [data, setData] = useState<DesignSettings>(EMPTY_DESIGN);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentService
      .getDesign()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout>
        <section className="min-h-[420px] md:min-h-[520px] bg-cream" />
      </Layout>
    );
  }

  return (
    <Layout>
      <DesignHero title={data.hero_title} image={data.hero_image} />
      <DesignIntro title={data.intro_title} text={data.intro_text} />
      <DesignGallery projects={data.projects} />
      <DesignCTA />
    </Layout>
  );
}
