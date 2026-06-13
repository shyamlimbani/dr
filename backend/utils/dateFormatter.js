/**
 * Formats a date string, timestamp, or Date object into DD-MM-YYYY format.
 * Returns the formatted date string, or the original input if it's invalid/falsy.
 */
const formatDate = (dateInput) => {
  if (!dateInput) return '';

  const dateStr = String(dateInput).trim();
  
  // If already in DD-MM-YYYY format, return as-is
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    return dateStr;
  }

  // Handle YYYY-MM-DD strings directly for speed & correctness
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const parts = dateStr.split('-');
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }

  // Handle ISO date strings or Date objects
  const date = new Date(dateInput);
  if (isNaN(date.getTime())) {
    return dateStr;
  }

  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();

  return `${day}-${month}-${year}`;
};

module.exports = {
  formatDate
};
