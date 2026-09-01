import { api } from "./api";
import type {
  AboutSettings,
  DesignSettings,
  HeroSettings,
  HeroSlide,
  InfoPageSettings,
  InfoPageSlug,
  InspirationSettings,
  SocialLink,
  SocialSettings,
} from "../types/content";

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

  async getAbout(): Promise<AboutSettings> {
    const res = await api.get("/content/about");
    return res.data;
  },

  async updateAbout(data: AboutSettings): Promise<AboutSettings> {
    const res = await api.put("/content/about", data);
    return res.data;
  },

  async uploadAboutImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/content/about/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },

  async getInspiration(): Promise<InspirationSettings> {
    const res = await api.get("/content/inspiration");
    return res.data;
  },

  async updateInspiration(data: InspirationSettings): Promise<InspirationSettings> {
    const res = await api.put("/content/inspiration", data);
    return res.data;
  },

  async uploadInspirationImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/content/inspiration/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },

  async getDesign(): Promise<DesignSettings> {
    const res = await api.get("/content/design");
    return res.data;
  },

  async updateDesign(data: DesignSettings): Promise<DesignSettings> {
    const res = await api.put("/content/design", data);
    return res.data;
  },

  async uploadDesignImage(file: File): Promise<string> {
    const form = new FormData();
    form.append("file", file);
    const res = await api.post("/content/design/images", form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
    return res.data.url as string;
  },

  async getInfoPage(slug: InfoPageSlug): Promise<InfoPageSettings> {
    const res = await api.get(`/content/info/${slug}`);
    return res.data;
  },

  async updateInfoPage(slug: InfoPageSlug, data: InfoPageSettings): Promise<InfoPageSettings> {
    const res = await api.put(`/content/info/${slug}`, data);
    return res.data;
  },

  async getSocial(): Promise<SocialSettings> {
    const res = await api.get("/content/social");
    return res.data;
  },

  async updateSocial(links: SocialLink[]): Promise<SocialSettings> {
    const res = await api.put("/content/social", { links });
    return res.data;
  },
};
