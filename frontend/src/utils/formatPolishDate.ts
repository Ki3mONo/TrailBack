import { format } from "date-fns";
import { pl } from "date-fns/locale";

export function formatPolishDate(dateString?: string): string {
    if (!dateString) return "?";
    const date = new Date(dateString);
    return format(date, "EEEE d MMMM yyyy", { locale: pl });
}
