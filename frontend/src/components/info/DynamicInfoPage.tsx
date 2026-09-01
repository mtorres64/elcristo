import { useEffect, useState } from "react";
import { InfoPage } from "./InfoPage";
import { Layout } from "../layout/Layout";
import { contentService } from "../../services/content.service";
import type { InfoPageSettings, InfoPageSlug } from "../../types/content";

/** Trae el contenido editable de una página de solo texto del footer y lo
 * pinta con <InfoPage>. El backend devuelve el copy por defecto cuando el
 * tenant todavía no guardó su propia versión, así que no hace falta
 * duplicar textos acá — sólo un título de respaldo para el breadcrumb
 * mientras carga o si el fetch falla. */
export function DynamicInfoPage({
  slug,
  fallbackTitle,
}: {
  slug: InfoPageSlug;
  fallbackTitle: string;
}) {
  const [data, setData] = useState<InfoPageSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    contentService
      .getInfoPage(slug)
      .then((d) => {
        if (alive) setData(d);
      })
      .catch(() => {})
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [slug]);

  if (loading) {
    return (
      <Layout>
        <section className="min-h-[420px] md:min-h-[520px] bg-cream" />
      </Layout>
    );
  }

  return (
    <InfoPage
      title={data?.title || fallbackTitle}
      sections={data?.sections ?? []}
    />
  );
}
