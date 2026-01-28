import { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

interface QuillEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

let quillInstance: Quill | null = null;

export default function QuillEditor({
  value,
  onChange,
  placeholder = "Enter description...",
}: QuillEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current || !containerRef.current) return;
    
    // Prevent double initialization in React StrictMode
    initializedRef.current = true;

    // Clean up any existing instance
    if (quillInstance) {
      try {
        quillInstance.off("text-change");
        quillInstance = null;
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Small delay to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!containerRef.current) return;

      const quill = new Quill(containerRef.current, {
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

      quillInstance = quill;

      if (value) {
        quill.clipboard.dangerouslyPasteHTML(value);
      }

      quill.on("text-change", () => {
        const html = quill.root.innerHTML;
        onChange(html === "<p><br></p>" ? "" : html);
      });
    }, 50);

    return () => {
      clearTimeout(timer);
      initializedRef.current = false;
      if (quillInstance) {
        quillInstance.off("text-change");
        quillInstance = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!quillInstance || !value) return;

    const currentContent = quillInstance.root.innerHTML;
    if (currentContent !== value && value !== currentContent) {
      quillInstance.clipboard.dangerouslyPasteHTML(value);
    }
  }, [value]);

  return <div ref={containerRef} style={{ minHeight: "200px" }} />;
}
