type CSSProperties = {
  fontSize: string;
  paddingBottom: string;
  zIndex: string;
  opacity: string;
};

interface StyleUpdate {
  selector: string;
  styles: Partial<CSSProperties>;
}

export function initCards(): void {
  const pCards = document.querySelectorAll<HTMLElement>(".pCard");
  if (pCards.length === 0) return;

  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeouts: Record<string, ReturnType<typeof setTimeout>> = {};

  const setTimeoutWithKey = (key: string, callback: () => void, delay: number): void => {
    if (timeouts[key]) clearTimeout(timeouts[key]);
    timeouts[key] = setTimeout(() => {
      callback();
      delete timeouts[key];
    }, delay);
  };

  const calculateDimensions = (): void => {
    const cardsContainer = document.querySelector<HTMLElement>("#casos > div");
    if (!cardsContainer) return;

    const containerWidth = cardsContainer.clientWidth;
    const totalCards = pCards.length;
    const growFactor = 4;
    const shrinkFactor = 1;
    const totalFlex = (totalCards - 1) * shrinkFactor + growFactor;
    const maxCardWidth = Math.round((containerWidth * growFactor) / totalFlex) - 9;

    [".tags", ".card_carousel"].forEach((clase) =>
      document.querySelectorAll<HTMLElement>(clase).forEach((el) => {
        el.style.width = `${maxCardWidth}px`;
      })
    );

    let maxEstimatedHeight = 0;
    document.querySelectorAll<HTMLElement>(".card_carousel").forEach((carousel) => {
      carousel.querySelectorAll("img").forEach((img) => {
        const aspectRatio = img.naturalHeight / img.naturalWidth;
        maxEstimatedHeight = Math.max(maxEstimatedHeight, maxCardWidth * aspectRatio);
      });
    });

    pCards.forEach((pCard) => {
      pCard.style.setProperty("--carousel-height", `${maxEstimatedHeight}px`);
    });
  };

  const updateStyles = (hoveredCard: HTMLElement): void => {
    const tagsEl = hoveredCard.querySelector<HTMLElement>(".tags");
    const carouselEl = hoveredCard.querySelector(".card_carousel");
    if (!tagsEl || !carouselEl) return;

    const rootFontSize = parseFloat(getComputedStyle(document.documentElement).fontSize);

    const styleUpdatesHovered: StyleUpdate[] = [
      { selector: "p", styles: { fontSize: "1rem", paddingBottom: `${tagsEl.offsetHeight - rootFontSize}px` } },
      { selector: ".tags", styles: { zIndex: "11" } },
      { selector: ".imageCard", styles: { opacity: carouselEl.children.length !== 0 ? "0" : "1" } },
    ];

    const styleUpdatesNonHovered: StyleUpdate[] = [
      { selector: "p", styles: { fontSize: "0" } },
      { selector: ".tags", styles: { zIndex: "3" } },
    ];

    pCards.forEach((otherCard) => {
      if (otherCard === hoveredCard) {
        styleUpdatesHovered.forEach(({ selector, styles }) => {
          const element = otherCard.querySelector<HTMLElement>(selector);
          if (!element) return;
          (Object.keys(styles) as Array<keyof CSSProperties>).forEach((prop) => {
            const value = styles[prop];
            if (value !== undefined) {
              (element.style as any)[prop] = String(value);
            }
          });
        });
      } else {
        styleUpdatesHovered.forEach(({ selector, styles }) => {
          const element = otherCard.querySelector<HTMLElement>(selector);
          if (!element) return;
          (Object.keys(styles) as Array<keyof CSSProperties>).forEach((prop) => {
            const nonHoveredStyle = styleUpdatesNonHovered.find((s) => s.selector === selector);
            if (nonHoveredStyle && nonHoveredStyle.styles[prop] !== undefined) {
              (element.style as any)[prop] = nonHoveredStyle.styles[prop];
            } else {
              element.style.removeProperty(prop);
            }
          });
        });
      }
    });
  };

  const resetStyles = (): void => {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      pCards.forEach((card) => {
        ["p", ".tags", ".imageCard"].forEach((selector) => {
          const element = card.querySelector<HTMLElement>(selector);
          if (!element) return;
          ["font-size", "bottom", "opacity", "padding-bottom", "z-index"].forEach((prop) =>
            element.style.removeProperty(prop)
          );
        });
      });
    }, 99);
  };

  const initCarousel = (card: HTMLElement) => {
    const images = card.querySelectorAll<HTMLElement>(".card_carousel img");
    let currentIndex = 0;
    let direction = 1;
    let interval: ReturnType<typeof setInterval> | undefined;

    const startCarousel = (): void => {
      interval = setInterval(() => {
        images[currentIndex].style.display = "none";
        images[currentIndex].classList.remove("active");
        currentIndex += direction;

        if (currentIndex >= images.length) {
          currentIndex = images.length - 2;
          direction = -1;
        } else if (currentIndex < 0) {
          currentIndex = 1;
          direction = 1;
        }

        images[currentIndex].style.display = "block";
        images[currentIndex].classList.add("active");
      }, 1500);
    };

    const stopCarousel = (): void => {
      if (interval) clearInterval(interval);
      images.forEach((img, index) => {
        img.style.display = index === 0 ? "block" : "none";
        img.classList.toggle("active", index === 0);
      });
      currentIndex = 0;
      direction = 1;
    };

    return { startCarousel, stopCarousel };
  };

  const mediaQuery = window.matchMedia("(min-width: 425px)");

  const resizeHandler = (): void => {
    setTimeoutWithKey("resizeDimensions", calculateDimensions, 99);
  };

  const applyMediaQueryStyles = (matches: boolean): void => {
    if (matches) {
      calculateDimensions();
      window.addEventListener("resize", resizeHandler);
    } else {
      window.removeEventListener("resize", resizeHandler);
    }
  };

  pCards.forEach((card) => {
    const { startCarousel, stopCarousel } = initCarousel(card);

    card.addEventListener("mouseover", () => {
      startCarousel();
      if (timeoutId) clearTimeout(timeoutId);
      updateStyles(card);
    });

    card.addEventListener("mouseout", () => {
      stopCarousel();
      resetStyles();
    });
  });

  mediaQuery.addEventListener("change", (e) => applyMediaQueryStyles(e.matches));
  applyMediaQueryStyles(mediaQuery.matches);
}
