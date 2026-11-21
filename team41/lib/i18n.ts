// English / हिंदी / मराठी. One dictionary for every page and component.
// Server pages read the language from the "ftr-lang" cookie (lib/i18n-server.ts);
// client components use useLang() (lib/lang-client.ts).

export type Lang = "en" | "hi" | "mr";
export const LANGS: { code: Lang; label: string }[] = [
  { code: "en", label: "EN" },
  { code: "hi", label: "हिंदी" },
  { code: "mr", label: "मराठी" },
];
export const COOKIE = "ftr-lang";
export const isLang = (v: unknown): v is Lang => v === "en" || v === "hi" || v === "mr";

type Entry = { en: string; hi: string; mr: string };
const UI = {
  // header
  nav_home: { en: "Home", hi: "होम", mr: "मुख्यपृष्ठ" },
  nav_map: { en: "Ward map", hi: "वार्ड नक्शा", mr: "वॉर्ड नकाशा" },
  nav_contractors: { en: "Contractors", hi: "ठेकेदार", mr: "कंत्राटदार" },
  nav_track: { en: "Track a complaint", hi: "शिकायत ट्रैक करें", mr: "तक्रार शोधा" },
  brand: { en: "Follow the Rupee", hi: "रुपये का हिसाब", mr: "रुपयाचा हिशोब" },

  // home
  home_menu: { en: "Wards", hi: "वार्ड", mr: "वॉर्ड" },
  home_link: { en: "Open the map", hi: "नक्शा खोलें", mr: "नकाशा उघडा" },
  home_h1: { en: "Every rupee,", hi: "हर रुपया,", mr: "प्रत्येक रुपया," },
  home_h2: { en: "followed to the road.", hi: "सड़क तक ट्रैक किया।", mr: "रस्त्यापर्यंत शोधला." },
  home_blurb: {
    en: "Pick any ward and see what BMC paid for its road repairs, who did the work, and whether the fix held up through the rains. Sample data, not official BMC records.",
    hi: "कोई भी वार्ड चुनें और देखें कि BMC ने उसकी सड़क मरम्मत पर कितना पैसा दिया, काम किसने किया, और मरम्मत बारिश में टिकी या नहीं। यह नमूना डेटा है, BMC का आधिकारिक रिकॉर्ड नहीं।",
    mr: "कोणताही वॉर्ड निवडा आणि पाहा की BMC ने त्याच्या रस्ते दुरुस्तीसाठी किती पैसे दिले, काम कोणी केले, आणि दुरुस्ती पावसात टिकली का. हा नमुना डेटा आहे, BMC ची अधिकृत नोंद नाही.",
  },

  stat_wards: { en: "wards", hi: "वार्ड", mr: "वॉर्ड" },
  stat_jobs: { en: "repair jobs", hi: "मरम्मत काम", mr: "दुरुस्ती कामे" },
  stat_complaints: { en: "complaints", hi: "शिकायतें", mr: "तक्रारी" },

  // map panel
  map_population: { en: "Population (est.)", hi: "आबादी (अनुमान)", mr: "लोकसंख्या (अंदाज)" },
  map_area: { en: "Area", hi: "क्षेत्रफल", mr: "क्षेत्रफळ" },
  map_lowlying: { en: "Flood-prone index", hi: "जलभराव सूचकांक", mr: "पूरप्रवणता निर्देशांक" },
  map_crews: { en: "Repair crews", hi: "मरम्मत दल", mr: "दुरुस्ती पथके" },
  map_budget: { en: "Monsoon budget 2025", hi: "मानसून बजट 2025", mr: "पावसाळी बजेट 2025" },
  map_localities: { en: "Localities", hi: "इलाके", mr: "परिसर" },
  map_open_report: { en: "Open ward report →", hi: "वार्ड रिपोर्ट खोलें →", mr: "वॉर्ड अहवाल उघडा →" },
  map_close: { en: "Close", hi: "बंद करें", mr: "बंद करा" },
  map_ward: { en: "Ward", hi: "वार्ड", mr: "वॉर्ड" },
  map_title: { en: "Mumbai, ward by ward.", hi: "मुंबई, वार्ड दर वार्ड।", mr: "मुंबई, वॉर्डनिहाय." },
  map_sub_a: { en: "BMC wards, drawn from approximate boundaries. Click one to see its numbers.", hi: "BMC वार्ड, अनुमानित सीमाओं से बने। आँकड़े देखने के लिए किसी वार्ड पर क्लिक करें।", mr: "BMC वॉर्ड, अंदाजे सीमांवरून काढलेले. आकडे पाहण्यासाठी वॉर्डवर क्लिक करा." },
  map_roads: { en: "Show roads", hi: "सड़कें दिखाएँ", mr: "रस्ते दाखवा" },
  map_locate: { en: "My location", hi: "मेरी लोकेशन", mr: "माझे ठिकाण" },
  map_locating: { en: "Locating…", hi: "ढूँढ रहे हैं…", mr: "शोधत आहे…" },

  // menu
  nav_wards: { en: "Wards", hi: "वार्ड", mr: "वॉर्ड" },
  nav_audit: { en: "Wasted money", hi: "बर्बाद पैसा", mr: "वाया गेलेला पैसा" },
  nav_plan: { en: "Next rupee", hi: "अगला रुपया", mr: "पुढचा रुपया" },
  nav_people: { en: "People", hi: "लोग", mr: "लोक" },
  nav_flood: { en: "Flood watch", hi: "बाढ़ निगरानी", mr: "पूर निरीक्षण" },
  menu: { en: "Menu", hi: "मेनू", mr: "मेनू" },

  // shared
  synthetic: { en: "Synthetic data. Not BMC data; all contractors are fictional.", hi: "काल्पनिक डेटा। यह BMC का डेटा नहीं है; सभी ठेकेदार काल्पनिक हैं।", mr: "काल्पनिक डेटा. हा BMC चा डेटा नाही; सर्व कंत्राटदार काल्पनिक आहेत." },
  soon: { en: "This page is coming next.", hi: "यह पेज जल्द आ रहा है।", mr: "हे पान लवकरच येत आहे." },
  expected: { en: "expected", hi: "अपेक्षित", mr: "अपेक्षित" },
  more: { en: "more", hi: "और", mr: "आणखी" },
  ward: { en: "Ward", hi: "वार्ड", mr: "वॉर्ड" },

  // wards list
  wards_h: { en: "Pick a ward", hi: "वार्ड चुनें", mr: "वॉर्ड निवडा" },
  wards_sub: { en: "Share of each ward's repair money that went on fixes that failed or jobs flagged for review.", hi: "हर वार्ड के मरम्मत पैसे का वह हिस्सा जो टूटी मरम्मत या संदिग्ध कामों पर गया।", mr: "प्रत्येक वॉर्डच्या दुरुस्ती पैशाचा तो भाग जो तुटलेल्या दुरुस्ती किंवा संशयास्पद कामांवर गेला." },
  wards_at_issue: { en: "at issue", hi: "सवालों में", mr: "प्रश्नात" },

  // ward page
  w_spent: { en: "of budget spent", hi: "बजट खर्च", mr: "बजेट खर्च" },
  w_failed: { en: "on fixes that failed within 30 days", hi: "30 दिन में टूटी मरम्मत पर", mr: "30 दिवसांत तुटलेल्या दुरुस्तीवर" },
  w_flagged: { en: "on jobs flagged for review", hi: "संदिग्ध कामों पर", mr: "संशयास्पद कामांवर" },
  w_open: { en: "complaints still waiting", hi: "शिकायतें अब भी लंबित", mr: "तक्रारी अजूनही प्रलंबित" },
  w_do: { en: "Do this week", hi: "इस हफ्ते करें", mr: "या आठवड्यात करा" },
  w_card: { en: "Report card", hi: "रिपोर्ट कार्ड", mr: "प्रगतिपुस्तक" },
  w_deadlines: { en: "Deadlines met", hi: "समय पर काम", mr: "वेळेत काम" },
  w_failed_rate: { en: "Fixes that failed", hi: "टूटी मरम्मत", mr: "तुटलेली दुरुस्ती" },
  w_crew: { en: "Jobs per crew", hi: "प्रति दल काम", mr: "प्रति पथक कामे" },
  w_city: { en: "city", hi: "शहर", mr: "शहर" },
  w_money: { en: "Where the money went", hi: "पैसा कहाँ गया", mr: "पैसा कुठे गेला" },
  w_held: { en: "Lasted", hi: "टिकी", mr: "टिकली" },
  w_failed_s: { en: "Failed", hi: "टूटी", mr: "तुटली" },
  w_flagged_s: { en: "Flagged", hi: "संदिग्ध", mr: "संशयास्पद" },
  w_trail: { en: "From complaints to repairs", hi: "शिकायत से मरम्मत तक", mr: "तक्रारीपासून दुरुस्तीपर्यंत" },
  f_complaints: { en: "complaints", hi: "शिकायतें", mr: "तक्रारी" },
  f_dupes: { en: "duplicates", hi: "दोहराव", mr: "दुबार" },
  f_problems: { en: "real problems", hi: "असली समस्याएँ", mr: "खऱ्या समस्या" },
  f_fixed: { en: "fixed and lasted", hi: "ठीक हुईं, टिकीं", mr: "दुरुस्त, टिकल्या" },
  f_failed: { en: "fixed, then failed", hi: "ठीक हुईं, फिर टूटीं", mr: "दुरुस्त, मग तुटल्या" },
  f_never: { en: "never fixed", hi: "कभी ठीक नहीं हुईं", mr: "कधीच दुरुस्त नाहीत" },
  go_audit: { en: "Jobs to check", hi: "जाँच के काम", mr: "तपासायची कामे" },
  go_plan: { en: "Where to spend next", hi: "आगे कहाँ खर्च करें", mr: "पुढे कुठे खर्च करावा" },
  go_people: { en: "What people say", hi: "लोग क्या कह रहे हैं", mr: "लोक काय म्हणतात" },
  go_flood: { en: "Flood watch", hi: "बाढ़ निगरानी", mr: "पूर निरीक्षण" },

  // track page
  tk_label: { en: "For citizens", hi: "नागरिकों के लिए", mr: "नागरिकांसाठी" },
  tk_h: { en: "What happened to my complaint?", hi: "मेरी शिकायत का क्या हुआ?", mr: "माझ्या तक्रारीचे काय झाले?" },
  tk_p: { en: "Type a complaint number, work order, road or ward.", hi: "शिकायत नंबर, काम नंबर, सड़क या वार्ड लिखें।", mr: "तक्रार क्रमांक, काम क्रमांक, रस्ता किंवा वॉर्ड लिहा." },
  tk_btn: { en: "Search", hi: "खोजें", mr: "शोधा" },
  tk_try: { en: "Or open a real story", hi: "या एक असली कहानी खोलें", mr: "किंवा एक खरी गोष्ट उघडा" },
  ex_held: { en: "Fixed, and it lasted", hi: "ठीक हुआ, और टिका", mr: "दुरुस्त झाले, आणि टिकले" },
  ex_failed: { en: "Fixed, then broke again", hi: "ठीक हुआ, फिर टूट गया", mr: "दुरुस्त झाले, पुन्हा तुटले" },
  ex_never: { en: "Never fixed", hi: "कभी ठीक नहीं हुआ", mr: "कधीच दुरुस्त झाले नाही" },
  ex_double: { en: "Billed twice?", hi: "दो बार बिल?", mr: "दोनदा बिल?" },
  ex_over: { en: "Billed far above the rate", hi: "रेट से बहुत ज़्यादा बिल", mr: "दरापेक्षा खूप जास्त बिल" },
  ex_road: { en: "A road patched again and again", hi: "बार-बार पैच हुई सड़क", mr: "पुन्हा पुन्हा पॅच झालेला रस्ता" },
  st_complaint: { en: "Complaint", hi: "शिकायत", mr: "तक्रार" },
  st_assigned: { en: "Assigned", hi: "सौंपा गया", mr: "सोपवले" },
  st_started: { en: "Work started", hi: "काम शुरू", mr: "काम सुरू" },
  st_done: { en: "Repaired", hi: "मरम्मत पूरी", mr: "दुरुस्ती पूर्ण" },
  st_30: { en: "30 days later", hi: "30 दिन बाद", mr: "30 दिवसांनंतर" },
  v_held: { en: "Fixed, and it lasted", hi: "ठीक हुआ, और टिका रहा", mr: "दुरुस्त झाले, आणि टिकले" },
  v_failed: { en: "Fixed, but it broke again within 30 days", hi: "ठीक हुआ, पर 30 दिन में फिर टूट गया", mr: "दुरुस्त झाले, पण 30 दिवसांत पुन्हा तुटले" },
  v_never: { en: "No repair yet", hi: "अभी तक मरम्मत नहीं", mr: "अजून दुरुस्ती नाही" },
  v_dup: { en: "Closed as a duplicate", hi: "दोहराव मानकर बंद", mr: "दुबार म्हणून बंद" },
  v_fwd: { en: "Sent to another department", hi: "दूसरे विभाग को भेजा गया", mr: "दुसऱ्या विभागाकडे पाठवले" },
  never_do: { en: "What you can do: call 1916, visit the ward office, or tell your corporator.", hi: "आप क्या कर सकते हैं: 1916 पर कॉल करें, वार्ड कार्यालय जाएँ, या अपने पार्षद को बताएँ।", mr: "तुम्ही काय करू शकता: 1916 वर फोन करा, वॉर्ड कार्यालयात जा, किंवा नगरसेवकाला सांगा." },
  fx_contractor: { en: "Contractor", hi: "ठेकेदार", mr: "कंत्राटदार" },
  fx_cost: { en: "Cost", hi: "लागत", mr: "खर्च" },
  fx_took: { en: "Took", hi: "समय लगा", mr: "लागलेला वेळ" },
  fx_ontime: { en: "On time?", hi: "समय पर?", mr: "वेळेत?" },
  fx_photo: { en: "Citizen's photo", hi: "नागरिक की फ़ोटो", mr: "नागरिकाचा फोटो" },
  fx_remark: { en: "Engineer's note", hi: "इंजीनियर की टिप्पणी", mr: "अभियंत्याची नोंद" },
  yes: { en: "Yes", hi: "हाँ", mr: "हो" },
  no: { en: "No", hi: "नहीं", mr: "नाही" },
  days: { en: "days", hi: "दिन", mr: "दिवस" },
  hours: { en: "hours", hi: "घंटे", mr: "तास" },
  audit: { en: "Audit flag", hi: "ऑडिट चेतावनी", mr: "ऑडिट इशारा" },
  r_jobs: { en: "repairs", hi: "मरम्मत", mr: "दुरुस्त्या" },
  r_spent: { en: "spent", hi: "खर्च", mr: "खर्च" },
  r_lasted: { en: "lasted", hi: "टिकीं", mr: "टिकल्या" },
  r_flagged: { en: "flagged", hi: "संदिग्ध", mr: "संशयास्पद" },
  r_strip: { en: "Every repair on this road, June to October 2025", hi: "इस सड़क की हर मरम्मत, जून से अक्टूबर 2025", mr: "या रस्त्यावरील प्रत्येक दुरुस्ती, जून ते ऑक्टोबर 2025" },
  r_click: { en: "Click a dot to open that repair", hi: "मरम्मत खोलने के लिए बिंदु पर क्लिक करें", mr: "दुरुस्ती उघडण्यासाठी बिंदूवर क्लिक करा" },
  nothing: { en: "Nothing found. Try one of the stories below.", hi: "कुछ नहीं मिला। नीचे दी गई कहानियाँ देखें।", mr: "काहीही सापडले नाही. खालील गोष्टी पाहा." },
  grade: { en: "Grade", hi: "ग्रेड", mr: "श्रेणी" },
  ward_report: { en: "Ward report", hi: "वार्ड रिपोर्ट", mr: "वॉर्ड अहवाल" },
  months: { en: "Jun|Jul|Aug|Sep|Oct", hi: "जून|जुलाई|अगस्त|सितंबर|अक्टूबर", mr: "जून|जुलै|ऑगस्ट|सप्टें|ऑक्टो" },
} satisfies Record<string, Entry>;

export type Key = keyof typeof UI;
export function t(lang: Lang, key: Key): string {
  return UI[key][lang] || UI[key].en;
}
export const tr = (lang: Lang) => (key: Key) => t(lang, key);

// Repair methods and issue types, as they appear in the data.
const METHODS: Record<string, { hi: string; mr: string }> = {
  "Cold mix patch": { hi: "कोल्ड मिक्स पैच", mr: "कोल्ड मिक्स पॅच" },
  "Hot mix patch": { hi: "हॉट मिक्स पैच", mr: "हॉट मिक्स पॅच" },
  "Mastic asphalt": { hi: "मैस्टिक डामर", mr: "मॅस्टिक डांबर" },
  "Paver blocks relaid": { hi: "पेवर ब्लॉक दोबारा लगाए", mr: "पेव्हर ब्लॉक पुन्हा बसवले" },
  "Dewatering pump deployed": { hi: "पानी निकालने का पंप", mr: "पाणी उपसण्याचा पंप" },
  "Drain desilting": { hi: "नाली की गाद सफ़ाई", mr: "गटारातील गाळ उपसा" },
  "Pump + debris removal": { hi: "पंप + मलबा हटाना", mr: "पंप + राडारोडा हटवणे" },
  "Manhole cover replaced + grating": { hi: "मैनहोल ढक्कन और जाली बदली", mr: "मॅनहोल झाकण व जाळी बदलली" },
  "Excavation, pipeline repair, PQC patch": { hi: "खुदाई, पाइपलाइन मरम्मत, PQC पैच", mr: "खोदकाम, पाइपलाइन दुरुस्ती, PQC पॅच" },
  "Desilting and garbage removal": { hi: "गाद और कचरा सफ़ाई", mr: "गाळ व कचरा उपसा" },
};
const ISSUES: Record<string, { hi: string; mr: string }> = {
  "Pothole": { hi: "गड्ढा", mr: "खड्डा" },
  "Waterlogging": { hi: "जलभराव", mr: "पाणी साचणे" },
  "Open or broken manhole": { hi: "खुला या टूटा मैनहोल", mr: "उघडे किंवा तुटलेले मॅनहोल" },
  "Choked drain / nullah overflow": { hi: "बंद नाली / नाला उफान", mr: "तुंबलेले गटार / नाला" },
  "Road cave-in": { hi: "सड़क धंसना", mr: "रस्ता खचणे" },
  "Broken paver blocks": { hi: "टूटे पेवर ब्लॉक", mr: "तुटलेले पेव्हर ब्लॉक" },
  "Road related": { hi: "सड़क संबंधी", mr: "रस्त्याशी संबंधित" },
  "Other": { hi: "अन्य", mr: "इतर" },
};
const FLAGS: Record<string, { hi: string; mr: string }> = {
  "Over-billed": { hi: "ज़्यादा बिल", mr: "जास्त बिल" },
  "Possible double billing": { hi: "दो बार बिल?", mr: "दोनदा बिल?" },
  "Paid during DLP": { hi: "वारंटी में भुगतान", mr: "हमी काळात पेमेंट" },
};
const pick = (d: Record<string, { hi: string; mr: string }>) => (lang: Lang, v: string) => (lang === "en" ? v : d[v]?.[lang] ?? v);
export const method = pick(METHODS);
export const issue = pick(ISSUES);
export const flagName = pick(FLAGS);

// Inline translations for page text: say(lang)("English", "हिंदी", "मराठी").
// Use for any visible text that is not in the UI dictionary above.
export const say = (lang: Lang) => (en: string, hi: string, mr: string): string =>
  lang === "hi" ? hi || en : lang === "mr" ? mr || en : en;
