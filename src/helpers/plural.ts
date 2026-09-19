export default (n: number, form1: string, form2: string, form3: string, returnWithNumber: boolean = false) => {
  const result = returnWithNumber ? `${n} ` : '';

  n = Math.abs(n);
  if (n % 10 === 1 && n % 100 !== 11) {
    return result + form1;
  } else if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) {
    return result + form2;
  } else {
    return result + form3;
  }
};
