import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function QuillEditor({
  value,
  onChange,
  placeholder = "Enter description...",
}: QuillEditorProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const quillInstanceRef = useRef<Quill | null>(null);

  useEffect(() => {
    if (!wrapperRef.current || quillInstanceRef.current) return;

    // Create a new container div inside the wrapper
    const container = document.createElement('div');
    wrapperRef.current.appendChild(container);

    const quill = new Quill(container, {
      theme: "snow",
      placeholder,
      modules: {
        toolbar: [
          [{ header: [1, 2, 3, false] }],
          ["bold", "italic", "underline", "strike"],
          [{ list: "ordered" }, { list: "bullet" }],
          [{ color: [] }, { background: [] }],
          [{ align: [] }],
          ["link"],
          ["clean"],
        ],
      },
    });

    quillInstanceRef.current = quill;

    if (value) {
      quill.clipboard.dangerouslyPasteHTML(value);
    }

    quill.on("text-change", () => {
      const html = quill.root.innerHTML;
      onChange(html === "<p><br></p>" ? "" : html);
    });

    return () => {
      quill.off("text-change");
      quillInstanceRef.current = null;
      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Update editor content when value prop changes externally
  useEffect(() => {
    const quill = quillInstanceRef.current;
    // Check if quill is ready. Handle null/undefined value as empty string.
    const val = value || "";

    if (!quill) return;

    const currentContent = quill.root.innerHTML;

    // Only update if content is different to avoid cursor jumps
    if (currentContent !== val) {
      quill.clipboard.dangerouslyPasteHTML(val);
    }
  }, [value]);

  return <div ref={wrapperRef} style={{ minHeight: "200px" }} />;
}
