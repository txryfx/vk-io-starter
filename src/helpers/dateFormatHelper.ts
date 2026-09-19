import plural from "./plural";

/**
 * `YYYY-MM-DD HH:MM:SS` => `Date()`
 */
export function SQLToDate(input: string): Date | null {
    const match = input.match(/^(\d{4})-(\d{2})-(\d{2}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!match) {
        return null;
    }

    const [, y, mo, d, hh, mm, ss] = match;
    return new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss)
    );
}

/**
 * `DD.MM.YYYY HH:MM:SS` => `Date()`
 */
export function humanToDate(input: string): Date | null {
    const match = input.match(/^(\d{2})\.(\d{2})\.(\d{4}) (\d{2}):(\d{2}):(\d{2})$/);
    if (!match) {
        return null;
    }

    const [, d, mo, y, hh, mm, ss] = match;
    return new Date(
        Number(y),
        Number(mo) - 1,
        Number(d),
        Number(hh),
        Number(mm),
        Number(ss)
    );
}

/**
 * `Date()` => `YYYY-MM-DD HH:MM:SS`
 */
export function dateToSQL(input: Date = new Date(), showTime: boolean = true): string {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, "0");
    const day = String(input.getDate()).padStart(2, "0");
    const hh = String(input.getHours()).padStart(2, "0");
    const mm = String(input.getMinutes()).padStart(2, "0");
    const ss = String(input.getSeconds()).padStart(2, "0");
    return `${y}-${m}-${day}` + (showTime ? ` ${hh}:${mm}:${ss}` : "");
}

/**
 * `Date()` => `DD.MM.YYYY HH:MM:SS`
 */
export function dateToHuman(input: Date = new Date(), showTime: boolean = true, separator: string = ' в '): string {
    const y = input.getFullYear();
    const m = String(input.getMonth() + 1).padStart(2, "0");
    const d = String(input.getDate()).padStart(2, "0");
    const hh = String(input.getHours()).padStart(2, "0");
    const mm = String(input.getMinutes()).padStart(2, "0");
    const ss = String(input.getSeconds()).padStart(2, "0");
    return `${d}.${m}.${y}` + (showTime ? `${separator}${hh}:${mm}:${ss}` : "");
}

/**
 * `YYYY-MM-DD HH:MM:SS` => `DD.MM.YYYY HH:MM:SS`
 */
export function SQLToHuman(input: string, showTime: boolean = true, separator: string = ' в '): string {
    const date = SQLToDate(input);
    if (!date) {
        return input;
    }

    return dateToHuman(date, showTime, separator);
}

/**
 * `DD.MM.YYYY HH:MM:SS` => `YYYY-MM-DD HH:MM:SS`
 */
export function humanToSQL(input: string, showTime: boolean = true): string {
    const date = humanToDate(input);
    if (!date) {
        return input;
    }

    return dateToSQL(date, showTime);
}

/**
 * `seconds` => `HH:MM:SS`
 */
export function secondsToTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    const formattedHours = hours.toString().padStart(2, '0');
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const formattedSeconds = remainingSeconds.toString().padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}:${formattedSeconds}`;
}

export function formatDuration(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    const parts: string[] = [];
    if (hours > 0) {
        parts.push(plural(hours, 'час', 'часа', 'часов', true));
    }

    if (minutes > 0) {
        parts.push(plural(minutes, 'минута', 'минуты', 'минут', true));
    }

    if (seconds > 0 || parts.length === 0) {
        parts.push(plural(seconds, 'секунда', 'секунды', 'секунд', true));
    }

    return parts.join(' ');
}
