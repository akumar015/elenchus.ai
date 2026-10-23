export interface Topic {
  id: string;
  title: string;
  category: "Philosophy" | "Behavioral Economics" | "Cognitive Science" | "Systems Thinking" | string;
  summary: string;
  opening_trap: string;
}

export type TopicCategory = 
  | "Philosophy"
  | "Behavioral Economics"
  | "Cognitive Science"
  | "Systems Thinking";
