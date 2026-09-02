export const CATEGORY_LABELS: Record<string, string> = {
  GRAMMAR: "Grammar",
  CLARITY: "Clarity",
  IMPACT: "Impact",
  QUANTIFICATION: "Quantification",
  ACTION_VERB: "Action Verb",
  FORMATTING: "Formatting",
  STRUCTURE: "Structure",
  ATS: "ATS",
  SKILLS: "Skills",
  REDUNDANCY: "Redundancy",
  RELEVANCE: "Relevance",
  TONE: "Tone",
};

export const SEVERITY_LABELS: Record<string, string> = {
  HIGH: "High priority",
  MEDIUM: "Medium priority",
  LOW: "Minor improvement",
};

export const SEVERITY_BADGE_VARIANT: Record<string, "destructive" | "warning" | "secondary"> = {
  HIGH: "destructive",
  MEDIUM: "warning",
  LOW: "secondary",
};

export const CATEGORY_SCORE_LABELS: Record<string, string> = {
  impact: "Impact",
  clarity: "Clarity",
  conciseness: "Conciseness",
  formatting: "Formatting",
  ats: "ATS Compatibility",
  quantification: "Quantification",
  actionVerbs: "Action Verbs",
  skills: "Skills Presentation",
  grammar: "Grammar",
  relevance: "Relevance",
};
