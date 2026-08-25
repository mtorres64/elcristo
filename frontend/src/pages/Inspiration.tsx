import { useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { InspirationHero } from "../components/inspiration/InspirationHero";
import { InspirationIntro } from "../components/inspiration/InspirationIntro";
import { InspirationProjects } from "../components/inspiration/InspirationProjects";
import { InspirationCTA } from "../components/inspiration/InspirationCTA";
import { contentService } from "../services/content.service";
import type { InspirationSettings } from "../types/content";

const EMPTY_INSPIRATION: InspirationSettings = {
  hero_image: "",
  hero_title: "Proyectos que inspiran.",
  intro_title: "Paisajismo hecho a medida",
  intro_text: "",
  projects: [],
};

export function Inspiration() {
  // Se pide una sola vez acá y se reparte por props a las secciones, en vez
  // de que cada una haga su propio fetch — todas necesitan el mismo documento.
  const [data, setData] = useState<InspirationSettings>(EMPTY_INSPIRATION);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentService
      .getInspiration()
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
      <InspirationHero title={data.hero_title} image={data.hero_image} />
      <InspirationIntro title={data.intro_title} text={data.intro_text} />
      <InspirationProjects projects={data.projects} />
      <InspirationCTA />
    </Layout>
  );
}
