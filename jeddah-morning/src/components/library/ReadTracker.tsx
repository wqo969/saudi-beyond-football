"use client";
import { useEffect } from "react";
import { recordRead, type ItemRef } from "@/lib/library";

export function ReadTracker({ item }: { item: ItemRef }) {
  const { issueSlug, articleId, title, section } = item;
  useEffect(() => recordRead({ issueSlug, articleId, title, section }), [issueSlug, articleId, title, section]);
  return null;
}
