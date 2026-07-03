export type TopicId = "shoots" | "plays" | "codes";
export type EntryKind = "review" | "article" | "guide";
export type ShootsCategoryId = "practical-shooting" | "gear-and-firearms" | "field-notes" | "airsoft-and-tactical" | "law-and-safety";
export type PlaysCategoryId = "tactical-shooters" | "rts-strategy" | "indie-gaming" | "gear-and-hardware" | "software-tools";
export type CodesCategoryId = "career-tips" | "ai-coding" | "software-tools" | "human-programming" | "gear-and-hardware";
export type CategoryId = ShootsCategoryId | PlaysCategoryId | CodesCategoryId;

export interface Category {
  id: string;
  name: string;
  description: string;
}

export interface Topic {
  id: TopicId;
  name: string;
  shortName: string;
  strapline: string;
  description: string;
  accent: string;
  icon: string;
  homeStats?: {
    reviews: number;
    articles: number;
    guides: number;
  };
  categories: Category[];
}

export interface WikiEntry {
  slug: string;
  title: string;
  summary: string;
  kind: EntryKind;
  topic: TopicId;
  category: CategoryId;
  createdAt: string;
  updatedAt: string;
  tags: string[];
}
