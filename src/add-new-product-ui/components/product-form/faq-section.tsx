'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Plus, Trash2 } from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  setFaqs: (faqs: FAQItem[]) => void;
}

export default function FAQSection({ faqs, setFaqs }: FAQSectionProps) {
  const handleAddFAQ = () => {
    setFaqs([...faqs, { question: '', answer: '' }]);
  };

  const handleRemoveFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleChangeFAQ = (index: number, field: 'question' | 'answer', value: string) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-semibold">FAQs</CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {faqs.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`faq-${index}`} className="border border-border rounded-lg overflow-hidden mb-3">
                <AccordionTrigger className="hover:no-underline px-4 py-3 hover:bg-muted/50">
                  <div className="flex-1 text-left flex items-center justify-between gap-4">
                    <span className="font-medium text-sm text-foreground">
                      {faq.question || `Question ${index + 1}`}
                    </span>
                    {faqs.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveFAQ(index);
                        }}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 pt-2 bg-muted/20 space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor={`question-${index}`} className="text-sm font-medium">
                      Question
                    </Label>
                    <Input
                      id={`question-${index}`}
                      placeholder="Enter FAQ question"
                      value={faq.question}
                      onChange={(e) => handleChangeFAQ(index, 'question', e.target.value)}
                      className="bg-card border-input"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`answer-${index}`} className="text-sm font-medium">
                      Answer
                    </Label>
                    <Textarea
                      id={`answer-${index}`}
                      placeholder="Enter FAQ answer"
                      value={faq.answer}
                      onChange={(e) => handleChangeFAQ(index, 'answer', e.target.value)}
                      className="bg-card border-input min-h-24 resize-none"
                    />
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        ) : null}

        <Button
          onClick={handleAddFAQ}
          className="w-full gap-2 bg-blue-500 hover:bg-blue-600 text-white"
        >
          <Plus className="w-4 h-4" />
          Add FAQ
        </Button>
      </CardContent>
    </Card>
  );
}
