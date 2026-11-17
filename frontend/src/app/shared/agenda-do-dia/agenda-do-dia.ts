import { Component, input } from '@angular/core';

import { Avatar } from '../avatar/avatar';
import { ChipStatus } from '../chip-status/chip-status';
import { Icone } from '../icone/icone';
import { ItemAgenda } from '../dados-demo';

/** Tabela dos atendimentos do dia exibida no painel inicial. */
@Component({
  selector: 'app-agenda-do-dia',
  imports: [Avatar, ChipStatus, Icone],
  templateUrl: './agenda-do-dia.html',
})
export class AgendaDoDia {
  readonly itens = input.required<ItemAgenda[]>();
}
