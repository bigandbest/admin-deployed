"use client";

import { Button } from "../UI/button";
import { Input } from "../UI/input";
import { Label } from "../UI/label";
import { Plus, X } from "lucide-react";

interface Attribute {
  attribute_name: string;
  attribute_value: string;
}

interface AttributeEditorProps {
  attributes: Attribute[];
  onAttributeChange: (attributes: Attribute[]) => void;
}

export default function AttributeEditor({
  attributes,
  onAttributeChange,
}: AttributeEditorProps) {
  const addAttribute = () => {
    onAttributeChange([
      ...attributes,
      { attribute_name: "", attribute_value: "" },
    ]);
  };

  const removeAttribute = (index: number) => {
    onAttributeChange(attributes.filter((_, i) => i !== index));
  };

  const updateAttribute = (index: number, field: string, value: string) => {
    const updated = [...attributes];
    updated[index] = { ...updated[index], [field]: value };
    onAttributeChange(updated);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-semibold">Attributes</Label>
        <Button
          size="sm"
          onClick={addAttribute}
          variant="outline"
          className="gap-1 h-8 bg-transparent"
        >
          <Plus className="w-3 h-3" />
          Add Attribute
        </Button>
      </div>

      <div className="space-y-3">
        {attributes.length === 0 ? (
          <p className="text-xs text-muted-foreground">
            No attributes added yet
          </p>
        ) : (
          attributes.map((attr, index) => (
            <div key={index} className="flex gap-2 items-end">
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={`attr-name-${index}`}
                  className="text-xs font-medium"
                >
                  Attribute Name
                </Label>
                <Input
                  id={`attr-name-${index}`}
                  placeholder="e.g., Size, Color, Weight"
                  value={attr.attribute_name}
                  onChange={(e) =>
                    updateAttribute(index, "attribute_name", e.target.value)
                  }
                  className="bg-card border-input text-sm h-8"
                />
              </div>
              <div className="flex-1 space-y-1">
                <Label
                  htmlFor={`attr-value-${index}`}
                  className="text-xs font-medium"
                >
                  Value
                </Label>
                <Input
                  id={`attr-value-${index}`}
                  placeholder="e.g., M, Red, 1kg"
                  value={attr.attribute_value}
                  onChange={(e) =>
                    updateAttribute(index, "attribute_value", e.target.value)
                  }
                  className="bg-card border-input text-sm h-8"
                />
              </div>
              <Button
                size="sm"
                onClick={() => removeAttribute(index)}
                variant="ghost"
                className="text-destructive hover:text-destructive hover:bg-destructive/10 h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
