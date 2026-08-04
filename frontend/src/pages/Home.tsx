import { Layout } from "../components/layout/Layout";
import { HeroSection } from "../components/home/HeroSection";
import { CategoriesSection } from "../components/home/CategoriesSection";
import { ProductsCarousel } from "../components/home/ProductsCarousel";
import { ServicesSection } from "../components/home/ServicesSection";
import { InspirationSection } from "../components/home/InspirationSection";
import { TestimonialsSection } from "../components/home/TestimonialsSection";
import { TrustStrip } from "../components/home/TrustStrip";
import { NewsletterSection } from "../components/home/NewsletterSection";

export function Home() {
  return (
    <Layout>
      <HeroSection />
      <CategoriesSection />
      <ProductsCarousel />
      <ServicesSection />
      <InspirationSection />
      <TestimonialsSection />
      <TrustStrip />
      <NewsletterSection />
    </Layout>
  );
}
