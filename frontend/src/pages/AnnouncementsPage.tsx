import React, { useState } from "react";
import {
  Volume2,
  Copy,
  Check,
  Languages,
  Clock,
  Radio
} from "lucide-react";

interface AnnouncementsPageProps {
  simTime: string;
}

export const AnnouncementsPage: React.FC<AnnouncementsPageProps> = ({ simTime }) => {
  const [selectedTrain, setSelectedTrain] = useState<string>("T101");
  const [selectedLang, setSelectedLang] = useState<"en" | "hi" | "mr">("en");
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  const trains = [
    { id: "T101", name: "12124 Deccan Superfast Express", route: "Mumbai CST ➔ Lonavala", platform: "PF 2" },
    { id: "T102", name: "95102 Local Commuter Fast", route: "Mumbai CST ➔ Karjat", platform: "PF 4" },
    { id: "T103", name: "95203 Karjat Siding Shuttle", route: "Kalyan ➔ Karjat", platform: "PF 1" },
    { id: "T104", name: "12125 Pragati Express (Down Line)", route: "Lonavala ➔ Mumbai CST", platform: "PF 3" },
  ];

  // Helper to extract HH:MM from ISO
  const getHHMM = (offsetMin: number = 0) => {
    try {
      const d = new Date(simTime);
      const target = new Date(d.getTime() + offsetMin * 60000);
      return `${String(target.getHours()).padStart(2, "0")}:${String(target.getMinutes()).padStart(2, "0")}`;
    } catch {
      return "16:25";
    }
  };

  const notifications: Record<string, { en: string; hi: string; mr: string; tone: string }> = {
    T101: {
      en: `Attention passengers! Train number 12124 Deccan Superfast Express for Lonavala is expected to arrive at Kalyan Junction Platform Number 2 at ${getHHMM(15)}. Expected uncertainty window is ${getHHMM(14)} to ${getHHMM(17)}. Passengers are requested to stay behind the yellow line.`,
      hi: `यात्रीगण कृपया ध्यान दें! गाड़ी संख्या 12124 डेक्कन सुपरफास्ट एक्सप्रेस लोनावाला के लिए कल्याण जंक्शन के प्लेटफार्म नंबर 2 पर ${getHHMM(15)} बजे आने की संभावना है। आगमन समय सीमा ${getHHMM(14)} से ${getHHMM(17)} है। कृपया पीली रेखा के पीछे रहें।`,
      mr: `प्रवाशांनी कृपया लक्ष द्या! गाडी क्रमांक 12124 डेक्कन सुपरफास्ट एक्सप्रेस लोणावळ्यासाठी कल्याण जंक्शनच्या फलाट क्रमांक 2 वर ${getHHMM(15)} वाजता येण्याची शक्यता आहे. आगमन वेळ ${getHHMM(14)} ते ${getHHMM(17)} दरम्यान आहे. कृपया पिवळ्या रेषेच्या मागे उभे राहा.`,
      tone: "CHIME_HIGH"
    },
    T102: {
      en: `May I have your attention please! Train number 95102 Fast Local for Karjat is currently boarding at Mumbai CST Platform Number 4. Scheduled departure is at ${getHHMM(5)}.`,
      hi: `कृपया ध्यान दें! गाड़ी संख्या 95102 फास्ट लोकल कर्जत के लिए मुंबई सीएसटी के प्लेटफार्म नंबर 4 पर तैयार है। प्रस्थान समय ${getHHMM(5)} बजे है।`,
      mr: `कृपया लक्ष द्या! गाडी क्रमांक 95102 फास्ट लोकल कर्जतसाठी मुंबई सीएसटीच्या फलाट क्रमांक 4 वर उपलब्ध आहे. प्रस्थान वेळ ${getHHMM(5)} वाजता आहे.`,
      tone: "CHIME_MED"
    },
    T103: {
      en: `Train number 95203 Karjat Shuttle is scheduled for departure from Kalyan Junction Platform Number 1 at ${getHHMM(25)}.`,
      hi: `गाड़ी संख्या 95203 कर्जत शटल कल्याण जंक्शन के प्लेटफार्म नंबर 1 से ${getHHMM(25)} बजे रवाना होगी।`,
      mr: `गाडी क्रमांक 95203 कर्जत शटल कल्याण जंक्शनच्या फलाट क्रमांक 1 वरून ${getHHMM(25)} वाजता सुटेल.`,
      tone: "CHIME_LOW"
    },
    T104: {
      en: `Train number 12125 Pragati Express from Lonavala to Mumbai CST is running on Down Main Line, arriving at Karjat Junction Platform Number 3 at ${getHHMM(55)}.`,
      hi: `गाड़ी संख्या 12125 प्रगति एक्सप्रेस लोनावाला से मुंबई सीएसटी डाउन मेन लाइन पर चल रही है, कर्जत जंक्शन प्लेटफार्म 3 पर ${getHHMM(55)} बजे पहुंचेगी।`,
      mr: `गाडी क्रमांक 12125 प्रगती एक्सप्रेस लोणावळा ते मुंबई सीएसटी डाऊन मेन लाईनवर धावत असून कर्जत जंक्शन फलाट क्रमांक 3 वर ${getHHMM(55)} वाजता पोहोचेल.`,
      tone: "CHIME_HIGH"
    }
  };

  const activeNotif = notifications[selectedTrain] || notifications.T101;
  const currentText = activeNotif[selectedLang];

  const handlePlayAudio = () => {
    setIsPlayingAudio(true);
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(currentText);
      if (selectedLang === "hi") utterance.lang = "hi-IN";
      else if (selectedLang === "mr") utterance.lang = "mr-IN";
      else utterance.lang = "en-IN";
      utterance.rate = 0.95;
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
    } else {
      setTimeout(() => setIsPlayingAudio(false), 3000);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(currentText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-900 text-white rounded-2xl p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 bg-blue-500/30 border border-blue-400/40 text-blue-100 text-xs px-2.5 py-0.5 rounded-full font-semibold mb-2">
              <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-300" />
              Live Passenger Announcement System (PAS)
            </div>
            <h1 className="text-xl md:text-2xl font-black tracking-wide">
              Multilingual Audio & Broadcast System
            </h1>
            <p className="text-xs text-blue-100/90 mt-1 max-w-2xl">
              Real-time trilingual audio synthesizer (English, Hindi, Marathi) for station concourses, dynamic SMS broadcasts, and passenger notification feeds.
            </p>
          </div>
          <div className="flex items-center gap-2 bg-blue-950/60 border border-blue-400/30 px-3 py-2 rounded-xl text-xs font-mono">
            <Clock className="w-4 h-4 text-emerald-400" />
            <span>Sim Time: {getHHMM(0)}</span>
          </div>
        </div>
      </div>

      {/* Train Selector Tabs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {trains.map((t) => {
          const isSelected = selectedTrain === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSelectedTrain(t.id)}
              className={`p-4 rounded-xl border text-left transition cursor-pointer ${
                isSelected
                  ? "bg-blue-50/80 border-blue-600 shadow-md ring-2 ring-blue-500/30"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              }`}
            >
              <div className="flex justify-between items-start">
                <span className="text-xs font-bold font-mono px-2 py-0.5 rounded bg-slate-900 text-white">
                  {t.id}
                </span>
                <span className="text-[11px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                  {t.platform}
                </span>
              </div>
              <h3 className="font-bold text-sm text-slate-900 mt-2 line-clamp-1">{t.name}</h3>
              <p className="text-xs text-slate-500 mt-0.5">{t.route}</p>
            </button>
          );
        })}
      </div>

      {/* Broadcast Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-6">
        {/* Language Tabs */}
        <div className="flex items-center justify-between flex-wrap gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
            <Languages className="w-4 h-4 text-blue-600" />
            <span>Select Broadcast Language:</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              onClick={() => setSelectedLang("en")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedLang === "en" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              English
            </button>
            <button
              onClick={() => setSelectedLang("hi")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedLang === "hi" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              हिन्दी (Hindi)
            </button>
            <button
              onClick={() => setSelectedLang("mr")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedLang === "mr" ? "bg-white text-blue-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              मराठी (Marathi)
            </button>
          </div>
        </div>

        {/* Announcement Script Box */}
        <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="font-semibold text-emerald-400 uppercase tracking-wider text-[11px]">
                Audio Synthesizer Ready ({selectedLang.toUpperCase()})
              </span>
            </div>
            <span className="font-mono text-[11px] text-slate-500">Chime: Indian Railways Dual Tone</span>
          </div>

          <p className="text-base md:text-lg leading-relaxed text-slate-100 font-medium font-sans">
            "{currentText}"
          </p>

          <div className="pt-2 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800">
            <button
              onClick={handlePlayAudio}
              disabled={isPlayingAudio}
              className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition cursor-pointer shadow-md ${
                isPlayingAudio
                  ? "bg-amber-600 text-white animate-pulse"
                  : "bg-emerald-600 hover:bg-emerald-500 text-white"
              }`}
            >
              <Volume2 className="w-4 h-4" />
              <span>{isPlayingAudio ? "Playing Station Announcement..." : "Play Station Audio (TTS)"}</span>
            </button>

            <button
              onClick={handleCopy}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-lg text-xs font-semibold flex items-center gap-2 transition border border-slate-700 cursor-pointer"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? "Copied Script!" : "Copy SMS / Broadcast Text"}</span>
            </button>
          </div>
        </div>

        {/* Trilingual Grid Preview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">English Broadcast</span>
            <p className="text-xs text-slate-700 leading-relaxed">{activeNotif.en}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">हिन्दी उद्घोषणा</span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{activeNotif.hi}</p>
          </div>
          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">मराठी उद्घोषणा</span>
            <p className="text-xs text-slate-700 leading-relaxed font-sans">{activeNotif.mr}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
