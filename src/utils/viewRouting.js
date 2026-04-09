import { useCallback, useEffect, useRef, useState } from "react";

const DEFAULT_VIEW = { screen: "home" };
const KNOWN_SCREENS = new Set([
  "home",
  "active",
  "collections",
  "sheet",
  "queue",
  "planner",
  "directory",
]);

function sanitizeString(value)
{
  return typeof value === "string" ? value.trim() : "";
}

export function normalizeView(view, fallbackView = DEFAULT_VIEW)
{
  const fallback = view && typeof view === "object" && KNOWN_SCREENS.has(view.screen)
    ? view
    : fallbackView;
  const screen = KNOWN_SCREENS.has(view?.screen) ? view.screen : fallback.screen || DEFAULT_VIEW.screen;

  if (screen === "sheet")
  {
    const sheetKey = sanitizeString(view?.sheetKey || fallback?.sheetKey);

    return sheetKey ? { screen, sheetKey } : { screen: "collections" };
  }

  if (screen === "collections")
  {
    const worldKey = sanitizeString(view?.worldKey || fallback?.worldKey);

    return worldKey ? { screen, worldKey } : { screen };
  }

  return { screen };
}

export function buildViewHash(view)
{
  const normalizedView = normalizeView(view);

  switch (normalizedView.screen)
  {
    case "active":
      return "#/active";
    case "collections":
      return normalizedView.worldKey
        ? `#/collections/${encodeURIComponent(normalizedView.worldKey)}`
        : "#/collections";
    case "sheet":
      return `#/sheet/${encodeURIComponent(normalizedView.sheetKey)}`;
    case "queue":
      return "#/queue";
    case "planner":
      return "#/planner";
    case "directory":
      return "#/directory";
    case "home":
    default:
      return "#/";
  }
}

export function getViewHref(view)
{
  return buildViewHash(view);
}

export function parseViewHash(hash, fallbackView = DEFAULT_VIEW)
{
  const normalizedHash = sanitizeString(hash).replace(/^#/, "");
  const route = normalizedHash.replace(/^\/+/, "");

  if (!route)
  {
    return normalizeView(fallbackView, DEFAULT_VIEW);
  }

  const [screenSegment, ...rest] = route.split("/").filter(Boolean);
  const detailSegment = rest.length > 0 ? decodeURIComponent(rest.join("/")) : "";

  switch (screenSegment)
  {
    case "active":
      return { screen: "active" };
    case "collections":
      return detailSegment
        ? { screen: "collections", worldKey: detailSegment }
        : { screen: "collections" };
    case "sheet":
      return detailSegment
        ? { screen: "sheet", sheetKey: detailSegment }
        : normalizeView(fallbackView, DEFAULT_VIEW);
    case "queue":
      return { screen: "queue" };
    case "planner":
      return { screen: "planner" };
    case "directory":
      return { screen: "directory" };
    case "":
      return { screen: "home" };
    default:
      return normalizeView(fallbackView, DEFAULT_VIEW);
  }
}

export function areViewsEqual(a, b)
{
  const left = normalizeView(a);
  const right = normalizeView(b);

  return (
    left.screen === right.screen
    && sanitizeString(left.sheetKey) === sanitizeString(right.sheetKey)
    && sanitizeString(left.worldKey) === sanitizeString(right.worldKey)
  );
}

function readWindowView(fallbackView)
{
  if (typeof window === "undefined")
  {
    return normalizeView(fallbackView, DEFAULT_VIEW);
  }

  return parseViewHash(window.location.hash, fallbackView);
}

function buildViewUrl(hash)
{
  return `${window.location.pathname}${window.location.search}${hash}`;
}

export function useHashRouteView(initialView)
{
  const initialViewRef = useRef(normalizeView(initialView, DEFAULT_VIEW));
  const [view, setViewState] = useState(() => readWindowView(initialViewRef.current));

  useEffect(() =>
  {
    if (typeof window === "undefined")
    {
      return undefined;
    }

    const syncFromLocation = () =>
    {
      const nextView = readWindowView(initialViewRef.current);

      setViewState((currentView) =>
        (areViewsEqual(currentView, nextView) ? currentView : nextView)
      );
    };

    if (!window.location.hash)
    {
      const initialHash = buildViewHash(initialViewRef.current);
      window.history.replaceState({ view: initialViewRef.current }, "", buildViewUrl(initialHash));
    }

    syncFromLocation();
    window.addEventListener("hashchange", syncFromLocation);
    window.addEventListener("popstate", syncFromLocation);

    return () =>
    {
      window.removeEventListener("hashchange", syncFromLocation);
      window.removeEventListener("popstate", syncFromLocation);
    };
  }, []);

  const setView = useCallback((nextView, options = {}) =>
  {
    const resolvedView = typeof nextView === "function" ? nextView(view) : nextView;
    const normalizedView = normalizeView(resolvedView, initialViewRef.current);

    setViewState((currentView) =>
      (areViewsEqual(currentView, normalizedView) ? currentView : normalizedView)
    );

    if (typeof window === "undefined")
    {
      return;
    }

    const nextHash = buildViewHash(normalizedView);
    const nextUrl = buildViewUrl(nextHash);
    const currentUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;

    if (currentUrl === nextUrl)
    {
      return;
    }

    const historyMethod = options.replace ? "replaceState" : "pushState";
    window.history[historyMethod]({ view: normalizedView }, "", nextUrl);
  }, [view]);

  return [view, setView];
}
