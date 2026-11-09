"use client";

import { create } from "zustand";

export type ReviewTarget = {
	existingRating: number | null;
	existingReview: string | null;
	imageUrl: string;
	productId: string;
	productName: string;
	unitPrice: number;
};

type ReviewTargetState = {
	setTarget: (target: ReviewTarget) => void;
	target: ReviewTarget | null;
};

// The "leave a review" modal is mounted once, globally, as a sibling of the
// per-product "Leave a review" buttons in the list (not a child) - this is
// the only way for the modal to know which product it's reviewing.
export const useReviewTarget = create<ReviewTargetState>((set) => ({
	setTarget: (target) => set({ target }),
	target: null,
}));
