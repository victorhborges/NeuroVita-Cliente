import { Component, computed, input } from '@angular/core';

import { Perfil } from '../../shared/perfil';
import { TituloPagina } from '../../shared/titulo-pagina/titulo-pagina';
import { TOPICOS_AJUDA } from './topicos';

/** Um tutorial da Ajuda (cadastro, agenda, prontuários ou agendamentos), escolhido pelo endereço. */
@Component({
  selector: 'app-ajuda-topico',
  imports: [TituloPagina],
  templateUrl: './ajuda-topico.html',
})
export class AjudaTopico {
  readonly perfil = input<Perfil>('secretaria');
  /** Vem da rota: /:perfil/ajuda/:topico */
  readonly topico = input.required<string>();

  protected readonly voltar = computed(() => `/${this.perfil()}/ajuda`);
  protected readonly conteudo = computed(() => TOPICOS_AJUDA[this.topico()] ?? null);
}
