import type { SizeGuideRow } from "@/types/misc";

export type { SizeGuideRow } from "@/types/misc";

export const sizeGuideIn: SizeGuideRow[] = [
  { id: "1", size: "XS", usSize: "0-2", chest: "0-2", waist: "24-26", lowHip: "34-36", inseam: "30" },
  { id: "2", size: "S", usSize: "4-6", chest: "4-6", waist: "26-28", lowHip: "36-38", inseam: "30.5" },
  { id: "3", size: "M", usSize: "8-10", chest: "8-10", waist: "28-30", lowHip: "38-40", inseam: "31" },
  { id: "4", size: "L", usSize: "12-14", chest: "12-14", waist: "30-32", lowHip: "40-42", inseam: "31.5" },
];

export const sizeGuideCm: SizeGuideRow[] = [
  { id: "1", size: "XS", usSize: "0-2", chest: "81-86", waist: "61-66", lowHip: "86-91", inseam: "76" },
  { id: "2", size: "S", usSize: "4-6", chest: "86-91", waist: "66-71", lowHip: "91-96", inseam: "77" },
  { id: "3", size: "M", usSize: "8-10", chest: "91-96", waist: "71-76", lowHip: "96-101", inseam: "79" },
  { id: "4", size: "L", usSize: "12-14", chest: "96-101", waist: "76-81", lowHip: "101-106", inseam: "80" },
];
