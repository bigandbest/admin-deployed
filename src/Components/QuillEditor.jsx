import React, { useEffect, useRef } from "react";
import Quill from "quill";
import "quill/dist/quill.snow.css";

const QuillEditor = ({
  value,
  onChange,
  placeholder = "Write something...",
  label,
  style = {},
}) => {
  const containerRef = useRef(null);
  const quillRef = useRef(null);
  const isInternalChange = useRef(false);

  useEffect(() => {
    if (containerRef.current && !quillRef.current) {
      quillRef.current = new Quill(containerRef.current, {
        theme: "snow",
        placeholder,
        modules: {
          toolbar: [
            [{ header: [1, 2, 3, false] }],
            ["bold", "italic", "underline", "strike"],
            [{ list: "ordered" }, { list: "bullet" }],
            ["link", "image"],
            ["clean"],
          ],
        },
      });

      quillRef.current.on("text-change", (delta, oldDelta, source) => {
        if (source === "user") {
          isInternalChange.current = true;
          const html = quillRef.current.getSemanticHTML();
          onChange(html);
          // Unlock external updates after a short delay to allow loop to settle if any
          // But mainly we flag it so the immediate useEffect response ignores it
          setTimeout(() => (isInternalChange.current = false), 100);
        }
      });

      // Initial Value
      if (value) {
        quillRef.current.clipboard.dangerouslyPasteHTML(value);
      }
    }
  }, []);

  // Handle external value changes (e.g. async data load)
  useEffect(() => {
    if (quillRef.current && value !== undefined) {
      const currentHTML = quillRef.current.getSemanticHTML();
      // Only update if not an internal change and content is different
      if (!isInternalChange.current && value !== currentHTML) {
        // Double check against raw innerHTML to avoid loop on equivalent HTML
        if (quillRef.current.root.innerHTML !== value) {
          // Keep selection if possible? Hard with dangerousPaste.
          // Usually async load happens once at start.
          quillRef.current.clipboard.dangerouslyPasteHTML(value);
        }
      }
    }
  }, [value]);

  return (
    <div className="mb-4" style={style}>
      {label && (
        <label
          style={{
            display: "inline-block",
            fontSize: "14px",
            fontWeight: 500,
            color: "#212529",
            marginBottom: "4px",
          }}
        >
          {label}
        </label>
      )}
      <div
        ref={containerRef}
        style={{ minHeight: "150px", backgroundColor: "white" }}
      />
    </div>
  );
};

export default QuillEditor;
