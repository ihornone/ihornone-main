import React, { useState } from 'react';
import { Drawer } from 'vaul';

export interface QuickContactModalProps {
  triggerText?: string;
  triggerClass?: string;
}

export const QuickContactModal: React.FC<QuickContactModalProps> = ({
  triggerText = 'Форма заявки',
  triggerClass = 'pill-btn-outline !text-sm sm:!text-base w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    message: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const text = encodeURIComponent(
          `Привіт! Мене звати ${formData.name}. Контакт: ${formData.contact}. Повідомлення: ${formData.message}`
        );
        window.open(`https://t.me/ihornone?text=${text}`, '_blank');
        setSubmitted(true);
      }
    } catch {
      const text = encodeURIComponent(
        `Привіт! Мене звати ${formData.name}. Контакт: ${formData.contact}. Повідомлення: ${formData.message}`
      );
      window.open(`https://t.me/ihornone?text=${text}`, '_blank');
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  const socials = [
    {
      name: 'Telegram',
      href: 'https://t.me/ihornone',
      icon: 'fa-brands fa-telegram text-[#2AABEE]',
      color: 'bg-[#2AABEE]/10',
    },
    {
      name: 'GitHub',
      href: 'https://github.com/ihornone',
      icon: 'fa-brands fa-github text-[#181717]',
      color: 'bg-black/5',
    },
    {
      name: 'Instagram',
      href: 'https://instagram.com/ihornone',
      icon: 'fa-brands fa-instagram text-[#E4405F]',
      color: 'bg-[#E4405F]/10',
    },
    {
      name: 'Threads',
      href: 'https://threads.net/@ihornone',
      icon: 'fa-brands fa-threads text-[#000000]',
      color: 'bg-black/5',
    },
    {
      name: 'Email',
      href: 'mailto:ihornone.dev@gmail.com',
      icon: 'fa-solid fa-envelope text-[#EA4335]',
      color: 'bg-[#EA4335]/10',
    },
  ];

  return (
    <Drawer.Root open={isOpen} onOpenChange={setIsOpen}>
      <Drawer.Trigger asChild>
        <button type="button" className={triggerClass} aria-label="Відкрити швидку заявку">
          <i className="fa-solid fa-envelope text-xs opacity-75"></i>
          <span>{triggerText}</span>
        </button>
      </Drawer.Trigger>
      
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-xs z-[100] transition-opacity duration-300" />
        
        {/* Responsive Drawer: Bottom Sheet on Mobile (slides up), Side Drawer on Desktop (slides from right) */}
        <Drawer.Content className="bg-white flex flex-col fixed z-[101] shadow-2xl overflow-hidden outline-none bottom-0 left-0 right-0 max-h-[92vh] rounded-t-[20px] sm:bottom-0 sm:top-0 sm:right-0 sm:left-auto sm:h-full sm:max-h-full sm:w-[460px] sm:rounded-none sm:rounded-l-[20px] border-t sm:border-t-0 sm:border-l border-[#2A1E1E]/10">
          
          {/* Top Handle for mobile bottom sheet */}
          <div className="pt-3 pb-1 bg-white flex justify-center sm:hidden">
            <div className="w-12 h-1.5 bg-[#2A1E1E]/20 rounded-full" />
          </div>

          <div className="p-6 sm:p-7 overflow-y-auto space-y-5 flex-grow font-sans">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 pb-2 border-b border-[#2A1E1E]/5">
              <Drawer.Title className="text-xl sm:text-2xl font-black text-[#2A1E1E] tracking-tight m-0">
                Зв'язатися зі мною
              </Drawer.Title>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="w-9 h-9 rounded-full bg-[#2A1E1E]/5 hover:bg-[#2A1E1E]/10 flex items-center justify-center text-[#2A1E1E] text-base cursor-pointer border-none transition-colors shrink-0"
                aria-label="Закрити"
              >
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            {submitted ? (
              <div className="text-center py-10 space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xl mx-auto">
                  <i className="fa-solid fa-check"></i>
                </div>
                <h3 className="text-lg font-black text-[#2A1E1E]">Дякую за звернення!</h3>
                <p className="text-xs sm:text-sm text-[#2A1E1E]/70">
                  Я вже отримав ваше повідомлення та зв'яжусь з вами найближчим часом.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSubmitted(false);
                    setIsOpen(false);
                  }}
                  className="w-full py-3 rounded-[10px] bg-[#2A1E1E] text-white text-xs font-bold mt-3 cursor-pointer"
                >
                  Зрозуміло
                </button>
              </div>
            ) : (
              <>
                {/* Form Fields matching the user's reference mockup */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black tracking-wider uppercase text-[#2A1E1E]">
                      ІМ'Я <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Ваше ім'я"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F1ED] rounded-[10px] border border-transparent text-sm text-[#2A1E1E] placeholder:text-[#2A1E1E]/40 focus:border-[#D09AFC] focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black tracking-wider uppercase text-[#2A1E1E]">
                      ЗРУЧНИЙ ЗВ'ЯЗОК <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Telegram, email або телефон"
                      value={formData.contact}
                      onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F1ED] rounded-[10px] border border-transparent text-sm text-[#2A1E1E] placeholder:text-[#2A1E1E]/40 focus:border-[#D09AFC] focus:bg-white outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-black tracking-wider uppercase text-[#2A1E1E]">
                      ПОВІДОМЛЕННЯ <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      required
                      placeholder="Коротко опишіть вашу ідею..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-3 bg-[#F5F1ED] rounded-[10px] border border-transparent text-sm text-[#2A1E1E] placeholder:text-[#2A1E1E]/40 focus:border-[#D09AFC] focus:bg-white outline-none transition-all resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 px-6 rounded-[10px] bg-[#221F1F] hover:bg-[#332E2E] active:scale-[0.99] text-white text-sm font-black flex items-center justify-center gap-2 cursor-pointer shadow-md transition-all disabled:opacity-50"
                  >
                    {loading ? (
                      <span>Надсилання...</span>
                    ) : (
                      <>
                        <span>Надіслати</span>
                        <i className="fa-solid fa-arrow-right text-xs"></i>
                      </>
                    )}
                  </button>
                </form>

                {/* Social Networks List matching the screenshot */}
                <div className="pt-2 space-y-3">
                  <div className="text-center">
                    <span className="text-[11px] font-black text-[#2A1E1E]/40 uppercase tracking-widest">
                      СОЦМЕРЕЖІ
                    </span>
                  </div>

                  <div className="space-y-2">
                    {socials.map((social) => (
                      <a
                        key={social.name}
                        href={social.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 px-4 rounded-[10px] bg-[#F5F1ED] hover:bg-[#EFEAE5] transition-all text-[#2A1E1E] no-underline group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 flex items-center justify-center text-lg">
                            <i className={social.icon}></i>
                          </div>
                          <span className="text-sm font-bold text-[#2A1E1E]">{social.name}</span>
                        </div>
                        <i className="fa-solid fa-arrow-up-right-from-square text-xs text-[#2A1E1E]/30 group-hover:text-[#2A1E1E]/70 transition-colors"></i>
                      </a>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
};
