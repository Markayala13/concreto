"use client";

import { useEffect } from "react";
import { RUBIO_MARKUP } from "./markup";
import "./rubioconcrete.css";
import "./man-overrides.css";

/**
 * Rubio Concrete Construction — single-page clone of https://www.rubioconcrete.com/
 *
 * The source is a hand-authored, self-contained static page. To preserve it
 * exactly, the original markup is rendered verbatim and the original inline
 * scripts (sticky header, mobile nav, marquee loop, scroll reveal, estimate
 * forms, EN/ES i18n) are ported into the effect below.
 */
export function RubioConcrete() {
  useEffect(() => {
    const d = document;

    // --- current year -----------------------------------------------------
    const yr = d.getElementById("yr");
    if (yr) yr.textContent = String(new Date().getFullYear());

    // --- sticky header shadow --------------------------------------------
    const header = d.querySelector<HTMLElement>(".header");
    const onScroll = () => header?.classList.toggle("scrolled", window.scrollY > 10);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });

    // --- mobile nav -------------------------------------------------------
    const burger = d.querySelector<HTMLElement>(".burger");
    const mnav = d.getElementById("mnav");
    const scrim = d.getElementById("scrim");
    const setMenu = (open: boolean) => {
      mnav?.classList.toggle("open", open);
      scrim?.classList.toggle("show", open);
      burger?.setAttribute("aria-expanded", open ? "true" : "false");
      d.body.style.overflow = open ? "hidden" : "";
    };
    const onBurger = () => setMenu(!mnav?.classList.contains("open"));
    const onScrim = () => setMenu(false);
    burger?.addEventListener("click", onBurger);
    scrim?.addEventListener("click", onScrim);
    const mnavLinks = mnav ? Array.from(mnav.querySelectorAll("a")) : [];
    const onLink = () => setMenu(false);
    mnavLinks.forEach((a) => a.addEventListener("click", onLink));

    // --- marquee seamless loop (guard against double-run) -----------------
    const marq = d.getElementById("marq");
    if (marq && marq.dataset.looped !== "1") {
      marq.innerHTML += marq.innerHTML;
      marq.dataset.looped = "1";
    }

    // --- reveal on scroll -------------------------------------------------
    const reduce = window.matchMedia("(prefers-reduced-motion:reduce)").matches;
    const reveals = Array.from(d.querySelectorAll<HTMLElement>(".reveal"));
    let io: IntersectionObserver | null = null;
    let failsafe: number | undefined;
    if (reduce || !("IntersectionObserver" in window)) {
      reveals.forEach((e) => e.classList.add("in"));
    } else {
      io = new IntersectionObserver(
        (entries) => {
          entries.forEach((en) => {
            if (en.isIntersecting) {
              en.target.classList.add("in");
              io?.unobserve(en.target);
            }
          });
        },
        { threshold: 0.12, rootMargin: "0px 0px -8% 0px" },
      );
      reveals.forEach((e) => io!.observe(e));
      failsafe = window.setTimeout(() => reveals.forEach((e) => e.classList.add("in")), 2500);
    }

    // --- animated number counters ----------------------------------------
    const counters = Array.from(d.querySelectorAll<HTMLElement>("[data-count]"));
    const runCount = (el: HTMLElement) => {
      const target = parseFloat(el.getAttribute("data-count") || "0");
      const suffix = el.getAttribute("data-suffix") || "";
      const prefix = el.getAttribute("data-prefix") || "";
      if (reduce) {
        el.textContent = prefix + target + suffix;
        return;
      }
      const dur = 1400;
      const start = performance.now();
      const step = (now: number) => {
        const p = Math.min(1, (now - start) / dur);
        const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
        el.textContent = prefix + Math.round(target * eased) + suffix;
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = prefix + target + suffix;
      };
      requestAnimationFrame(step);
    };
    let countObs: IntersectionObserver | null = null;
    if (counters.length) {
      if (reduce || !("IntersectionObserver" in window)) {
        counters.forEach(runCount);
      } else {
        countObs = new IntersectionObserver(
          (entries) => {
            entries.forEach((en) => {
              if (en.isIntersecting) {
                runCount(en.target as HTMLElement);
                countObs?.unobserve(en.target);
              }
            });
          },
          { threshold: 0.4 },
        );
        counters.forEach((c) => countObs!.observe(c));
      }
    }

    // --- hero video: honor reduced-motion ---------------------------------
    const heroVid = d.querySelector<HTMLVideoElement>(".hero-video");
    if (heroVid && reduce) {
      heroVid.removeAttribute("autoplay");
      heroVid.pause();
    }

    // --- estimate forms: POST to send.php, mailto fallback ----------------
    const wire = (formId: string, okId: string) => {
      const form = d.getElementById(formId) as HTMLFormElement | null;
      if (!form || form.dataset.wired === "1") return;
      form.dataset.wired = "1";
      const okBox = d.getElementById(okId);
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        const data = new FormData(form);
        const name = String(data.get("name") || "").trim();
        const phone = String(data.get("phone") || "").trim();
        if (!name || !phone) {
          const firstEmpty = (!name
            ? form.querySelector("[name=name]")
            : form.querySelector("[name=phone]")) as HTMLElement | null;
          firstEmpty?.focus();
          if (firstEmpty) firstEmpty.style.borderColor = "var(--red)";
          return;
        }
        const showOk = () => {
          form.style.display = "none";
          okBox?.classList.add("show");
        };
        const mailtoFallback = () => {
          const lines = [
            "New estimate request from RubioConcrete.com",
            "",
            "Name: " + name,
            "Phone: " + phone,
            data.get("email") ? "Email: " + data.get("email") : null,
            data.get("zip") ? "ZIP/Area: " + data.get("zip") : null,
            "Service: " + (data.get("service") || ""),
            data.get("message") ? "Details: " + data.get("message") : null,
          ]
            .filter(Boolean)
            .join("\n");
          const subject =
            "Estimate request — " + name + " (" + (data.get("service") || "concrete") + ")";
          window.location.href =
            "mailto:contact@rubioconcrete.com?subject=" +
            encodeURIComponent(subject) +
            "&body=" +
            encodeURIComponent(lines);
          showOk();
        };
        form.classList.add("sending");
        fetch(form.getAttribute("action") || "send.php", {
          method: "POST",
          headers: { Accept: "application/json", "X-Requested-With": "XMLHttpRequest" },
          body: data,
        })
          .then((r) => (r.ok ? r.json().catch(() => ({ ok: true })) : Promise.reject()))
          .then((res: { ok?: boolean }) => {
            form.classList.remove("sending");
            if (res && res.ok === false) mailtoFallback();
            else showOk();
          })
          .catch(() => {
            form.classList.remove("sending");
            mailtoFallback();
          });
      });
    };
    wire("quoteForm", "formOk");
    wire("quoteForm2", "formOk2");

    // --- EN / ES language toggle -----------------------------------------
    const TITLES: Record<string, string> = {
      en: "M.A.N Concrete and Landscaping · Concrete Contractor in Omaha, NE",
      es: "M.A.N Concrete and Landscaping · Contratista de Concreto en Omaha, NE",
    };
    d.querySelectorAll<HTMLElement>("[data-es]").forEach((el) => {
      if (el.getAttribute("data-en") === null) el.setAttribute("data-en", el.innerHTML);
    });
    d.querySelectorAll<HTMLElement>("[data-es-ph]").forEach((el) => {
      if (el.getAttribute("data-en-ph") === null)
        el.setAttribute("data-en-ph", el.getAttribute("placeholder") || "");
    });
    const apply = (lang: string) => {
      const es = lang === "es";
      d.documentElement.lang = es ? "es" : "en";
      d.querySelectorAll<HTMLElement>("[data-es]").forEach((el) => {
        const v = es ? el.getAttribute("data-es") : el.getAttribute("data-en");
        if (v !== null) el.innerHTML = v;
      });
      d.querySelectorAll<HTMLElement>("[data-es-ph]").forEach((el) => {
        const v = es ? el.getAttribute("data-es-ph") : el.getAttribute("data-en-ph");
        el.setAttribute("placeholder", v || "");
      });
      if (TITLES[lang]) d.title = TITLES[lang];
      d.querySelectorAll<HTMLElement>(".lang-btn").forEach((b) => {
        const on = b.getAttribute("data-lang") === lang;
        b.classList.toggle("active", on);
        b.setAttribute("aria-pressed", on ? "true" : "false");
      });
      try {
        localStorage.setItem("rubio_lang", lang);
      } catch {
        /* ignore */
      }
    };
    let saved: string | null = null;
    try {
      saved = localStorage.getItem("rubio_lang");
    } catch {
      /* ignore */
    }
    const initial =
      saved || ((navigator.language || "en").toLowerCase().indexOf("es") === 0 ? "es" : "en");
    apply(initial);
    const langBtns = Array.from(d.querySelectorAll<HTMLElement>(".lang-btn"));
    const langHandlers = langBtns.map((b) => {
      const h = () => apply(b.getAttribute("data-lang") || "en");
      b.addEventListener("click", h);
      return [b, h] as const;
    });

    // --- cleanup ----------------------------------------------------------
    return () => {
      window.removeEventListener("scroll", onScroll);
      burger?.removeEventListener("click", onBurger);
      scrim?.removeEventListener("click", onScrim);
      mnavLinks.forEach((a) => a.removeEventListener("click", onLink));
      io?.disconnect();
      countObs?.disconnect();
      if (failsafe) window.clearTimeout(failsafe);
      langHandlers.forEach(([b, h]) => b.removeEventListener("click", h));
    };
  }, []);

  return <div dangerouslySetInnerHTML={{ __html: RUBIO_MARKUP }} />;
}
