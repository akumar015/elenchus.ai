export interface FeaturePoint {
  label: string;
  description: string;
  isPrimary?: boolean;
}

export interface FeatureData {
  id: string;
  category: string;
  title: string;
  citation: string;
  lead: string;
  points: FeaturePoint[];
  takeaway: string;
}

export const COGNITIVE_FEATURES: FeatureData[] = [
  {
    id: "icap-framework",
    category: "Cognitive Architecture",
    title: "The ICAP Framework",
    citation: "Michelene T.H. Chi (2009) · Cognitive Science & Educational Psychology",
    lead: "Cognitive research proves memory is not a recording device. Listening to audio monologues yields low recall because the brain operates in a passive state. Dialogue forces real-time cognitive co-construction.",
    points: [
      {
        label: "Passive Audio",
        description:
          "Passive listening to summaries or podcasts produces the illusion of competence. Without friction, the mind assumes it understands what it merely recognized.",
      },
      {
        label: "Interactive Sparring",
        description:
          "Engaging in a spoken dialectic forces you to defend premises, detect blind spots in real time, and co-construct meaning. ICAP studies demonstrate up to 3x higher retention and transfer.",
        isPrimary: true,
      },
    ],
    takeaway: "Retention is the residue of defended thought.",
  },
  {
    id: "generation-effect",
    category: "Neural Consolidation",
    title: "Generate, Don't Absorb",
    citation: "Slamecka & Graf (1978) · Roediger & Karpicke (2006)",
    lead: "Information is chemically consolidated into long-term memory far more effectively when actively generated from your own mind than when passively heard.",
    points: [
      {
        label: "The Generation Effect",
        description:
          "Formulating a counter-argument on the spot demands active cognitive synthesis. You remember what your brain actively works to produce, not what it receives.",
      },
      {
        label: "Spontaneous Retrieval Practice",
        description:
          "When elenchus.ai corners an assumption, having to retrieve evidence acts as an unpredictable testing effect—solidifying synaptic pathways against decay.",
        isPrimary: true,
      },
    ],
    takeaway: "You don't know a concept until you've defended it against pushback.",
  },
  {
    id: "protege-effect",
    category: "Verbal Articulation",
    title: "The Protégé Effect",
    citation: "Educational Psychology & Dialogic Elaboration Studies",
    lead: "When you anticipate having to explain a thesis to someone else, your brain restructures logic with greater rigor. Speaking out loud transforms intuition into coherent knowledge.",
    points: [
      {
        label: "Internal Fog vs. Spoken Rigor",
        description:
          "Silent thinking allows logical leaps and contradictions to hide in the fog. Speaking aloud forces implicit thoughts into explicit, grammatical structure.",
      },
      {
        label: "Dialogic Teaching Mode",
        description:
          "Talking to an attentive, challenging AI conversationalist activates teaching mechanisms—demanding you organize facts into causal, verifiable chains.",
        isPrimary: true,
      },
    ],
    takeaway: "Language is the compiler of thought; speech is the runtime execution.",
  },
  {
    id: "socratic-pacing",
    category: "Attention Cycles",
    title: "Zero Monologues",
    citation: "Graesser et al. (AutoTutor) & HCI Conversational Dynamics",
    lead: "Standard audio suffers from severe attention decay after 3 minutes. elenchus.ai enforces conversational volleys, probing comprehension and setting dialectical traps before complex mental models collapse.",
    points: [
      {
        label: "Continuous Conversational Volleys",
        description:
          "Instead of a 45-minute drone, elenchus delivers concise, provocative conversational volleys. Attention cannot drift when you are continuously on the record.",
      },
      {
        label: "Conversational Tutoring Dynamics",
        description:
          "Decades of Intelligent Tutoring System benchmarks show conversational partners outperform monologues across every comprehension tier.",
        isPrimary: true,
      },
    ],
    takeaway: "Continuous inquiry prevents cognitive drifting.",
  },
];
