import type { PrestazioneItem, TaxConfig, TaxCalculationResult } from '../types';

/**
 * Rounds a number to 2 decimal places cleanly avoiding float issues
 */
export function roundCurrency(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/**
 * Calculates reverse gross amount from agreed net amount (scorporo dal netto al lordo)
 */
export function convertNetToGross(netAmount: number, config: TaxConfig): number {
  if (!netAmount || netAmount <= 0) return 0;

  const R = (config.ritenutaPercentuale || 20) / 100;
  const I = (config.hasContributoPrevidenziale && config.contributoPercentuale > 0)
    ? (config.contributoPercentuale / 100)
    : 0;

  let multiplier = 1 - R;
  if (I > 0) {
    if (config.contributoInclusoInBaseRitenuta) {
      multiplier = (1 + I) - R * (1 + I);
    } else {
      multiplier = (1 + I) - R;
    }
  }

  if (multiplier <= 0) return netAmount;
  return roundCurrency(netAmount / multiplier);
}

/**
 * Calculates withholding tax breakdown parametrically, supporting net agreed fees and documented expense reimbursements ex Art. 15 DPR 633/72
 */
export function calculateTax(prestazioni: PrestazioneItem[], config: TaxConfig): TaxCalculationResult {
  // 1. Separate fees from documented expense reimbursements, auto-converting Net agreed fees to Gross
  const totaleCompensi = roundCurrency(
    prestazioni
      .filter((item) => item.tipoItem !== 'rimborso_spesa')
      .reduce((acc, item) => {
        const val = Number(item.importo) || 0;
        if (item.tipoItem === 'prestazione_netto') {
          return acc + convertNetToGross(val, config);
        }
        return acc + val;
      }, 0)
  );

  const totaleRimborsiSpese = roundCurrency(
    prestazioni
      .filter((item) => item.tipoItem === 'rimborso_spesa')
      .reduce((acc, item) => acc + (Number(item.importo) || 0), 0)
  );

  // 2. Contributo previdenziale (es. Rivalsa INPS 4%) calculated on fee earnings
  let contributoPrevidenziale = 0;
  if (config.hasContributoPrevidenziale && config.contributoPercentuale > 0) {
    contributoPrevidenziale = roundCurrency(totaleCompensi * (config.contributoPercentuale / 100));
  }

  // 3. Altre voci
  let altreVociTotale = 0;
  let altreVociImponibili = 0;

  if (config.altreVoci && Array.isArray(config.altreVoci)) {
    config.altreVoci.forEach((voce) => {
      const val = roundCurrency(Number(voce.importo) || 0);
      const signedVal = voce.tipo === 'detrazione' ? -val : val;
      altreVociTotale += signedVal;
      if (voce.soggettaARitenuta) {
        altreVociImponibili += signedVal;
      }
    });
  }
  altreVociTotale = roundCurrency(altreVociTotale);
  altreVociImponibili = roundCurrency(altreVociImponibili);

  // 4. Base imponibile ritenuta (EXCLUDES expense reimbursements ex Art. 15 DPR 633/72)
  let baseImponibileRitenuta = totaleCompensi;
  if (config.contributoInclusoInBaseRitenuta) {
    baseImponibileRitenuta += contributoPrevidenziale;
  }
  baseImponibileRitenuta += altreVociImponibili;
  baseImponibileRitenuta = roundCurrency(Math.max(0, baseImponibileRitenuta));

  // 5. Importo Ritenuta d'Acconto (20%)
  let ritenutaImporto = 0;
  if (config.ritenutaPercentuale > 0) {
    ritenutaImporto = roundCurrency(baseImponibileRitenuta * (config.ritenutaPercentuale / 100));
  }

  // 6. Marca da bollo (€ 2,00 se totale prima del bollo > € 77,47)
  const totalePrimaDelBollo = totaleCompensi + totaleRimborsiSpese;
  let marcaDaBollo = 0;
  if (config.hasMarcaDaBollo && totalePrimaDelBollo > config.marcaDaBolloSoglia) {
    marcaDaBollo = roundCurrency(config.marcaDaBolloImporto || 2.00);
  }

  // 7. Totale Lordo & Netto da Corrispondere
  const totaleLordoDocumento = roundCurrency(totaleCompensi + totaleRimborsiSpese + contributoPrevidenziale + altreVociTotale);
  
  let lordoTotaleFatturato = totaleLordoDocumento;
  if (config.marcaDaBolloAddebito === 'committente') {
    lordoTotaleFatturato += marcaDaBollo;
  }

  const totaleNetto = roundCurrency(Math.max(0, lordoTotaleFatturato - ritenutaImporto));

  return {
    totaleCompensi,
    totaleRimborsiSpese,
    contributoPrevidenziale,
    baseImponibileRitenuta,
    ritenutaImporto,
    marcaDaBollo,
    altreVociTotale,
    totaleLordoDocumento,
    totaleNetto,
  };
}
