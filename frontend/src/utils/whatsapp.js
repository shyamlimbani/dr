export const getWhatsAppUrl = (mobileNumber, text = '') => {
  if (!mobileNumber) return '#';
  
  // Extract just the digits
  let cleanNumber = mobileNumber.replace(/\D/g, '');
  
  // If it's exactly 10 digits, prepend 91 (India country code)
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }
  
  let url = `https://wa.me/${cleanNumber}`;
  if (text) {
    url += `?text=${encodeURIComponent(text)}`;
  }
  
  return url;
};
