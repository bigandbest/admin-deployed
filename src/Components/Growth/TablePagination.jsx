import PropTypes from "prop-types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../UI/button";

// "Showing 1–20 of 248" + Previous/Next. Accepts the backend pagination shape { page, limit, total, pages }.
export default function TablePagination({ pagination, page, onPageChange }) {
  if (!pagination || !pagination.total) return null;
  const limit = pagination.limit || 20;
  const totalPages = pagination.pages || pagination.totalPages || Math.ceil(pagination.total / limit);
  const from = (page - 1) * limit + 1;
  const to = Math.min(page * limit, pagination.total);
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-sm text-muted-foreground">
      <span>
        Showing {from}–{to} of {pagination.total}
      </span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>
          <ChevronLeft className="size-4" /> Previous
        </Button>
        <span className="tabular-nums">
          {page} / {totalPages}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>
          Next <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}

TablePagination.propTypes = {
  pagination: PropTypes.object,
  page: PropTypes.number.isRequired,
  onPageChange: PropTypes.func.isRequired,
};
