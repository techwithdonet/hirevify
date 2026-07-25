"use client";

import { useLayoutEffect } from "react";
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

function restoreElement(element: HTMLElement): void {
  element.style.removeProperty("display");
  delete element.dataset.hirevifyProUpgradeHidden;
}

function restoreElements(): void {
  document
    .querySelectorAll<HTMLElement>(
      '[data-hirevify-pro-upgrade-hidden="true"]'
    )
    .forEach(restoreElement);
}

function hideUpgradeElementsForPro(): void {
  // Older cleanup passes could mark a text-only wrapper instead of the
  // upgrade control itself. Restore those wrappers first so adjacent header
  // actions (messages, notifications, settings, and logout) remain visible.
  document
    .querySelectorAll<HTMLElement>(
      'div[data-hirevify-pro-upgrade-hidden="true"]:not([data-slot="card"]), span[data-hirevify-pro-upgrade-hidden="true"]'
    )
    .forEach(restoreElement);

  document
    .querySelectorAll<HTMLElement>(
      'button, a, [role="button"], [data-slot="badge"]'
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

  // Apply the entitlement-only cleanup before paint. Running this as a normal
  // effect lets upgrade cards appear for a frame on every refresh.
  useLayoutEffect(() => {
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
