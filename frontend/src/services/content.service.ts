import { api } from "./api";
import type { HeroSettings, HeroSlide } from "../types/content";

export const contentService = {
  async getHero(): Promise<HeroSettings> {
    const res = await api.get("/content/hero");
    return res.data;
  },

  async updateHero(slides: HeroSlide[]): Promise<HeroSettings> {
    const res = await api.put("/content/hero", { slides });
    return res.data;
  },

  async uploadHeroImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/content/hero/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },
};
