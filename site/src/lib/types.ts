export type NodeKind = "folder" | "lesson";

/** Узел дерева контента. Папки — разделы и темы, файлы — уроки. */
export interface ContentNode {
  kind: NodeKind;
  /** Стабильный id (хеш пути без номеров) — ключ прогресса в localStorage. */
  id: string;
  /** Номер из имени файла/папки: «01», «12» или null. */
  num: string | null;
  title: string;
  /** URL без basePath, например /l/01/03/02/ */
  href: string;
  slug: string[];
  /** Путь файла/папки относительно корня конспекта. */
  rel: string;
  children: ContentNode[];
  /** Только для уроков: абсолютный путь к .md */
  file?: string;
}

/** Облегчённый узел для передачи на клиент. */
export interface NavNode {
  kind: NodeKind;
  id: string;
  num: string | null;
  title: string;
  href: string;
  children?: NavNode[];
}

/** Запись поискового индекса (/search-index.json). */
export interface IndexEntry {
  id: string;
  title: string;
  href: string;
  /** «Программирование / Основы языка» */
  path: string;
  section: string;
  text: string;
}

export interface TocItem {
  id: string;
  text: string;
  depth: number;
}
