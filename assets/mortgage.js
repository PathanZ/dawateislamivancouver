// Islamic Centre mortgage figures, used by the debt chart and the Qarz-e-Hasna calculator
// on the Donate page. Update these numbers whenever the balance changes.
//
//   original - the total amount borrowed from the bank (CAD)
//   paid     - how much of that has been paid off so far (CAD)
//   rate     - the bank's yearly interest rate, in percent (e.g. 6.5 for 6.5%)
//   asOf     - the date these figures were last checked, as YEAR-MONTH-DAY
//   example  - true while these are placeholder numbers; set to false once the real figures are in

window.FEM_MORTGAGE = {
  original: 1200000,
  paid: 350000,
  rate: 6.5,
  asOf: "2026-10-01",
  example: true
};
