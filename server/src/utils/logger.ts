export const log = (...args: any[]) => {
    if (process.env.NODE_ENV !== 'production') {
        console.log(...args);
    }
};

export const error = (...args: any[]) => {
    // Errors should generally still be logged in production, 
    // but we can wrap them here if we want to filter them later.
    console.error(...args);
};
