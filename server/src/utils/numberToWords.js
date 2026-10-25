// Converts number to Indian Rupees format in words
export function convertNumberToWords(amount) {
  const words = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'
  ];
  const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  function numToWords(n) {
    if (n === 0) return '';
    if (n < 20) return words[n] + ' ';
    if (n < 100) return tens[Math.floor(n / 10)] + ' ' + (n % 10 !== 0 ? words[n % 10] + ' ' : '');
    if (n < 1000) return words[Math.floor(n / 100)] + ' Hundred ' + (n % 100 !== 0 ? numToWords(n % 100) : '');
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + 'Thousand ' + (n % 1000 !== 0 ? numToWords(n % 1000) : '');
    if (n < 10000000) return numToWords(Math.floor(n / 100000)) + 'Lakh ' + (n % 100000 !== 0 ? numToWords(n % 100000) : '');
    return numToWords(Math.floor(n / 10000000)) + 'Crore ' + (n % 10000000 !== 0 ? numToWords(n % 10000000) : '');
  }

  if (amount === 0) return 'Rupees Zero Only';

  const num = Math.round(amount * 100) / 100;
  const rupees = Math.floor(num);
  const paise = Math.round((num - rupees) * 100);

  let result = 'Rupees ' + numToWords(rupees);
  if (paise > 0) {
    result += 'and ' + numToWords(paise) + 'Paise ';
  }
  return result.trim() + ' Only';
}
