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
  const lastEditorHtmlRef = useRef<string>("");

  useEffect(() => {
    if (!wrapperRef.current) return;

    // Prevent double initialization
    if (quillInstanceRef.current) return;

    // Clear any existing content first
    wrapperRef.current.innerHTML = "";

    // Create a new container div inside the wrapper
    const container = document.createElement("div");
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
      const val = html === "<p><br></p>" ? "" : html;
      lastEditorHtmlRef.current = val;
      onChange(val);
    });

    return () => {
      // Properly cleanup
      if (quillInstanceRef.current) {
        quillInstanceRef.current.off("text-change");
        quillInstanceRef.current = null;
      }
      // Clear the wrapper to remove all Quill-generated DOM
      if (wrapperRef.current) {
        wrapperRef.current.innerHTML = "";
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

  // Update editor content when value prop changes externally (not from user typing)
  useEffect(() => {
    const quill = quillInstanceRef.current;
    const val = value || "";

    if (!quill) return;

    // Skip if this value was just emitted by the editor itself (avoids sync loop)
    if (val === lastEditorHtmlRef.current) return;

    const currentContent = quill.root.innerHTML;
    if (currentContent !== val) {
      quill.clipboard.dangerouslyPasteHTML(val);
    }
  }, [value]);

  return <div ref={wrapperRef} style={{ minHeight: "200px" }} />;
}
