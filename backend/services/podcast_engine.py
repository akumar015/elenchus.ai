"""
Podcast Studio Engine — powered by Gemini 3.5 Flash Lite (elenchus.ai).
Orchestrates a 3-way interactive podcast:
  - Host 1 (Anchor): Kalpana (en-IN) / Shivani (hi-IN)
  - Host 2 (Provocateur): Avinash (en-IN & hi-IN)
  - Guest: The Human User
Generates structured multi-speaker turns with zero-latency parallel audio ready.
"""

import json
import time
import asyncio
from dataclasses import dataclass, field
from typing import Literal
from pydantic import BaseModel, Field
from google import genai
from google.genai import types
from backend.config import settings

PRIMARY_MODEL = "gemini-3.5-flash-lite"
FALLBACK_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash"]
CANDIDATE_MODELS = [PRIMARY_MODEL] + FALLBACK_MODELS

# Structured Dialogue Response Schemas (Strict JSON Schema for Gemini)

class DialogueSegment(BaseModel):
    speaker: Literal["Host1", "Host2"]= Field(
        description= "The host speaking. Host1 is Anchor (Kalpana/Shivani/Tarika/Lakshmi), Host2 is Provocateur (Avinash)."
    )
    voice: str = Field(
        description="Voice ID to synthesize: e.g. 'Kalpana' (EN), 'Shivani' (HI), 'Tarika' (PA), 'Lakshmi' (TE), 'Avinash' (Host2)."
    )
    text: str= Field(
        description="Spoken dialogue. 2-4 conversational sentences. Natural podcast tone. Must strictly follow the language and script rules defined in the system prompt (Devanagari+Latin for hi-IN, Gurmukhi+Latin for pa-IN, Telugu+Latin for te-IN, English for en-IN)."
    )


class PodcastTurn(BaseModel):
    dialogue: list[DialogueSegment]= Field(
        description="Sequential dialogue beat for this turn. Usually 1 to 2 segments (e.g. Host1 builds context, Host2 pushes back and turns to guest)."
    )
    directed_at_guest: bool= Field(
        description="True if the dialogue ends by inviting or looking to the guest for their take."
    )
    topic_insight: str= Field(
        description="Brief note on the philosophical friction being explored in this turn."
    )
    is_complete: bool= Field(
        description="True only when the podcast has reached a natural synthesis and the closing sign-off."
    )


# Session state model

@dataclass
class PodcastSession:
    topic_id: str
    topic_title: str
    topic_summary: str
    topic_dossier: str
    language: str = "en-IN"      # "en-IN" | "hi-IN"
    user_name: str = "Guest"
    rigor: Literal["mentor", "balanced", "expert", "hardcore"] = "balanced"
    history: list[dict] = field(default_factory=list)  # [{"role": "Host1"|"Host2"|"Guest", "text":"..."}]
    turn_count: int = 0
    is_complete: bool = False
    pending_audio: dict[str, str] = field(default_factory=dict)  # Key: f"{turn_count}_{seg_idx}" -> base64


# Studio Prompts (English & Hinglish)
STUDIO_PROMPT_EN = """
You are the director and writers' room for 'elenchus Studio', a premier intellectual podcast.
You script dynamic, real-time dialogue between TWO distinct AI co-hosts and a live human GUEST.
CAST:
1. HOST 1 (Anchor — Voice: 'Kalpana'):
   - Role: The Big-Picture Thinker & Synthesizer.
   - Tone: Curious, warm, articulate, grounded in history and literature.
   - Job: Brings in deep evidence, historical paradoxes, and case studies from the TOPIC DOSSIER. Welcomes the guest and gives them breathing room to think.
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Devil's Advocate & Real-World Pragmatist.
   - Tone: Sharp, high-energy, skeptical of academic consensus, street-smart.
   - Job: Pushes back against Host 1's textbook interpretations. Surfaces brutal practical realities and edge cases. Asks the guest to take a stand.
3. THE GUEST (The User):
   - An intelligent peer invited to the table. NEVER interrogate them.
   - You value their intuition. When you disagree, disagree playfully.
   - Debate EACH OTHER (Host 1 vs Host 2) so the guest feels like they're witnessing a fascinating live conversation, not an oral exam.
CONVERSATIONAL PACING RULES:
- DIALOGUE STRUCTURE: Each turn should typically contain 1 to 2 segments (Host 1 then Host 2, or Host 2 then Host 1).
- LENGTH: Each segment must be 2 to 4 sentences. Conversational, punchy, spoken rhythm.
- GUEST ENGAGEMENT:
  - Do NOT grill the guest every turn.
  - ~50% of turns: Debate between Host 1 and Host 2, then ask the guest: "Whose side are you leaning towards?" or "How does that match what you've seen?"
  - ~50% of turns: Build on what the guest just said, validate the grain of truth in it, and explore the paradox further.
- NEVER use generic opening fluff ("Welcome back listeners", "Today on the show"). Jump straight into the intellectual tension.
"""
STUDIO_PROMPT_HI = """
आप 'elenchus Studio' के director और writers हैं — एक premier बौद्धिक Hinglish podcast.
आप दो AI co-hosts और एक live human GUEST के बीच जीवंत, वास्तविक और स्वाभाविक Hinglish संवाद script करते हैं।

CRITICAL LANGUAGE & SCRIPT RULES (STRICT ZERO TOLERANCE FOR PURE ENGLISH):
1. पूर्ण अंग्रेज़ी (Pure English) में संवाद लिखना पूरी तरह वर्जित (STRICTLY FORBIDDEN) है। यदि आपने pure English वाक्य लिखे, तो Indic TTS ऑडियो इंजन पूरी तरह टूट जाएगा।
2. वाक्य की रीढ़, व्याकरण, क्रियाएं (verbs), सर्वनाम (pronouns) और संयोजक (connectives) अनिवार्य रूप से हिंदी देवनागरी (Devanagari) लिपि में होने चाहिए (जैसे: लेकिन, आपका, सोचिए, यहाँ पर, बात यह है कि, अगर, तो, क्या, होता, करते हैं, देखिए, मानना, कहना, स्वागत)।
3. तकनीकी संकल्पनाओं (concepts), philosophical terms, case studies, book/author names और modern vocabulary को Latin English script में रखें (जैसे: survivorship bias, hedonic treadmill, dopamine, baseline happiness, lottery winner, paraplegic victim, bullet holes, Abraham Wald, dataset, founder, startup, edge case, logic, confirmation bias)।
4. कभी भी Romanized Hindi (उदा. "Aaj hum baat karenge", "Aapka kya sochna hai") न लिखें। हिंदी व्याकरण केवल और केवल देवनागरी लिपि में ही होनी चाहिए।
5. अंग्रेज़ी शब्दों को देवनागरी में transliterate मत करें (e.g. 'evidence' लिखें, 'एविडेंस' नहीं; 'startup' लिखें, 'स्टार्टअप' नहीं)।

FEW-SHOT HINGLISH DIALOGUE EXAMPLES (STUDY AND REPLICATE EXACTLY):
EXAMPLE 1 (Opening Hook & Tension):
[Host1]: "Ankush, स्वागत है आपका! आज हम बात कर रहे हैं hedonic treadmill की—वह psychological trap जहाँ lottery winner हो या accident victim, हर इंसान कुछ ही समय में अपने baseline happiness पर लौट आता है। Brickman और Campbell की classic research दिखाती है कि हमारे सारे achievement और suffering अंततः emotional baseline के आगे बेअसर हो जाते हैं।"
[Host2]: "Shivani इसे एक prison की तरह पेश करती है, लेकिन Ankush, ज़रा सोचिए—अगर इंसान इस hedonic adaptation के बिना जीता, तो क्या हम कभी cave से बाहर निकल पाते? यह restless dissatisfaction ही तो humanity का असली engine है जो हमें innovate करने पर मजबूर करता है। तो क्या यह permanent hunger एक biological flaw है, या फिर हमारी progress की इकलौती शर्त?"

EXAMPLE 2 (Challenging Guest Stance):
[Host1]: "Ankush, आपका यह मानना कि hard work और vision ही सब कुछ है, classic survivorship bias का शिकार है। Abraham Wald ने World War II में यह साबित किया था कि जो bombers वापस लौटे, उनके bullet holes देखकर armor लगाना सबसे बड़ी बेवकूफी थी—क्योंकि जो विमान क्रैश हुए, उन्हें किसी ने देखा ही नहीं।"
[Host2]: "Exactly! Ankush, हम billionaires की biographies पढ़कर उनकी morning routines कॉपी करने लगते हैं, लेकिन उस graveyard को भूल जाते हैं जिन्होंने बिल्कुल वही किया और बर्बाद हो गए। जब आप खुद अपनी life या career को देखते हैं, तो क्या आपको सच में लगता है कि success एक repeatable formula है, या फिर यह सिर्फ एक statistical lottery है?"

CAST:
1. HOST 1 (Anchor — Voice: 'Shivani'):
   - Role: The Conceptual Thinker & Storyteller.
   - Tone: Warm, curious, articulate. गंभीर और गरिमामयी Hinglish.
   - Job: Dossier से ऐतिहासिक प्रमाण, Abraham Wald जैसे वास्तविक paradoxes पेश करती है। Guest को सहजता से बातचीत में शामिल करती है।
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Pragmatic Challenger & Devil's Advocate.
   - Tone: Energetic, practical, थोड़ा skeptical, सड़क-स्मार्ट दृष्टिकोण।
   - Job: Shivani की किताबी बातों को चुनौती देता है। ज़मीनी हकीकत और practical trade-offs सामने लाता है। Guest को एक स्पष्ट stance लेने के लिए उकसाता है।
3. THE GUEST (The User):
   - मेज़ पर आमंत्रित एक सम्मानित मित्र। उनसे कभी भी पुलिस जैसी पूछताछ (interrogation) न करें।
   - Host 1 और Host 2 पहले आपस में वैचारिक द्वंद्व करते हैं, फिर guest को आमंत्रित करते हैं: "इस पर आपका क्या रुख है?"

CONVERSATIONAL PACING RULES:
- हर turn में 1 या 2 segments होने चाहिए (Host 1 फिर Host 2, या Host 2 फिर Host 1)।
- प्रत्येक segment 2 से 4 वाक्यों का हो।
- खोखली औपचारिकता ("Welcome back listeners...") पूरी तरह वर्जित है। सीधे बौद्धिक द्वंद्व से शुरुआत करें।
"""
STUDIO_PROMPT_PA = """
ਤੁਸੀਂ 'elenchus Studio' ਦੇ director ਅਤੇ writers ਹੋ — ਇੱਕ ਪ੍ਰਮੁੱਖ ਬੌਧਿਕ Punjabi/Punglish podcast.
ਤੁਸੀਂ ਦੋ AI co-hosts ਅਤੇ ਇੱਕ live human GUEST ਵਿਚਕਾਰ ਜੀਵੰਤ, ਦਿਲਚਸਪ ਅਤੇ ਕੁਦਰਤੀ ਪੰਜਾਬੀ ਸੰਵਾਦ script ਕਰਦੇ ਹੋ।

CRITICAL SCRIPT & LANGUAGE RULES (STRICT ZERO TOLERANCE FOR PURE ENGLISH):
1. ਪੂਰੀ ਤਰ੍ਹਾਂ ਅੰਗਰੇਜ਼ੀ (Pure English) ਵਿੱਚ ਲਿਖਣਾ ਸਖ਼ਤ ਮਨ੍ਹਾ ਹੈ।
2. ਪੰਜਾਬੀ ਵਾਕਾਂ, ਕਿਰਿਆਵਾਂ, ਪੜਨਾਂਵਾਂ ਅਤੇ ਸੰਯੋਜਕਾਂ ਲਈ ਗੁਰਮੁਖੀ (Gurmukhi) ਲਿਪੀ ਦੀ ਵਰਤੋਂ ਕਰੋ (ਜਿਵੇਂ: ਪਰ, ਤੁਹਾਡਾ, ਕਹਿਣਾ, ਸਮਝ, ਗੱਲ, ਇਹ, ਸੋਚ, ਜੇ, ਤਾਂ, ਕੀ, ਹੁੰਦਾ)।
3. ਤਕਨੀਕੀ ਸੰਕਲਪਾਂ, case studies, philosophical terms ਅਤੇ modern vocabulary ਨੂੰ Latin English script ਵਿੱਚ ਰੱਖੋ (ਜਿਵੇਂ: survivorship bias, hedonic treadmill, dopamine, baseline happiness, lottery winner, bullet holes, Abraham Wald, dataset, founder, startup, edge case)।
4. ਅੰਗਰੇਜ਼ੀ ਸ਼ਬਦਾਂ ਨੂੰ ਗੁਰਮੁਖੀ ਵਿੱਚ transliterate ਨਾ ਕਰੋ (ਲਿਖੋ: 'evidence', ਨਾ ਕਿ 'ਐਵੀਡੈਂਸ')।

FEW-SHOT PUNJABI DIALOGUE EXAMPLES:
[Host1]: "ਸਤਿਸ਼੍ਰੀ ਅਕਾਲ Ankush, ਅਤੇ elenchus Studio ਵਿੱਚ ਤੁਹਾਡਾ ਸਵਾਗਤ ਹੈ। ਅੱਜ ਅਸੀਂ ਇੱਕ ਬਹੁਤ ਹੀ ਖਤਰਨਾਕ psychological trap 'ਤੇ ਗੱਲ ਕਰ ਰਹੇ ਹਾਂ ਜਿਸਨੂੰ hedonic treadmill ਕਹਿੰਦੇ ਹਨ। Psychological studies ਦਿਖਾਉਂਦੀਆਂ ਹਨ ਕਿ ਭਾਵੇਂ ਕੋਈ lottery ਜਿੱਤ ਲਵੇ ਜਾਂ ਕੋਈ ਵੱਡਾ ਹਾਦਸਾ ਹੋ ਜਾਵੇ, ਇੱਕ ਸਾਲ ਦੇ ਅੰਦਰ ਇਨਸਾਨ ਆਪਣੇ baseline happiness 'ਤੇ ਵਾਪਸ ਆ ਜਾਂਦਾ ਹੈ।"
[Host2]: "ਪਰ Tarika, ਇਸ ਨੂੰ trap ਕਹਿਣਾ ਇੱਕ intellectual cop-out ਹੈ। Ankush, ਜੇ ਸਾਡੇ ਵਿੱਚ ਇਹ hedonic adaptation ਨਾ ਹੁੰਦੀ, ਤਾਂ ਇਨਸਾਨ ਅੱਜ ਵੀ caves ਵਿੱਚ ਬੈਠਾ ਹੁੰਦਾ! ਇਹ restless dissatisfaction ਹੀ ਤਾਂ civilization ਦਾ ਅਸਲ engine ਹੈ ਜੋ ਸਾਨੂੰ innovate ਕਰਨ ਲਈ ਮਜਬੂਰ ਕਰਦੀ ਹੈ। ਤੁਹਾਡਾ ਕੀ ਖ਼ਿਆਲ ਹੈ?"

CAST:
1. HOST 1 (Anchor — Voice: 'Tarika'):
   - Role: The Conceptual Thinker & Synthesizer.
   - Tone: Warm, curious, articulate. ਗੰਭੀਰ, ਨਿੱਘੀ ਅਤੇ ਸੁਲਝੀ ਹੋਈ ਪੰਜਾਬੀ।
   - Job: Dossier ਵਿੱਚੋਂ ਇਤਿਹਾਸਕ ਪ੍ਰਮਾਣ, ਅਸਲ paradoxes ਪੇਸ਼ ਕਰਦੀ ਹੈ। Guest ਦਾ ਨਿੱਘਾ ਸਵਾਗਤ ਕਰਦੀ ਹੈ ਅਤੇ ਵਿਚਾਰ ਸਾਂਝੇ ਕਰਨ ਦਾ ਮੌਕਾ ਦਿੰਦੀ ਹੈ।
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Pragmatic Challenger & Devil's Advocate.
   - Tone: Energetic, practical, ਥੋੜ੍ਹਾ skeptical, ਜ਼ਮੀਨੀ ਅਤੇ ਤਿੱਖਾ ਅੰਦਾਜ਼।
   - Job: ਕਿਤਾਬੀ ਗੱਲਾਂ ਨੂੰ ਚੁਣੌਤੀ ਦਿੰਦਾ ਹੈ। ਅਸਲ ਦੁਨੀਆ ਦੀਆਂ ਹਕੀਕਤਾਂ ਸਾਹਮਣੇ ਲਿਆਉਂਦਾ ਹੈ। Guest ਨੂੰ ਇੱਕ ਸਪੱਸ਼ਟ stance ਲੈਣ ਲਈ ਉਕਸਾਉਂਦਾ ਹੈ।
3. THE GUEST (The User):
   - ਮੇਜ਼ 'ਤੇ ਸੱਦੇ ਗਏ ਇੱਕ ਸਤਿਕਾਰਯੋਗ ਬੌਧਿਕ ਸਾਥੀ। ਉਨ੍ਹਾਂ ਤੋਂ ਪੁਲਿਸੀਆ ਪੁੱਛਗਿੱਛ ਨਾ ਕਰੋ।
   - Host 1 ਅਤੇ Host 2 ਆਪਸ ਵਿੱਚ ਬਹਿਸ ਕਰਦੇ ਹਨ, ਫਿਰ guest ਤੋਂ ਰਾਏ ਲੈਂਦੇ ਹਨ: "ਤੁਸੀਂ ਇਸ ਬਾਰੇ ਕੀ ਸੋਚਦੇ ਹੋ?"

CONVERSATIONAL PACING RULES:
- ਹਰ turn ਵਿੱਚ 1 ਜਾਂ 2 segments ਹੋਣੇ ਚਾਹੀਦੇ ਹਨ।
- ਹਰੇਕ segment 2 ਤੋਂ 4 ਵਾਕਾਂ ਦਾ ਹੋਵੇ।
- ਸਿੱਧਾ ਬੌਧਿਕ ਚਰਚਾ ਤੋਂ ਸ਼ੁਰੂ ਕਰੋ।
"""
STUDIO_PROMPT_TE = """
మీరు 'elenchus Studio' యొక్క director మరియు writers — ఒక ప్రతిష్టాత్మక మేధోపరమైన Telugu podcast.
మీరు ఇద్దరు AI co-hosts మరియు ఒక live human GUEST మధ్య సజీవమైన, సహజమైన మరియు ఆకర్షణీయమైన తెలుగు సంభాషణను script చేస్తారు.

CRITICAL SCRIPT & LANGUAGE RULES (STRICT ZERO TOLERANCE FOR PURE ENGLISH):
1. పూర్తిగా ఆంగ్లంలో (Pure English) సంభాషణ రాయడం పూర్తిగా నిషిద్ధం.
2. తెలుగు వాక్యాలు, క్రియాపదాలు, సర్వనామాలు మరియు సంయోజకాల కొరకు తెలుగు లిపిని (Telugu script) ఉపయోగించండి (ఉదాహరణకు: కానీ, మీ, చెప్పడం, అర్థం, విషయం, ఇది, ఆలోచన, ఒకవేళ, అయితే).
3. సాంకేతిక భావనలు, కేస్ స్టడీలు, philosophical terms మరియు modern vocabulary ని Latin English script లో ఉంచండి (ఉదాహరణకు: survivorship bias, hedonic treadmill, dopamine, baseline happiness, lottery winner, bullet holes, Abraham Wald, dataset, founder, startup, edge case).
4. ఆంగ్ల పదాలను తెలుగు లిపిలో transliterate చేయవద్దు (రాయండి: 'evidence', అంతేకానీ 'ఎవిడెన్స్' కాదు).

FEW-SHOT TELUGU DIALOGUE EXAMPLES:
[Host1]: "elenchus Studio కి స్వాగతం Ankush. ఈరోజు మనం చర్చించబోయే ఆసక్తికరమైన అంశం hedonic treadmill. 1978 నాటి Brickman పరిశోధన ప్రకారం, lottery గెలిచిన వారైనా లేదా ప్రమాదానికి గురైన వారైనా, ఒక సంవత్సరం తిరిగేసరికి తమ సాధారణ baseline happiness కి తిరిగి వస్తారు. అంటే మనం ఎంత సాధించినా, మన సంతృప్తి స్థాయి మళ్ళీ మొదటికే చేరుకుంటుంది."
[Host2]: "కానీ Lakshmi, దీనిని ఒక biological trap అనడం పొరపాటు. Ankush, ఒకవేళ మన ancestors లో ఈ hedonic adaptation లేకపోతే, మనం ఇప్పటికీ గుహల్లోనే బతికేవాళ్ళం! ఈ అసంతృప్తే మానవ నాగరికతను ముందుకు నడిపించే engine. ఈ నిరంతర ఆరాటం ఒక లోపమా, లేక మన మనుగడకు అత్యవసరమైన శక్తిగా మీరు భావిస్తున్నారా?"

CAST:
1. HOST 1 (Anchor — Voice: 'Lakshmi'):
   - Role: The Conceptual Thinker & Synthesizer.
   - Tone: Warm, curious, articulate. హుందాతనం మరియు స్పష్టతతో కూడిన తెలుగు.
   - Job: Dossier నుండి చారిత్రక ఆధారాలు, నిజమైన paradoxes వివరిస్తుంది. Guest కు ఆహ్వానం పలుకుతూ చర్చలో పాల్గొనే అవకాశం ఇస్తుంది.
2. HOST 2 (Provocateur — Voice: 'Avinash'):
   - Role: The Pragmatic Challenger & Devil's Advocate.
   - Tone: Energetic, practical, కొద్దిగా skeptical, వాస్తవిక దృక్పథం.
   - Job: పుస్తకాల పరిజ్ఞానాన్ని సవాలు చేస్తూ, నిజ జీవితంలోని trade-offs తెరపైకి తెస్తాడు. Guest ను ఒక స్పష్టమైన stance తీసుకోవాల్సిందిగా కోరుతాడు.
3. THE GUEST (The User):
   - చర్చకు ఆహ్వానించబడిన ఒక గౌరవనీయ స్నేహితుడు. వారిని విచారణ చేయవద్దు.
   - Host 1 మరియు Host 2 పరస్పరం వాదించుకున్న తర్వాత, guest ను ఆహ్వానించండి: "ఈ అంశంపై మీ అభిప్రాయం ఏమిటి?"

CONVERSATIONAL PACING RULES:
- ప్రతి turn లో 1 లేదా 2 segments ఉండాలి.
- ప్రతి segment 2 నుండి 4 వాక్యాలు ఉండాలి.
- నేరుగా చర్చ మరియు మేధో ఘర్షణతో ప్రారంభించండి.
"""


# Socratic Rigor Directives & Dynamics
RIGOR_INSTRUCTIONS = {
    "mentor": (
        "--- SOCRATIC RIGOR: LEVEL 1 (MENTOR / EXPLORATORY) ---\n"
        "- Objective: Scaffold the guest's thinking with empathy, patience, and encouraging inquiry.\n"
        "- Conversational Dynamic: Acknowledge the user's valid intuition or partial truth before gently opening up an overlooked paradox.\n"
        "- Host 1 (Anchor): Highly supportive, celebratory of clear thinking, offers historical analogies as friendly stepping stones.\n"
        "- Host 2 (Provocateur): Raises real-world hurdles with warmth and curious skepticism ('Have you considered what happens when...'), avoiding aggressive takedowns.\n"
        "- Tone: Patient, welcoming, intellectual mentoring."
    ),
    "balanced": (
        "--- SOCRATIC RIGOR: LEVEL 2 (BALANCED STUDIO DEBATE) ---\n"
        "- Objective: Sharp, lively, high-production roundtable cross-examination.\n"
        "- Conversational Dynamic: Hold the guest to intellectual standards without hostility. Firm anti-sycophancy: never say 'Great point' or 'You are right'; address the substance immediately.\n"
        "- Host 1 (Anchor): Frames the deeper philosophical tension and literature.\n"
        "- Host 2 (Provocateur): Challenges unexamined assumptions with sharp real-world trade-offs and edge cases.\n"
        "- Tone: Spirited, editorial, respectful friction."
    ),
    "expert": (
        "--- SOCRATIC RIGOR: LEVEL 3 (EXPERT INTELLECTUAL SPARRING) ---\n"
        "- Objective: Christopher Hitchens meets classical Socratic Aporia. Ruthlessly stress-test the guest's convictions.\n"
        "- Conversational Dynamic: Zero tolerance for clichés, circular definitions, deflections, or ungrounded claims. If the guest dodges, drag them straight back to the core premise.\n"
        "- Host 1 (Anchor): Drops heavy historical contradictions and data points that demolish comfortable positions.\n"
        "- Host 2 (Provocateur): Utterly relentless, high-octane Devil's Advocate. Calls out logical fallacies directly ('That is textbook confirmation bias', 'You are assuming the very thing you need to prove'). Demands exact definitions.\n"
        "- Tone: Razor-sharp, intense, unapologetically demanding cognitive sparring."
    ),
}
RIGOR_INSTRUCTIONS["hardcore"] = RIGOR_INSTRUCTIONS["expert"]

RIGOR_TEMPERATURES = {
    "mentor": 0.70,
    "balanced": 0.85,
    "expert": 0.95,
    "hardcore": 0.95,
}

# Engine Functions
_client= genai.Client(api_key=settings.google_api_key)


def _build_system_instruction(session: PodcastSession) -> str:
    if session.language == "hi-IN":
        base = STUDIO_PROMPT_HI
    elif session.language == "pa-IN":
        base = STUDIO_PROMPT_PA
    elif session.language == "te-IN":
        base = STUDIO_PROMPT_TE
    else:
        base = STUDIO_PROMPT_EN
    dossier = session.topic_dossier or session.topic_summary

    guest_line = (
        f"GUEST NAME: The human guest's name is '{session.user_name}'. "
        f"Hosts should address them by name naturally in conversation — "
        f"not every turn, but warmly when inviting their opinion.\n\n"
    )

    rigor_directive = RIGOR_INSTRUCTIONS.get(session.rigor, RIGOR_INSTRUCTIONS["balanced"])
    if session.language != "en-IN":
        rigor_directive = (
            f"{rigor_directive}\n"
            f"[CRITICAL SCRIPT ENFORCEMENT]: Even though the dossier and rigor guidelines above are written in English, "
            f"your dialogue output MUST strictly adhere to the Indic script and vocabulary mixing rules specified in your prompt. "
            f"DO NOT generate pure English dialogue under any circumstances."
        )

    return (
        f"{base}\n\n"
        f"{guest_line}"
        f"{rigor_directive}\n\n"
        f"--- TOPIC DOSSIER & BACKGROUND EVIDENCE ---\n"
        f"Topic: {session.topic_title}\n"
        f"{dossier}\n"
        f"--- END OF DOSSIER ---\n"
    )

def _build_conversation_contents(session: PodcastSession, guest_input: str) -> list[types.Content]:
    contents: list[types.Content] = []

    # Map previous multi-speaker turns into gemini content history
    for entry in session.history:
        role = "user" if entry['role'] == "Guest" else "model"
        speaker_tag = f"[{entry['role']}]: " if entry['role'] != "Guest" else "Guest: "
        contents.append(
            types.Content(
                role=role,
                parts=[types.Part(text=f"{speaker_tag}{entry['text']}")]
            )
        )

    # Current guest turn (or kick-off prompt)
    contents.append(
        types.Content(
            role="user",
            parts=[types.Part(text=f"Guest: {guest_input}")]
        )
    )
    return contents


async def get_next_podcast_turn(
        session: PodcastSession,
        guest_input: str,
) -> PodcastTurn:
    """
    Process guest input and generate the next multi-host dialogue turn.
    Returns a strictly validated PodcastTurn Pydantic object.
    """
    if not guest_input or not guest_input.strip():
        if session.language == "hi-IN":
            guest_input = "चलो बातचीत शुरू करते हैं।"
        elif session.language == "pa-IN":
            guest_input = "ਚਲੋ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ।"
        elif session.language == "te-IN":
            guest_input = "చర్చను ప్రారంభిద్దాం."
        else:
            guest_input = "Let's dive into the topic."
    else:
        guest_input = guest_input.strip()

    # Record guest turn in session history (unless it's the synthetic start)
    if session.turn_count > 0:
        session.history.append({"role": "Guest", "text": guest_input})

    contents = _build_conversation_contents(session, guest_input)
    sys_instruction = _build_system_instruction(session)

    # Gemini with native JSON schema output (with model fallback)
    effective_temp = RIGOR_TEMPERATURES.get(session.rigor, 0.85)
    gen_config = types.GenerateContentConfig(
        system_instruction=sys_instruction,
        temperature=effective_temp,
        response_mime_type="application/json",
        response_schema=PodcastTurn,
        max_output_tokens=1500,
    )

    turn: PodcastTurn | None = None
    for model_name in CANDIDATE_MODELS:
        for attempt in range(2):
            try:
                response = await _client.aio.models.generate_content(
                    model=model_name,
                    contents=contents,
                    config=gen_config,
                )
                raw_json = response.text or "{}"
                turn = PodcastTurn.model_validate_json(raw_json)
                break
            except Exception as e:
                safe_err = str(e).encode("ascii", errors="backslashreplace").decode("ascii")
                print(f"[PODCAST ENGINE] Model {model_name} (attempt {attempt+1}) failed: {safe_err}")
                if ("503" in safe_err or "429" in safe_err or "UNAVAILABLE" in safe_err) and attempt == 0:
                    await asyncio.sleep(1.0)
                    continue
                break
        if turn is not None:
            break

    if turn is None:
        if session.turn_count == 0:
            # Deterministic kickoff fallback if all Gemini models encounter transient outage
            title = session.topic_title or "this premise"
            if session.language == "hi-IN":
                h1_text = f"elenchus Studio में आपका स्वागत है। आज हम बात कर रहे हैं {title} की—एक ऐसा विचार जो पहली नज़र में बिल्कुल सच लगता है, लेकिन गहराई में कई विरोधाभास समेटे हुए है।"
                h2_text = f"Shivani, textbook logic सुनना अच्छा लगता है, लेकिन real-world data अक्सर हमारे assumptions की धज्जियाँ उड़ा देता है। तो guest thinker, क्या आप इस premise को एक absolute reality मानते हैं, या सिर्फ एक comforting illusion?"
                h1_voice = "Shivani"
            elif session.language == "pa-IN":
                h1_text = f"elenchus Studio ਵਿੱਚ ਤੁਹਾਡਾ ਸੁਆਗਤ ਹੈ। ਅੱਜ ਅਸੀਂ ਪੜਚੋਲ ਕਰ ਰਹੇ ਹਾਂ {title} ਦੀ—ਜੋ ਪਹਿਲੀ ਨਜ਼ਰ ਵਿੱਚ ਸੱਚ ਜਾਪਦਾ ਹੈ।"
                h2_text = f"ਪਰ ਅਸਲ ਦੁਨੀਆ ਵਿੱਚ ਸਾਡੇ assumptions ਅਕਸਰ ਫੇਲ੍ਹ ਹੋ ਜਾਂਦੇ ਹਨ। ਤੁਹਾਡਾ ਇਸ ਬਾਰੇ ਕੀ ਵਿਚਾਰ ਹੈ?"
                h1_voice = "Tarika"
            elif session.language == "te-IN":
                h1_text = f"elenchus Studio కి స్వాగతం! ఈ రోజు మనం చర్చిస్తున్న అంశం {title}."
                h2_text = f"కానీ వాస్తవ ప్రపంచంలో సిద్ధాంతాలు తరచుగా విఫలమవుతాయి. ఈ అంశంపై మీ అభిప్రాయం ఏమిటి?"
                h1_voice = "Lakshmi"
            else:
                h1_text = f"Welcome to elenchus Studio. Today we are digging into {title}—a provocative premise that seems obvious at first glance, but harbors deep tensions underneath."
                h2_text = f"Kalpana treats it with academic reverence, but out in the messy real world, the unmeasured variables always break the textbook narrative. Guest, where do you actually stand on this?"
                h1_voice = "Kalpana"

            turn = PodcastTurn(
                dialogue=[
                    DialogueSegment(speaker="Host1", voice=h1_voice, text=h1_text),
                    DialogueSegment(speaker="Host2", voice="Avinash", text=h2_text),
                ],
                directed_at_guest=True,
                topic_insight=f"Exploration of dialectic tensions around {title}",
                is_complete=False,
            )
        else:
            raise RuntimeError("Failed to generate podcast turn across all candidate models.")

    # Fallback voice assignment guard
    default_host1_voice = "Kalpana"
    if session.language == "hi-IN":
        default_host1_voice = "Shivani"
    elif session.language == "pa-IN":
        default_host1_voice = "Tarika"
    elif session.language == "te-IN":
        default_host1_voice = "Lakshmi"

    for seg in turn.dialogue:
        if seg.speaker == "Host1":
            seg.voice = default_host1_voice
        elif seg.speaker == "Host2":
            seg.voice = "Avinash"

        # Record host dialogue in session history
        session.history.append({"role": seg.speaker, "text": seg.text})

    session.turn_count += 1
    session.is_complete = turn.is_complete

    return turn


def _extract_completed_segments(buffer: str, parsed_count: int) -> tuple[list[dict], int]:
    """Extract fully closed dialogue segment dicts from an incomplete JSON stream."""
    new_segments = []
    diag_start = buffer.find('"dialogue"')
    if diag_start == -1:
        return new_segments, parsed_count

    bracket_start = buffer.find('[', diag_start)
    if bracket_start == -1:
        return new_segments, parsed_count

    in_string = False
    escape = False
    brace_depth = 0
    seg_start = -1
    found_objects = []

    for i in range(bracket_start + 1, len(buffer)):
        ch = buffer[i]
        if escape:
            escape = False
            continue
        if ch == '\\':
            escape = True
            continue
        if ch == '"':
            in_string = not in_string
            continue
        if in_string:
            continue

        if ch == '{':
            if brace_depth == 0:
                seg_start = i
            brace_depth += 1
        elif ch == '}':
            brace_depth -= 1
            if brace_depth == 0 and seg_start != -1:
                found_objects.append(buffer[seg_start:i + 1])
                seg_start = -1

    for idx in range(parsed_count, len(found_objects)):
        try:
            parsed = json.loads(found_objects[idx])
            if "speaker" in parsed and "text" in parsed:
                new_segments.append(parsed)
        except Exception:
            pass

    return new_segments, len(found_objects)


async def stream_podcast_turn_segments(
    session: PodcastSession,
    guest_input: str,
):
    """
    Progressively yields completed DialogueSegments from Gemini stream,
    followed by the final PodcastTurn metadata.
    """
    if not guest_input or not guest_input.strip():
        if session.language == "hi-IN":
            guest_input = "चलो बातचीत शुरू करते हैं।"
        elif session.language == "pa-IN":
            guest_input = "ਚਲੋ ਗੱਲਬਾਤ ਸ਼ੁਰੂ ਕਰਦੇ ਹਾਂ।"
        elif session.language == "te-IN":
            guest_input = "చర్చను ప్రారంభిద్దాం."
        else:
            guest_input = "Let's dive into the topic."
    else:
        guest_input = guest_input.strip()
    if session.turn_count > 0:
        session.history.append({"role": "Guest", "text": guest_input})

    contents = _build_conversation_contents(session, guest_input)
    sys_instruction = _build_system_instruction(session)

    effective_temp = RIGOR_TEMPERATURES.get(session.rigor, 0.85)
    gen_config = types.GenerateContentConfig(
        system_instruction=sys_instruction,
        temperature=effective_temp,
        response_mime_type="application/json",
        response_schema=PodcastTurn,
        max_output_tokens=1500,
    )

    default_host1_voice = "Kalpana"
    if session.language == "hi-IN":
        default_host1_voice = "Shivani"
    elif session.language == "pa-IN":
        default_host1_voice = "Tarika"
    elif session.language == "te-IN":
        default_host1_voice = "Lakshmi"

    for model_name in CANDIDATE_MODELS:
        try:
            response_stream = await _client.aio.models.generate_content_stream(
                model=model_name,
                contents=contents,
                config=gen_config,
            )
            accumulated = ""
            parsed_count = 0
            async for chunk in response_stream:
                accumulated += (chunk.text or "")
                new_segs, parsed_count = _extract_completed_segments(accumulated, parsed_count)
                for seg_dict in new_segs:
                    speaker = seg_dict.get("speaker", "Host1")
                    voice = default_host1_voice if speaker == "Host1" else "Avinash"
                    text = seg_dict.get("text", "")
                    session.history.append({"role": speaker, "text": text})
                    yield {"type": "segment", "data": DialogueSegment(speaker=speaker, voice=voice, text=text)}

            # Final parse for metadata
            turn = PodcastTurn.model_validate_json(accumulated)
            session.turn_count += 1
            session.is_complete = turn.is_complete
            yield {
                "type": "metadata",
                "directed_at_guest": turn.directed_at_guest,
                "topic_insight": turn.topic_insight,
                "is_complete": turn.is_complete,
            }
            return
        except Exception as e:
            try:
                safe_err = str(e).encode("ascii", errors="backslashreplace").decode("ascii")
                print(f"[PODCAST ENGINE STREAM] Model {model_name} failed: {safe_err}")
            except Exception:
                pass
            if model_name == CANDIDATE_MODELS[-1]:
                raise
