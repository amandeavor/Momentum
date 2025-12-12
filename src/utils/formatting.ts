export const formatDate = (date: Date, format: string): string => {
    const options: Intl.DateTimeFormatOptions = {};

    if (format.includes('year')) options.year = 'numeric';
    if (format.includes('month')) options.month = 'long';
    if (format.includes('day')) options.day = 'numeric';

    return new Intl.DateTimeFormat('en-US', options).format(date);
};

export const formatCurrency = (amount: number, currency: string = 'USD'): string => {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency,
    }).format(amount);
};

export const capitalizeFirstLetter = (string: string): string => {
    return string.charAt(0).toUpperCase() + string.slice(1);
};