import { useEffect } from "react";

const BASE_TITLE = "RemoteRobotics";

/**
 * Lightweight per-page SEO. Sets document.title and the meta description /
 * og:title / og:description tags, then restores the previous title on unmount.
 * A pragmatic stand-in for SSR meta management in this SPA.
 */
export const useSeo = (title: string, description?: string) => {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} • ${BASE_TITLE}` : BASE_TITLE;

    const setMeta = (selector: string, attr: "name" | "property", key: string, content?: string) => {
      if (!content) return;
      let el = document.head.querySelector<HTMLMetaElement>(selector);
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, key);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    if (description) {
      setMeta('meta[name="description"]', "name", "description", description);
      setMeta('meta[property="og:description"]', "property", "og:description", description);
    }
    setMeta('meta[property="og:title"]', "property", "og:title", document.title);

    return () => { document.title = previous; };
  }, [title, description]);
};
