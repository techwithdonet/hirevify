"use client";

import { useEffect } from "react";
import { usePremiumAccess } from "../utils/premium";

const UPGRADE_ACTION_TEXT =
  /^(upgrade|upgrade to pro|upgrade to unlock|upgrade to premium|view pro access|go pro|get pro|unlock pro)$/i;

const PREMIUM_BADGE_TEXT =
  /^premium feature$/i;

const PROMOTION_HEADING_TEXT =
  /^unlock .*(features|access)$/i;

function normalizeText(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function hideElement(element: HTMLElement): void {
  if (element.dataset.hirevifyProUpgradeHidden === "true") {
    return;
  }

  element.dataset.hirevifyProUpgradeHidden = "true";
  element.style.setProperty("display", "none", "important");
}

function restoreElements(): void {
  document
    .querySelectorAll<HTMLElement>(
      '[data-hirevify-pro-upgrade-hidden="true"]'
    )
    .forEach((element) => {
      element.style.removeProperty("display");
      delete element.dataset.hirevifyProUpgradeHidden;
    });
}

function hideUpgradeElementsForPro(): void {
  document
    .querySelectorAll<HTMLElement>(
      'button, a, [role="button"], [data-slot="badge"], span, div'
    )
    .forEach((element) => {
      const text = normalizeText(element.textContent || "");

      if (
        UPGRADE_ACTION_TEXT.test(text) ||
        PREMIUM_BADGE_TEXT.test(text)
      ) {
        hideElement(element);
      }
    });

  // Remove full promotional cards such as
  // "Unlock Portfolio Features" for active Pro users.
  document
    .querySelectorAll<HTMLElement>("h1, h2, h3, h4")
    .forEach((heading) => {
      const text = normalizeText(heading.textContent || "");

      if (!PROMOTION_HEADING_TEXT.test(text)) {
        return;
      }

      const promotionCard = heading.closest<HTMLElement>(
        '[data-slot="card"], section, article'
      );

      if (promotionCard) {
        hideElement(promotionCard);
      }
    });
}

export function ProUpgradeCleanup() {
  const { getSubscription } = usePremiumAccess();
  const subscription = getSubscription();

  const isActivePro =
    subscription?.tier === "pro" &&
    subscription?.isActive === true;

  useEffect(() => {
    if (!isActivePro) {
      restoreElements();
      return;
    }

    hideUpgradeElementsForPro();

    const observer = new MutationObserver(() => {
      hideUpgradeElementsForPro();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    return () => {
      observer.disconnect();
    };
  }, [isActivePro]);

  return null;
}