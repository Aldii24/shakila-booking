"use client";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

export type FaqItem = { question: string; answer: string };

export function PremiumFaq({ items }: { items: FaqItem[] }) {
  return <Accordion type="single" defaultValue="item-0" collapsible className="premium-accordion">
    {items.map((item, index) => <AccordionItem value={`item-${index}`} key={item.question}>
      <AccordionTrigger><span className="premium-accordion-number" aria-hidden="true">0{index + 1}</span><span className="premium-accordion-question">{item.question}</span></AccordionTrigger>
      <AccordionContent>{item.answer}</AccordionContent>
    </AccordionItem>)}
  </Accordion>;
}
