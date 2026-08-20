/* Le cifre da comporre dentro un flap.

   La paletta regge cifre, non simboli: l'unita' sta accanto, in `.unit`. Nel
   riferimento di Quadro Partenze il flap dice `9,90` e il simbolo non c'e' —
   il valore comincia al bordo della paletta, cosi' una colonna di prezzi si
   allinea sulla prima cifra e non su un glifo che cifra non e'.

   Il separatore decimale segue la lingua: virgola in italiano, punto in
   inglese. `toFixed` dava sempre il punto, anche in italiano. */
export function formatAmount(value, lang) {
  return Number(value ?? 0).toLocaleString(lang === 'it' ? 'it-IT' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
