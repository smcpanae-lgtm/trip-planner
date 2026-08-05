"use client";

import { HelpCircle, ListChecks, ChevronDown } from "lucide-react";
import { useTranslation } from "@/lib/lifemap/i18n/LanguageContext";
import { translations } from "@/lib/lifemap/i18n/dictionaries";

// ヘッダーの「使い方」「よくある質問」リンク（#howto / #faq）の着地先。
// 本文は配列なので t() ではなく辞書を直接読む。
export default function LifeMapGuide() {
  const { lang } = useTranslation();
  const guide = translations[lang].guide;

  return (
    <>
      {/* 使い方 */}
      <section
        id="howto"
        className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] mt-12 scroll-mt-[128px]"
      >
        <h2 className="flex items-center gap-2 text-[22px] font-extrabold text-[#2B2721]">
          <ListChecks className="w-5 h-5 text-[#1C7A66]" strokeWidth={1.9} />
          {guide.howtoTitle}
        </h2>
        <p className="mt-2 mb-5 text-[13.5px] leading-relaxed text-[#6B6357] max-w-[62ch]">
          {guide.howtoLead}
        </p>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 list-none p-0">
          {guide.steps.map((step, index) => (
            <li
              key={step.title}
              className="bg-white rounded-[18px] border border-[#EEE7DA] shadow-[0_4px_22px_rgba(43,39,33,.05)] p-[18px]"
            >
              <span className="inline-grid place-items-center w-7 h-7 rounded-full bg-[#E7F1EE] text-[#145E4E] text-[13px] font-extrabold">
                {index + 1}
              </span>
              <h3 className="mt-2.5 text-[14.5px] font-extrabold text-[#2B2721] leading-snug">
                {step.title}
              </h3>
              <p className="mt-1.5 text-[12.5px] leading-relaxed text-[#6B6357]">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* よくある質問 */}
      <section
        id="faq"
        className="max-w-[1080px] mx-auto px-[18px] sm:px-[28px] mt-12 scroll-mt-[128px]"
      >
        <h2 className="flex items-center gap-2 text-[22px] font-extrabold text-[#2B2721]">
          <HelpCircle className="w-5 h-5 text-[#1C7A66]" strokeWidth={1.9} />
          {guide.faqTitle}
        </h2>
        <p className="mt-2 mb-5 text-[13.5px] leading-relaxed text-[#6B6357] max-w-[62ch]">
          {guide.faqLead}
        </p>

        <div className="space-y-2.5">
          {guide.faqs.map((faq, index) => (
            <details
              key={faq.q}
              open={index === 0}
              className="group bg-white rounded-[18px] border border-[#EEE7DA] shadow-[0_4px_22px_rgba(43,39,33,.05)] px-[18px] py-4"
            >
              <summary className="flex items-center justify-between gap-3 cursor-pointer list-none text-[14px] font-extrabold text-[#2B2721]">
                {faq.q}
                <ChevronDown className="w-4 h-4 shrink-0 text-[#A79E8C] transition-transform group-open:rotate-180" />
              </summary>
              <p className="mt-2.5 text-[12.5px] leading-relaxed text-[#6B6357]">
                {faq.a}
              </p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
