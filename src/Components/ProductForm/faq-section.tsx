"use client";
import { useState } from "react";

import { Card, CardContent, CardHeader, CardTitle } from "../UI/card";
import { Input } from "../UI/input";
import { Label } from "../UI/label";
import { Textarea } from "../UI/textarea";
import { Button } from "../UI/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../UI/dialog";
import { Checkbox } from "../UI/checkbox";
import { ScrollArea } from "../UI/scroll-area";
import { Badge } from "../UI/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "../UI/accordion";
import { Plus, ChevronUp, ChevronDown, Trash2 } from "lucide-react";

interface FAQItem {
  question: string;
  answer: string;
}

interface FAQSectionProps {
  faqs: FAQItem[];
  setFaqs: (faqs: FAQItem[]) => void;
  templates?: any[]; // Array of templates
}

export default function FAQSection({
  faqs,
  setFaqs,
  templates = [],
}: FAQSectionProps) {
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  // Store selected FAQs as strings "templateIndex-faqIndex"
  const [selectedFoqs, setSelectedFoqs] = useState<Set<string>>(new Set());

  // Reset selection when modal opens
  const handleOpenLibrary = () => {
    setSelectedFoqs(new Set());
    setIsLibraryOpen(true);
  };

  const toggleFaqSelection = (tIndex: number, fIndex: number) => {
    const key = `${tIndex}-${fIndex}`;
    const newSelection = new Set(selectedFoqs);
    if (newSelection.has(key)) {
      newSelection.delete(key);
    } else {
      newSelection.add(key);
    }
    setSelectedFoqs(newSelection);
  };

  const handleAddSelected = () => {
    const newFaqsToAdd: FAQItem[] = [];
    selectedFoqs.forEach((key) => {
      const [tIndex, fIndex] = key.split("-").map(Number);
      const template = templates[tIndex];
      if (template && template.faqs && template.faqs[fIndex]) {
        newFaqsToAdd.push({ ...template.faqs[fIndex] });
      }
    });

    if (newFaqsToAdd.length > 0) {
      // Filter out empty initial FAQ if it exists and is the only one
      let currentFaqs = [...faqs];
      if (
        currentFaqs.length === 1 &&
        !currentFaqs[0].question &&
        !currentFaqs[0].answer
      ) {
        currentFaqs = [];
      }
      setFaqs([...currentFaqs, ...newFaqsToAdd]);
    }
    setIsLibraryOpen(false);
  };

  const handleAddFAQ = () => {
    setFaqs([...faqs, { question: "", answer: "" }]);
  };

  const handleRemoveFAQ = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const handleChangeFAQ = (
    index: number,
    field: "question" | "answer",
    value: string,
  ) => {
    const updatedFaqs = [...faqs];
    updatedFaqs[index] = { ...updatedFaqs[index], [field]: value };
    setFaqs(updatedFaqs);
  };

  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <Card className="bg-card border-border">
      <CardHeader
        className="border-b border-border pb-4 cursor-pointer flex flex-row items-center justify-between"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <CardTitle className="text-lg font-semibold">FAQs</CardTitle>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-5 h-5 text-muted-foreground" />
        )}
      </CardHeader>
      {isExpanded && (
        <CardContent className="pt-6 space-y-4">
          {faqs.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {faqs.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`faq-${index}`}
                  className="border border-border rounded-lg overflow-hidden mb-3"
                >
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
                      <Label
                        htmlFor={`question-${index}`}
                        className="text-sm font-medium"
                      >
                        Question
                      </Label>
                      <Input
                        id={`question-${index}`}
                        placeholder="Enter FAQ question"
                        value={faq.question}
                        onChange={(e) =>
                          handleChangeFAQ(index, "question", e.target.value)
                        }
                        className="bg-card border-input"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor={`answer-${index}`}
                        className="text-sm font-medium"
                      >
                        Answer
                      </Label>
                      <Textarea
                        id={`answer-${index}`}
                        placeholder="Enter FAQ answer"
                        value={faq.answer}
                        onChange={(e) =>
                          handleChangeFAQ(index, "answer", e.target.value)
                        }
                        className="bg-card border-input min-h-24 resize-none"
                      />
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : null}

          <div className="flex gap-4 items-center justify-between border-t border-border pt-4">
            <Dialog open={isLibraryOpen} onOpenChange={setIsLibraryOpen}>
              <DialogTrigger asChild>
                <Button
                  variant="secondary"
                  onClick={handleOpenLibrary}
                  className="w-full sm:w-auto"
                >
                  Add from Library
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                <DialogHeader>
                  <DialogTitle>Select FAQs from Library</DialogTitle>
                  <DialogDescription>
                    Choose one or more FAQs from your templates to add to this
                    product.
                  </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 pr-4 mt-4 border rounded-md p-4">
                  {templates.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No templates found.
                    </p>
                  ) : (
                    <div className="space-y-6">
                      {templates.map((template, tIndex) => (
                        <div key={template.id} className="space-y-3">
                          <div className="flex items-center justify-between border-b pb-2">
                            <h4 className="font-semibold text-sm">
                              {template.title}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {template.faqs?.length || 0} FAQs
                            </Badge>
                          </div>
                          <div className="grid gap-3 pl-2">
                            {template.faqs?.map((faq: any, fIndex: number) => {
                              const key = `${tIndex}-${fIndex}`;
                              const isSelected = selectedFoqs.has(key);
                              return (
                                <div
                                  key={fIndex}
                                  className="flex items-start space-x-3 p-2 rounded hover:bg-muted/50 transition-colors"
                                >
                                  <Checkbox
                                    id={`chk-${key}`}
                                    checked={isSelected}
                                    onCheckedChange={() =>
                                      toggleFaqSelection(tIndex, fIndex)
                                    }
                                    className="mt-1"
                                  />
                                  <div className="grid gap-1.5 leading-none">
                                    <label
                                      htmlFor={`chk-${key}`}
                                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                    >
                                      {faq.question}
                                    </label>
                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                      {faq.answer}
                                    </p>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <DialogFooter className="mt-4">
                  <Button
                    variant="outline"
                    onClick={() => setIsLibraryOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddSelected}
                    disabled={selectedFoqs.size === 0}
                  >
                    Add {selectedFoqs.size} Selected FAQs
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Button
              onClick={handleAddFAQ}
              className="gap-2 bg-blue-500 hover:bg-blue-600 text-white"
            >
              <Plus className="w-4 h-4" />
              Add Custom FAQ
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
