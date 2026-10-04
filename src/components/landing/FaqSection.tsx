import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
}

export function FaqSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs: FaqItem[] = [
    {
      q: 'Who can apply for VIP access?',
      a: 'Anyone interested in attending may apply through this website. Management reviews each application individually.',
    },
    {
      q: 'How does the application process work?',
      a: 'You fill out a short form with your name, contact information, and preferred date. Management reviews your details and checks seat availability.',
    },
    {
      q: 'How will I know if my application is approved?',
      a: 'You will receive an email from management with your application reference and a link to complete the next step and payment.',
    },
    {
      q: 'How are reservations confirmed?',
      a: 'Once management confirms your payment, your reservation is secured and your VIP Pass is created.',
    },
    {
      q: 'How will I receive my VIP Pass?',
      a: 'Your VIP Pass is available online immediately after payment is confirmed. You can view it on your phone, download the image, and present it at check-in.',
    },
  ];

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section id="faq" className="py-16 md:py-24 border-b border-white/[0.06] bg-[#090C12]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto space-y-3 mb-12">
          <div className="flex items-center justify-center gap-2 text-xs uppercase tracking-widest text-slate-400 font-semibold font-mono">
            <span>Questions & Answers</span>
            <span aria-hidden="true">·</span>
            <span>Help</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-white">
            Frequently Asked Questions
          </h2>

          <p className="text-sm sm:text-base text-slate-400 leading-relaxed">
            Quick answers about applying, payments, and receiving your VIP Pass.
          </p>
        </div>

        {/* FAQ Accordion List */}
        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = openIndex === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-[#0E1118] border border-white/[0.07] overflow-hidden transition-all shadow-md"
              >
                <button
                  type="button"
                  onClick={() => toggle(idx)}
                  className="w-full min-h-[56px] px-6 py-4 flex items-center justify-between text-left gap-4 cursor-pointer focus:outline-none"
                  aria-expanded={isOpen}
                >
                  <span className="text-sm sm:text-base font-semibold text-white">
                    {faq.q}
                  </span>
                  <div
                    className={`w-7 h-7 rounded-full bg-white/[0.04] flex items-center justify-center text-slate-300 transition-transform duration-200 shrink-0 ${
                      isOpen ? 'rotate-180 bg-white/[0.1] text-white' : ''
                    }`}
                  >
                    <ChevronDown className="w-4 h-4" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-5 text-sm text-slate-300 leading-relaxed border-t border-white/[0.04] pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
