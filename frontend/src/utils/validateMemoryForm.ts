interface ValidateMemoryFormParams {
    title: string;
    desc: string;
    date: string;
    files: File[];
    position: [number, number] | null;
}

export function validateMemoryForm({ title, desc, date, files, position }: ValidateMemoryFormParams): string | undefined {
    if (!title.trim() || !desc.trim() || !date.trim()) {
        return "Uzupełnij wszystkie pola: tytuł, opis i datę.";
    }

    if (!position) {
        return "Wskaż lokalizację na mapie.";
    }

    if (files.length === 0) {
        return "Dodaj przynajmniej jedno zdjęcie.";
    }

    const parsedDate = new Date(date);
    const now = new Date();
    if (isNaN(parsedDate.getTime())) {
        return "Podana data jest nieprawidłowa.";
    }

    if (parsedDate > now) {
        return "Data nie może być z przyszłości.";
    }

    return undefined; // wszystko OK
}
