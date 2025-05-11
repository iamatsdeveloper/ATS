export const countDecimalPlaces = (number) => {
    // Convert the number to a string
    const numStr = number.toString();

    // Check if there is a decimal point
    if (numStr.includes('.')) {
        // Split the number at the decimal point and return the length of the decimal part
        return numStr.split('.')[1].length;
    }

    // If there is no decimal point, return 0
    return 0;
}

export const getFormattedDate = (date = null) => {
    const now = date == null ? new Date() : new Date(date);

    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0'); // Months are zero-indexed, so we add 1
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export const getISTISOString = () => {
    const ist = new Date(Date.now() + 330 * 60000);
    return ist.toISOString();
};