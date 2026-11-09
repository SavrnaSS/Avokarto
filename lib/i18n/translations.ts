"use client";

import { useSyncExternalStore } from "react";
import { useLanguageStore } from "@/context/languageStore";

// Keyed by the English source string (the string already hardcoded
// throughout the app) rather than an abstract id - lets existing JSX call
// t("Add To Cart") in place without inventing/threading namespaced keys
// through every component and data file that currently just renders
// English text directly. Missing keys fall back to the English source, so
// nothing ever renders blank/undefined for an untranslated string.
const translations: Record<string, { da: string; it: string }> = {
  // Header / nav
  Home: { da: "Hjem", it: "Home" },
  Shop: { da: "Butik", it: "Negozio" },
  Collections: { da: "Kollektioner", it: "Collezioni" },
  "New Arrivals": { da: "Nyheder", it: "Nuovi Arrivi" },
  "Best Sellers": { da: "Bestsellere", it: "Più Venduti" },
  About: { da: "Om Os", it: "Chi Siamo" },
  Contact: { da: "Kontakt", it: "Contatti" },
  "Track Your Order": { da: "Spor Din Ordre", it: "Traccia il Tuo Ordine" },
  Search: { da: "Søg", it: "Cerca" },
  Compare: { da: "Sammenlign", it: "Confronta" },
  Wishlist: { da: "Ønskeliste", it: "Lista Desideri" },
  Cart: { da: "Kurv", it: "Carrello" },
  "Sign In": { da: "Log Ind", it: "Accedi" },
  "Trending Now :": { da: "Populært Nu :", it: "Di Tendenza :" },
  "Track Order": { da: "Spor Ordre", it: "Traccia Ordine" },
  "Return Policy": { da: "Returpolitik", it: "Politica di Reso" },
  "Contact 24/7": { da: "Kontakt Døgnet Rundt", it: "Contatti 24/7" },
  Hotline: { da: "Hotline", it: "Assistenza" },
  "Total Cart": { da: "Kurv Total", it: "Totale Carrello" },
  Total: { da: "Total", it: "Totale" },
  "New In :": { da: "Nyheder :", it: "Novità :" },
  "Free Shipping": { da: "Fragtfrit", it: "Spedizione Gratuita" },
  "Orders of {amount} or more": {
    da: "Ved ordrer på {amount} eller mere",
    it: "Su ordini di almeno {amount}",
  },
  "Free shipping on orders of {amount} or more": {
    da: "Gratis fragt ved ordrer på {amount} eller mere",
    it: "Spedizione gratuita su ordini di almeno {amount}",
  },
  "Secure Checkout": { da: "Sikker Betaling", it: "Pagamento Sicuro" },
  "Product Details": { da: "Produktdetaljer", it: "Dettagli del prodotto" },
  "Sizes, materials & available options": {
    da: "Størrelser, materialer og valgmuligheder",
    it: "Taglie, materiali e opzioni disponibili",
  },
  "Account Orders": { da: "Ordrer på din konto", it: "Ordini del tuo account" },
  "Sign in to view your orders": {
    da: "Log ind for at se dine ordrer",
    it: "Accedi per visualizzare i tuoi ordini",
  },
  "Explore Collections": { da: "Udforsk kollektioner", it: "Esplora le collezioni" },
  "Pet essentials, gadgets & more": {
    da: "Kæledyrsprodukter, gadgets og mere",
    it: "Prodotti per animali, gadget e altro",
  },
  "Contact Support": { da: "Kontakt kundeservice", it: "Contatta l'assistenza" },
  "Get help with order questions": {
    da: "Få hjælp til spørgsmål om din ordre",
    it: "Ricevi aiuto per domande sugli ordini",
  },
  "Encrypted payment flow": {
    da: "Krypteret betalingsflow",
    it: "Flusso di pagamento crittografato",
  },
  "Return & Refund": { da: "Retur & Refundering", it: "Reso e Rimborso" },
  "Return money within 30 days": {
    da: "Pengene retur inden for 30 dage",
    it: "Rimborso entro 30 giorni",
  },
  "Gift Voucher": { da: "Gavekort", it: "Buono Regalo" },
  "20% off when you shop online": {
    da: "20% rabat ved onlinekøb",
    it: "20% di sconto sugli acquisti online",
  },
  "Quality Support": { da: "Kvalitetssupport", it: "Assistenza di Qualità" },
  "24/7 online feedback": {
    da: "Online support døgnet rundt",
    it: "Assistenza online 24/7",
  },

  // Footer
  "Dropship winning products from your own store - or shop the marketplace.": {
    da: "Dropship populære produkter fra din egen butik - eller shop på markedspladsen.",
    it: "Vendi in dropshipping i prodotti più richiesti dal tuo negozio - oppure acquista nel marketplace.",
  },
  "Avokarto is the all-in-one dropshipping platform: launch your own store, sell winning products and let us ship every order.": {
    da: "Avokarto er den samlede dropshipping-platform: åbn din egen butik, sælg populære produkter, og lad os sende hver ordre.",
    it: "Avokarto è la piattaforma di dropshipping completa: apri il tuo negozio, vendi i prodotti più richiesti e lascia a noi la spedizione di ogni ordine.",
  },
  "Start selling": {
    da: "Begynd at sælge",
    it: "Inizia a vendere",
  },
  "Subscribe for new arrivals and private offers.": {
    da: "Tilmeld dig for nyheder og private tilbud.",
    it: "Iscriviti per novità e offerte esclusive.",
  },
  "Need help? Call now!": {
    da: "Brug for hjælp? Ring nu!",
    it: "Hai bisogno di aiuto? Chiama ora!",
  },
  "Follow Us :": { da: "Følg Os :", it: "Seguici :" },
  "Shop The Look": { da: "Shop Looket", it: "Acquista il Look" },
  "Customer Care": { da: "Kundeservice", it: "Assistenza Clienti" },
  Company: { da: "Virksomhed", it: "Azienda" },
  "Account Info": { da: "Kontooplysninger", it: "Info Account" },
  "Returns & Exchanges": { da: "Retur & Bytte", it: "Resi e Cambi" },
  "Shipping Information": {
    da: "Fragtoplysninger",
    it: "Informazioni sulla Spedizione",
  },
  "Privacy Policy": { da: "Privatlivspolitik", it: "Informativa sulla Privacy" },
  "Terms and Conditions": {
    da: "Vilkår og Betingelser",
    it: "Termini e Condizioni",
  },
  "Help Center": { da: "Hjælpecenter", it: "Centro Assistenza" },
  "All Products": { da: "Alle Produkter", it: "Tutti i Prodotti" },
  Clearance: { da: "Udsalg", it: "Saldi" },
  Brands: { da: "Mærker", it: "Marchi" },
  "About Us": { da: "Om Os", it: "Chi Siamo" },
  "Contact Us": { da: "Kontakt Os", it: "Contattaci" },
  "Customer Reviews": { da: "Kundeanmeldelser", it: "Recensioni Clienti" },
  "Social Responsibility": { da: "Socialt Ansvar", it: "Responsabilità Sociale" },
  "Visit Us": { da: "Besøg Os", it: "Vieni a Trovarci" },
  "Phone:": { da: "Telefon:", it: "Telefono:" },
  "Email:": { da: "E-mail:", it: "Email:" },
  "Location:": { da: "Adresse:", it: "Sede:" },
  Copyright: { da: "Copyright", it: "Copyright" },
  "All rights reserved.": {
    da: "Alle rettigheder forbeholdes.",
    it: "Tutti i diritti riservati.",
  },
  "Refund policy": { da: "Refunderingspolitik", it: "Politica di rimborso" },
  "Privacy policy": { da: "Privatlivspolitik", it: "Politica sulla privacy" },
  "Terms & conditions": {
    da: "Vilkår & betingelser",
    it: "Termini e condizioni",
  },

  // Storefront common UI
  Description: { da: "Beskrivelse", it: "Descrizione" },
  Specification: { da: "Specifikation", it: "Specifiche" },
  Reviews: { da: "Anmeldelser", it: "Recensioni" },
  Questions: { da: "Spørgsmål", it: "Domande" },
  "Frequently Asked Questions? Look here": {
    da: "Ofte stillede spørgsmål? Se her",
    it: "Domande frequenti? Guarda qui",
  },
  "Based on": { da: "Baseret på", it: "Basato su" },
  Review: { da: "Anmeldelse", it: "Recensione" },
  "No description added yet.": {
    da: "Ingen beskrivelse tilføjet endnu.",
    it: "Nessuna descrizione ancora aggiunta.",
  },
  "No specifications added yet.": {
    da: "Ingen specifikationer tilføjet endnu.",
    it: "Nessuna specifica ancora aggiunta.",
  },
  "No questions yet for this product.": {
    da: "Ingen spørgsmål til dette produkt endnu.",
    it: "Nessuna domanda ancora per questo prodotto.",
  },
  "Be the first to review this product.": {
    da: "Vær den første til at anmelde dette produkt.",
    it: "Sii il primo a recensire questo prodotto.",
  },
  "Add To Cart": { da: "Tilføj til Kurv", it: "Aggiungi al Carrello" },
  "Buy Now": { da: "Køb Nu", it: "Acquista Ora" },
  "Already Added": { da: "Allerede Tilføjet", it: "Già Aggiunto" },
  "Update Cart": { da: "Opdater Kurv", it: "Aggiorna Carrello" },
  "In Stock": { da: "På Lager", it: "Disponibile" },
  "in Stock": { da: "på lager", it: "disponibili" },
  Share: { da: "Del", it: "Condividi" },
};

function subscribeToLanguageHydration(onStoreChange: () => void) {
  const unsubscribeHydrate = useLanguageStore.persist.onHydrate(onStoreChange);
  const unsubscribeFinish =
    useLanguageStore.persist.onFinishHydration(onStoreChange);

  return () => {
    unsubscribeHydrate();
    unsubscribeFinish();
  };
}

function getLanguageHydrationSnapshot() {
  return useLanguageStore.persist.hasHydrated();
}

function getServerLanguageHydrationSnapshot() {
  return false;
}

export function useTranslation() {
  const storeLocale = useLanguageStore((state) => state.locale);
  const setLocale = useLanguageStore((state) => state.setLocale);
  // Same hydration-safe pattern as context/store.ts's useContextElement -
  // stays on the "en" (server-matching) default until the persisted value
  // has actually rehydrated from localStorage, so this never renders one
  // locale on the server and a different one on the client's first paint.
  const hydrated = useSyncExternalStore(
    subscribeToLanguageHydration,
    getLanguageHydrationSnapshot,
    getServerLanguageHydrationSnapshot,
  );
  const locale = hydrated ? storeLocale : "en";

  function t(key: string): string {
    if (locale === "en") return key;
    return translations[key]?.[locale] ?? key;
  }

  return { locale, setLocale, t };
}
