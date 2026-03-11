export type CampaignScheduleType = 'DEFAULT' | 'FAST';

export interface CampaignScheduleDisplayRow {
    label: '신청기간' | '발표날짜' | '체험기간' | '캠페인 기간' | '발표' | '체험';
    value: string;
    tone: 'application' | 'selection' | 'experience';
}

export interface CampaignScheduleRange {
    start: string;
    end: string;
}

export interface CampaignSchedule {
    scheduleType: CampaignScheduleType;
    recruitmentStartDate: string;
    applicationStartDate: string;
    applicationEndDate: string;
    firstSelectionDate: string;
    experienceStartDate: string;
    reviewDeadline: string;
    displayRows: CampaignScheduleDisplayRow[];
    calendarHighlights: {
        application: CampaignScheduleRange;
        selection: string;
        experience: CampaignScheduleRange;
    };
}

const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

function toShiftedUtcDate(date: Date): Date {
    return new Date(date.getTime() + KST_OFFSET_MS);
}

export function formatKstDate(date: Date = new Date()): string {
    const shifted = toShiftedUtcDate(date);
    const year = shifted.getUTCFullYear();
    const month = String(shifted.getUTCMonth() + 1).padStart(2, '0');
    const day = String(shifted.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function parseDateString(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(Date.UTC(year, month - 1, day));
}

export function addDays(dateString: string, days: number): string {
    const date = parseDateString(dateString);
    return formatUtcDate(new Date(date.getTime() + (days * DAY_MS)));
}

function formatUtcDate(date: Date): string {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

export function formatShortDate(dateString: string): string {
    const [year, month, day] = dateString.split('-');
    return `${year.slice(2)}.${month}.${day}`;
}

export function normalizeScheduleType(rawValue: unknown): CampaignScheduleType {
    const value = String(rawValue || '').toUpperCase();
    if (value === 'FAST' || value === 'ALWAYS') {
        return 'FAST';
    }

    return 'DEFAULT';
}

export function buildCampaignSchedule(
    scheduleTypeInput: unknown,
    baseDate: string = formatKstDate()
): CampaignSchedule {
    const scheduleType = normalizeScheduleType(scheduleTypeInput);

    if (scheduleType === 'FAST') {
        const campaignEndDate = addDays(baseDate, 13);

        return {
            scheduleType,
            recruitmentStartDate: baseDate,
            applicationStartDate: baseDate,
            applicationEndDate: campaignEndDate,
            firstSelectionDate: baseDate,
            experienceStartDate: baseDate,
            reviewDeadline: campaignEndDate,
            displayRows: [
                { label: '캠페인 기간', value: `${formatShortDate(baseDate)}-${formatShortDate(campaignEndDate)}`, tone: 'application' },
                { label: '발표', value: '신청 건별 수시 선정', tone: 'selection' },
                { label: '체험', value: '선정 후 7일 이내 체험', tone: 'experience' },
            ],
            calendarHighlights: {
                application: { start: baseDate, end: campaignEndDate },
                selection: baseDate,
                experience: { start: baseDate, end: campaignEndDate },
            },
        };
    }

    const applicationEndDate = addDays(baseDate, 6);
    const firstSelectionDate = applicationEndDate;
    const experienceStartDate = addDays(baseDate, 7);
    const reviewDeadline = addDays(baseDate, 13);

    return {
        scheduleType,
        recruitmentStartDate: baseDate,
        applicationStartDate: baseDate,
        applicationEndDate,
        firstSelectionDate,
        experienceStartDate,
        reviewDeadline,
        displayRows: [
            { label: '신청기간', value: `${formatShortDate(baseDate)}-${formatShortDate(applicationEndDate)}`, tone: 'application' },
            { label: '발표날짜', value: formatShortDate(firstSelectionDate), tone: 'selection' },
            { label: '체험기간', value: `${formatShortDate(experienceStartDate)}-${formatShortDate(reviewDeadline)}`, tone: 'experience' },
        ],
        calendarHighlights: {
            application: { start: baseDate, end: applicationEndDate },
            selection: firstSelectionDate,
            experience: { start: experienceStartDate, end: reviewDeadline },
        },
    };
}

export function getDateRangeArray(range: CampaignScheduleRange): Date[] {
    const startDate = parseDateString(range.start);
    const endDate = parseDateString(range.end);
    const dates: Date[] = [];

    for (let cursor = startDate.getTime(); cursor <= endDate.getTime(); cursor += DAY_MS) {
        dates.push(new Date(cursor));
    }

    return dates;
}
