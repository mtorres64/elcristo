import { useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { AboutHero } from "../components/about/AboutHero";
import { AboutStory } from "../components/about/AboutStory";
import { AboutValues } from "../components/about/AboutValues";
import { AboutGallery } from "../components/about/AboutGallery";
import { AboutCTA } from "../components/about/AboutCTA";
import { contentService } from "../services/content.service";
import type { AboutSettings } from "../types/content";

const EMPTY_ABOUT: AboutSettings = {
  hero_image: "",
  hero_title: "Nuestra historia, cultivada con paciencia.",
  intro_title: "Cultivamos espacios verdes desde hace más de dos décadas",
  intro_text: "",
  chapters: [],
  gallery: [],
};

export function AboutUs() {
  // Se pide una sola vez acá y se reparte por props a las secciones, en vez
  // de que cada una haga su propio fetch — todas necesitan el mismo documento.
  const [about, setAbout] = useState<AboutSettings>(EMPTY_ABOUT);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    contentService
      .getAbout()
      .then(setAbout)
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
      <AboutHero title={about.hero_title} image={about.hero_image} />
      <AboutStory introTitle={about.intro_title} introText={about.intro_text} chapters={about.chapters} />
      <AboutValues />
      <AboutGallery photos={about.gallery} />
      <AboutCTA />
    </Layout>
  );
}
