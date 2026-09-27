"use client";
import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { translateTexts } from "@/services/translationService";
import { applyTranslationOverridesToArray, resolveGlossaryTerm } from "@/utils/translationOverrides";
import { getGameLinkConfig, buildPrimaryPayload, buildRemainingPayload } from "@/services/games/gameEventRegService";

// Drives the EventReg link flow from a game start page: exposes the link
// config (when the game is linked), and wraps a join call so a
// needsRemainingFields response switches to the second step. Callers keep
// their existing join handler and just route through `submit`. The primary
// field label is translated with the same pipeline used elsewhere (glossary
// first, then the API result), so linked start pages show a localized field.
export const useGameEventRegLink = (game) => {
  const { language } = useLanguage();
  const [remainingStep, setRemainingStep] = useState(null);

  const rawLink = useMemo(() => getGameLinkConfig(game), [game]);

  const [translatedPrimaryLabel, setTranslatedPrimaryLabel] = useState(null);

  useEffect(() => {
    const label = rawLink?.primaryFieldLabel;
    if (!label) {
      setTranslatedPrimaryLabel(null);
      return;
    }
    let mounted = true;
    translateTexts([label], language)
      .then((results) => {
        if (!mounted) return;
        const translated = applyTranslationOverridesToArray(results || [], language)[0];
        setTranslatedPrimaryLabel(
          resolveGlossaryTerm(label, language) || translated || label
        );
      })
      .catch(() => {
        if (mounted) setTranslatedPrimaryLabel(label);
      });
    return () => {
      mounted = false;
    };
  }, [rawLink?.primaryFieldLabel, language]);

  const link = useMemo(() => {
    if (!rawLink) return null;
    return { ...rawLink, primaryFieldLabel: translatedPrimaryLabel || rawLink.primaryFieldLabel };
  }, [rawLink, translatedPrimaryLabel]);

  const submit = async (joinFn, payload, primaryValue = "") => {
    if (!link) {
      const res = await joinFn(payload);
      return res;
    }
    const res = await joinFn(buildPrimaryPayload(payload, primaryValue));
    if (res?.needsRemainingFields && Array.isArray(res.fields)) {
      setRemainingStep({ fields: res.fields });
    } else {
      setRemainingStep(null);
    }
    return res;
  };

  const submitWithRemaining = async (joinFn, payload, primaryValue, remainingValues) => {
    const res = await joinFn(buildRemainingPayload(payload, primaryValue, remainingValues));
    if (res?.needsRemainingFields && Array.isArray(res.fields)) {
      setRemainingStep({ fields: res.fields });
    } else {
      setRemainingStep(null);
    }
    return res;
  };

  const reset = () => setRemainingStep(null);

  return { link, remainingStep, submit, submitWithRemaining, reset };
};