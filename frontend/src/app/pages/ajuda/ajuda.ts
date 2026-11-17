import { Component, computed, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { Icone, NomeIcone } from '../../shared/icone/icone';
import { Perfil } from '../../shared/perfil';
import { normalizar } from '../../shared/util';
import { TituloPagina } from '../../shared/titulo-pagina/titulo-pagina';

interface Topico {
  id: string;
  titulo: string;
  descricao: string;
  icone: NomeIcone;
}

const TOPICOS: Topico[] = [
  { id: 'cadastro', titulo: 'Cadastro e Perfis', descricao: 'Como cadastrar pacientes, profissionais e secretárias.', icone: 'usuario' },
  { id: 'agenda', titulo: 'Agenda Principal', descricao: 'Visualizar todos os agendamentos.', icone: 'calendario' },
  { id: 'prontuarios', titulo: 'Prontuários', descricao: 'Como visualizar o prontuário e os documentos de cada paciente.', icone: 'arquivo-texto' },
  { id: 'agendamentos', titulo: 'Agendamentos', descricao: 'Como marcar e visualizar as consultas.', icone: 'calendario' },
];

/** Telefone do suporte (TODO: trocar pelo número real da clínica). */
export const TELEFONE_SUPORTE = '(61) 4002-8922';

/** Central de ajuda: busca, tópicos, fale conosco e suporte. */
@Component({
  selector: 'app-ajuda',
  imports: [Icone, RouterLink, TituloPagina],
  templateUrl: './ajuda.html',
})
export class Ajuda {
  readonly perfil = input<Perfil>('secretaria');
  protected readonly raiz = computed(() => `/${this.perfil()}/ajuda`);
  protected readonly busca = signal('');
  protected readonly telefone = TELEFONE_SUPORTE;
  protected readonly telefoneLink = 'tel:+55' + TELEFONE_SUPORTE.replace(/\D/g, '');

  protected readonly topicos = computed(() => {
    const termo = normalizar(this.busca());
    return TOPICOS.filter((t) => !termo || normalizar(t.titulo + ' ' + t.descricao).includes(termo));
  });
}
