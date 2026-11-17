import { signal } from '@angular/core';

import { diaDaSemana, paraISO, somarDias } from './util';

const hhmm = (d: Date): string => `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;

const inicio = new Date();

/** A data de hoje ('aaaa-mm-dd'), do relógio do computador. Atualiza sozinha (inclusive na virada do dia). */
export const hojeAtual = signal(paraISO(inicio));
/** A hora de agora ('HH:MM'), do relógio do computador. Atualiza sozinha. */
export const horaAtual = signal(hhmm(inicio));

if (typeof window !== 'undefined') {
  setInterval(() => {
    const agora = new Date();
    hojeAtual.set(paraISO(agora));
    horaAtual.set(hhmm(agora));
  }, 15_000);
}

/** Segunda-feira da semana em que o sistema foi aberto: a agenda de teste é montada a partir dela. */
export const SEGUNDA_BASE = somarDias(hojeAtual(), -diaDaSemana(hojeAtual()));
