import PropTypes from "prop-types";
import { Columns3 } from "lucide-react";
import { Button } from "../UI/button";
import { DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../UI/dropdown-menu";

// Show/hide table columns. `columns` = [{ id, label }]; `visibility` = { [id]: boolean } (missing = visible).
export default function ColumnsMenu({ columns, visibility, onChange }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm"><Columns3 className="size-4" /> Columns</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuLabel>Show columns</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {columns.map((c) => (
          <DropdownMenuCheckboxItem
            key={c.id}
            checked={visibility[c.id] !== false}
            onCheckedChange={(v) => onChange({ ...visibility, [c.id]: !!v })}
            onSelect={(e) => e.preventDefault()}
          >
            {c.label}
          </DropdownMenuCheckboxItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

ColumnsMenu.propTypes = {
  columns: PropTypes.arrayOf(PropTypes.shape({ id: PropTypes.string, label: PropTypes.string })).isRequired,
  visibility: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
};
